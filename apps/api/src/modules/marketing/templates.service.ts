import { z } from 'zod';
import { prisma, logger } from '../../config';
import { AppError } from '../../common/errors';

// Template categories
export type TemplateCategory = 'STORY' | 'POST' | 'WHATSAPP' | 'PROMO';
export type TemplateOccasion = 'CHRISTMAS' | 'NEWYEAR' | 'VALENTINES' | 'MOTHERS_DAY' | 'FATHERS_DAY' | 'EASTER' | 'BIRTHDAY' | 'PROMOTION' | 'GENERAL';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(3),
  category: z.enum(['STORY', 'POST', 'WHATSAPP', 'PROMO']),
  occasion: z.enum(['CHRISTMAS', 'NEWYEAR', 'VALENTINES', 'MOTHERS_DAY', 'FATHERS_DAY', 'EASTER', 'BIRTHDAY', 'PROMOTION', 'GENERAL']).optional(),
  content: z.string().min(10),
  imageUrl: z.string().url().optional(),
  variables: z.array(z.string()).optional(),
});

// Default templates for new businesses
const DEFAULT_TEMPLATES = [
  // WhatsApp Templates
  {
    name: 'Boas vindas',
    category: 'WHATSAPP',
    occasion: 'GENERAL',
    content: 'Ola {{nome}}! 👋 Bem-vindo(a) ao {{salao}}! Estamos muito felizes em te receber. Agende seu primeiro atendimento e aproveite uma experiencia incrivel.',
    variables: ['nome', 'salao'],
  },
  {
    name: 'Promocao Relampago',
    category: 'WHATSAPP',
    occasion: 'PROMOTION',
    content: '⚡ PROMOCAO RELAMPAGO ⚡\n\nOla {{nome}}!\n\nSomente hoje: {{servico}} com {{desconto}}% de desconto!\n\nAgende agora e garanta seu horario.\n\n{{salao}}',
    variables: ['nome', 'servico', 'desconto', 'salao'],
  },
  {
    name: 'Lembrete de Retorno',
    category: 'WHATSAPP',
    occasion: 'GENERAL',
    content: 'Ola {{nome}}! 💇‍♀️\n\nFaz {{dias}} dias desde sua ultima visita. Que tal agendar seu proximo horario?\n\nSentimos sua falta!\n\n{{salao}}',
    variables: ['nome', 'dias', 'salao'],
  },
  {
    name: 'Aniversario',
    category: 'WHATSAPP',
    occasion: 'BIRTHDAY',
    content: '🎂 Feliz Aniversario, {{nome}}! 🎉\n\nPara comemorar seu dia especial, preparamos um presente: {{desconto}}% de desconto em qualquer servico!\n\nAgende e celebre conosco!\n\n{{salao}}',
    variables: ['nome', 'desconto', 'salao'],
  },
  {
    name: 'Confirmacao de Agendamento',
    category: 'WHATSAPP',
    occasion: 'GENERAL',
    content: '✅ Agendamento Confirmado!\n\n{{nome}}, seu horario esta reservado:\n\n📋 Servico: {{servico}}\n📅 Data: {{data}}\n⏰ Horario: {{horario}}\n👤 Profissional: {{profissional}}\n\nTe esperamos!\n\n{{salao}}',
    variables: ['nome', 'servico', 'data', 'horario', 'profissional', 'salao'],
  },
  // Post Templates
  {
    name: 'Resultado de Trabalho',
    category: 'POST',
    occasion: 'GENERAL',
    content: '✨ Mais um trabalho finalizado com sucesso! ✨\n\nNossa cliente amou o resultado do {{servico}}! 😍\n\nAgende seu horario e transforme seu visual!\n\n#{{salao}} #beleza #transformacao',
    variables: ['servico', 'salao'],
  },
  {
    name: 'Promocao do Mes',
    category: 'POST',
    occasion: 'PROMOTION',
    content: '🔥 PROMOCAO DO MES 🔥\n\n{{servico}} com {{desconto}}% de desconto!\n\nValido ate o final do mes.\n\nAgende ja pelo link na bio!\n\n#{{salao}} #promocao #beleza',
    variables: ['servico', 'desconto', 'salao'],
  },
  // Story Templates
  {
    name: 'Horarios Disponiveis',
    category: 'STORY',
    occasion: 'GENERAL',
    content: '📅 HORARIOS DISPONIVEIS\n\nTemos vagas para {{dia}}!\n\nAgende:\n💬 Responda esse story\n🔗 Link na bio\n📞 Ligue para nos\n\n#{{salao}}',
    variables: ['dia', 'salao'],
  },
  {
    name: 'Antes e Depois',
    category: 'STORY',
    occasion: 'GENERAL',
    content: '➡️ ARRASTA PRO LADO\n\nOlha essa transformacao incrivel! 🤩\n\n{{servico}} feito pela nossa equipe.\n\nQuer transformar seu visual tambem?\n\n#{{salao}} #antesedepois',
    variables: ['servico', 'salao'],
  },
  // Promo Templates
  {
    name: 'Natal',
    category: 'PROMO',
    occasion: 'CHRISTMAS',
    content: '🎄 NATAL NO {{salao}} 🎄\n\nFique linda para as festas!\n\n{{servico}} por apenas R$ {{preco}}\n\nOu leve 2 servicos e ganhe {{desconto}}% de desconto!\n\nAgende ate {{data}}.\n\n#felizNatal #beleza',
    variables: ['salao', 'servico', 'preco', 'desconto', 'data'],
  },
  {
    name: 'Dia das Maes',
    category: 'PROMO',
    occasion: 'MOTHERS_DAY',
    content: '💝 ESPECIAL DIA DAS MAES 💝\n\nPresente perfeito para sua mae!\n\n{{servico}} + {{servico2}} com {{desconto}}% de desconto!\n\nOu compre um vale-presente.\n\nAgende ja!\n\n{{salao}} #diadasmaes',
    variables: ['servico', 'servico2', 'desconto', 'salao'],
  },
];

