import jwt from 'jsonwebtoken';
import { prisma, redis, logger, env } from '../../config';
import { getWhatsAppService } from '../whatsapp/whatsapp.service';
import { AppError } from '../../common/errors';

interface TokenPayload {
  userId: string;
  businessId: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly OTP_COOLDOWN_SECONDS = 60;

  /**
   * Generate OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Request OTP for phone number
   */
  async requestOTP(phone: string): Promise<{ sent: boolean; expiresIn: number }> {
    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check cooldown
    const cooldownKey = `otp:cooldown:${normalizedPhone}`;
    const hasCooldown = await redis.get(cooldownKey);

    if (hasCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      throw new AppError(`Aguarde ${ttl} segundos para solicitar novo código`, 429);
    }

    // Find user by phone
    const user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      include: { business: true },
    });

    if (!user) {
      // Don't reveal if user exists or not
      logger.info({ phone: normalizedPhone }, 'OTP requested for non-existent user');
      // Simulate success for security
      return { sent: true, expiresIn: this.OTP_EXPIRY_MINUTES * 60 };
    }

    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt,
      },
    });

    // Set cooldown
    await redis.setex(cooldownKey, this.OTP_COOLDOWN_SECONDS, '1');

    // Send OTP via WhatsApp if business has WhatsApp connected
    if (user.business.whatsappInstanceId && user.business.whatsappConnected) {
      try {
        const whatsapp = getWhatsAppService(user.business.whatsappInstanceId);
        await whatsapp.sendText({
          number: normalizedPhone,
          text: `🔐 Seu código de acesso bela360:\n\n*${otp}*\n\nVálido por ${this.OTP_EXPIRY_MINUTES} minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`,
        });
      } catch (error) {
        logger.error({ error, phone: normalizedPhone }, 'Failed to send OTP via WhatsApp');
        // Continue anyway - user might be logging in from a different business
      }
    }

    // Also store OTP in Redis for backup verification
    const otpKey = `otp:${normalizedPhone}`;
    await redis.setex(otpKey, this.OTP_EXPIRY_MINUTES * 60, otp);

    logger.info({ phone: normalizedPhone }, 'OTP sent successfully');

    return { sent: true, expiresIn: this.OTP_EXPIRY_MINUTES * 60 };
  }

  /**
   * Verify OTP and return tokens
   */
  async verifyOTP(phone: string, otp: string): Promise<AuthTokens> {
    const normalizedPhone = phone.replace(/\D/g, '');

    // Find user
    const user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      include: { business: true },
    });

    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Check OTP
    const isValidOTP =
      user.otpCode === otp && user.otpExpiresAt && user.otpExpiresAt > new Date();

    // Also check Redis backup
    const redisOTP = await redis.get(`otp:${normalizedPhone}`);
    const isValidRedisOTP = redisOTP === otp;

    if (!isValidOTP && !isValidRedisOTP) {
      // Track failed attempts
      const attemptsKey = `otp:attempts:${normalizedPhone}`;
      const attempts = await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 300); // 5 minutes

      if (attempts >= 5) {
        // Lock for 15 minutes
        await redis.setex(`otp:locked:${normalizedPhone}`, 900, '1');
        throw new AppError('Muitas tentativas. Tente novamente em 15 minutos.', 429);
      }

      throw new AppError('Código inválido ou expirado', 401);
    }

    // Clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        lastLoginAt: new Date(),
      },
    });

    // Clear Redis keys
    await redis.del(`otp:${normalizedPhone}`);
    await redis.del(`otp:attempts:${normalizedPhone}`);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
    });

    // Store refresh token
    await redis.setex(
      `refresh:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      tokens.refreshToken
    );

    logger.info({ userId: user.id }, 'User logged in successfully');

    return tokens;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;

      // Check if refresh token is still valid in Redis
      const storedToken = await redis.get(`refresh:${payload.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Token de atualização inválido', 401);
      }

      // Get user to verify still active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('Usuário não encontrado ou inativo', 401);
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        userId: user.id,
        businessId: user.businessId,
        role: user.role,
      });

      // Update refresh token in Redis
      await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expirado', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Token inválido', 401);
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    await redis.del(`refresh:${userId}`);
    logger.info({ userId }, 'User logged out');
  }

  /**
   * Validate access token
   */
  validateToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expirado', 401);
      }
      throw new AppError('Token inválido', 401);
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // Parse expiry for response
    const expiresIn = this.parseExpiryToSeconds(env.JWT_EXPIRES_IN);

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Parse JWT expiry string to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 3600;
      case 'd':
        return num * 86400;
      default:
        return 3600;
    }
  }
}

export const authService = new AuthService();