export class TemplatesService {
  /**
   * Create a content template
   */
  async create(businessId: string, data: z.infer<typeof createTemplateSchema>) {
    const validated = createTemplateSchema.parse(data);

    // Extract variables from content if not provided
    let variables = validated.variables || [];
    if (variables.length === 0) {
      const matches = validated.content.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        variables = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
      }
    }

    const template = await prisma.contentTemplate.create({
      data: {
        businessId,
        name: validated.name,
        category: validated.category,
        occasion: validated.occasion,
        content: validated.content,
        imageUrl: validated.imageUrl,
        variables,
      },
    });

    logger.info({ templateId: template.id, businessId }, 'Content template created');
    return template;
  }

  /**
   * Get all templates (business + global)
   */
  async getAll(businessId: string, filters?: { category?: TemplateCategory; occasion?: TemplateOccasion }) {
    const where: any = {
      OR: [
        { businessId },
        { businessId: null }, // Global templates
      ],
      isActive: true,
    };

    if (filters?.category) where.category = filters.category;
    if (filters?.occasion) where.occasion = filters.occasion;

    return prisma.contentTemplate.findMany({
      where,
      orderBy: [
        { businessId: 'desc' }, // Business templates first
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get template by ID
   */
  async getById(businessId: string, id: string) {
    const template = await prisma.contentTemplate.findFirst({
      where: {
        id,
        OR: [{ businessId }, { businessId: null }],
      },
    });

    if (!template) {
      throw new AppError('Template nao encontrado', 404);
    }

    return template;
  }

  /**
   * Update template
   */
  async update(businessId: string, id: string, data: Partial<z.infer<typeof createTemplateSchema>>) {
    const template = await prisma.contentTemplate.findFirst({
      where: { id, businessId }, // Can only update own templates
    });

    if (!template) {
      throw new AppError('Template nao encontrado ou nao pode ser editado', 404);
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.category) updateData.category = data.category;
    if (data.occasion) updateData.occasion = data.occasion;
    if (data.content) {
      updateData.content = data.content;
      // Re-extract variables
      const matches = data.content.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        updateData.variables = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
      }
    }
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.variables) updateData.variables = data.variables;

    return prisma.contentTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete template
   */
  async delete(businessId: string, id: string) {
    const template = await prisma.contentTemplate.findFirst({
      where: { id, businessId }, // Can only delete own templates
    });

    if (!template) {
      throw new AppError('Template nao encontrado ou nao pode ser excluido', 404);
    }

    return prisma.contentTemplate.delete({ where: { id } });
  }

  /**
   * Duplicate a template (for customizing global templates)
   */
  async duplicate(businessId: string, id: string, newName?: string) {
    const original = await this.getById(businessId, id);

    return prisma.contentTemplate.create({
      data: {
        businessId,
        name: newName || `${original.name} (copia)`,
        category: original.category,
        occasion: original.occasion,
        content: original.content,
        imageUrl: original.imageUrl,
        variables: original.variables,
      },
    });
  }

  /**
   * Fill template with variables
   */
  fillTemplate(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * Get templates by category with preview
   */
  async getByCategory(businessId: string, category: TemplateCategory) {
    const templates = await this.getAll(businessId, { category });

    // Add preview with sample data
    return templates.map(t => ({
      ...t,
      preview: this.fillTemplate(t.content, this.getSampleVariables()),
    }));
  }

  /**
   * Get sample variables for preview
   */
  private getSampleVariables(): Record<string, string> {
    return {
      nome: 'Maria',
      salao: 'Bela360 Salao',
      servico: 'Corte e Escova',
      servico2: 'Hidratacao',
      desconto: '20',
      dias: '30',
      data: '25/12',
      horario: '14:00',
      profissional: 'Ana',
      preco: '150',
      dia: 'Sabado',
    };
  }

  /**
   * Initialize default templates for a new business
   */
  async initializeDefaults(businessId: string) {
    const existingCount = await prisma.contentTemplate.count({
      where: { businessId },
    });

    // Only initialize if business has no templates
    if (existingCount > 0) return;

    for (const template of DEFAULT_TEMPLATES) {
      await prisma.contentTemplate.create({
        data: {
          businessId,
          ...template,
        },
      });
    }

    logger.info({ businessId, count: DEFAULT_TEMPLATES.length }, 'Default templates initialized');
  }

  /**
   * Get global templates (for seeding)
   */
  async getGlobalTemplates() {
    return prisma.contentTemplate.findMany({
      where: { businessId: null },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Create global template (admin only)
   */
  async createGlobal(data: z.infer<typeof createTemplateSchema>) {
    const validated = createTemplateSchema.parse(data);

    let variables = validated.variables || [];
    if (variables.length === 0) {
      const matches = validated.content.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        variables = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
      }
    }

    return prisma.contentTemplate.create({
      data: {
        businessId: null, // Global template
        name: validated.name,
        category: validated.category,
        occasion: validated.occasion,
        content: validated.content,
        imageUrl: validated.imageUrl,
        variables,
      },
    });
  }

  /**
   * Get template stats
   */
  async getStats(businessId: string) {
    const [total, byCategory, businessOwn] = await Promise.all([
      prisma.contentTemplate.count({
        where: { OR: [{ businessId }, { businessId: null }], isActive: true },
      }),
      prisma.contentTemplate.groupBy({
        by: ['category'],
        where: { OR: [{ businessId }, { businessId: null }], isActive: true },
        _count: true,
      }),
      prisma.contentTemplate.count({ where: { businessId } }),
    ]);

    return {
      total,
      businessOwn,
      global: total - businessOwn,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const templatesService = new TemplatesService();
