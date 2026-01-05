import { Router, Request, Response } from 'express';
import { prisma } from '../../config';

const router = Router();

// List all products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { category, lowStock, search } = req.query;

    const where: any = { businessId };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (lowStock === 'true') {
      return res.json(products.filter(p => Number(p.currentStock) <= Number(p.minStock)));
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Get single product
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { name: true } } },
        },
        serviceProducts: {
          include: { service: { select: { name: true } } },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Create product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const data = req.body;

    const product = await prisma.product.create({
      data: {
        businessId,
        name: data.name,
        brand: data.brand,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category || 'INTERNAL_USE',
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        currentStock: data.initialStock || 0,
        minStock: data.minStock || 0,
        unit: data.unit || 'un',
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        imageUrl: data.imageUrl,
      },
    });

    if (data.initialStock && data.initialStock > 0) {
      await prisma.stockMovement.create({
        data: {
          businessId,
          productId: product.id,
          type: 'PURCHASE',
          quantity: data.initialStock,
          previousStock: 0,
          newStock: data.initialStock,
          unitCost: data.costPrice,
          totalCost: data.costPrice * data.initialStock,
          notes: 'Estoque inicial',
        },
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Update product
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        minStock: data.minStock,
        unit: data.unit,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
      },
    });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Stock movement
router.post('/products/:id/movement', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { type, quantity, unitCost, notes, appointmentId } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const isIncoming = ['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(type) && quantity > 0;
    const quantityChange = isIncoming ? Math.abs(quantity) : -Math.abs(quantity);
    const newStock = Number(product.currentStock) + quantityChange;

    if (newStock < 0) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    const [movement, updatedProduct] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          businessId,
          productId: id,
          type,
          quantity: quantityChange,
          previousStock: Number(product.currentStock),
          newStock,
          unitCost: unitCost || Number(product.costPrice),
          totalCost: (unitCost || Number(product.costPrice)) * Math.abs(quantity),
          notes,
          appointmentId,
          userId,
        },
      }),
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock },
      }),
    ]);

    res.json({ movement, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar movimentação' });
  }
});

// Link product to service
router.post('/products/:productId/services/:serviceId', async (req: Request, res: Response) => {
  try {
    const { productId, serviceId } = req.params;
    const { quantityUsed } = req.body;

    const serviceProduct = await prisma.serviceProduct.upsert({
      where: { serviceId_productId: { serviceId, productId } },
      create: { serviceId, productId, quantityUsed },
      update: { quantityUsed },
    });

    res.json(serviceProduct);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao vincular produto' });
  }
});

// Remove product from service
router.delete('/products/:productId/services/:serviceId', async (req: Request, res: Response) => {
  try {
    const { productId, serviceId } = req.params;

    await prisma.serviceProduct.delete({
      where: { serviceId_productId: { serviceId, productId } },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desvincular produto' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;

    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
    });

    const lowStock = products.filter(p => Number(p.currentStock) <= Number(p.minStock));
    const expiringSoon = products.filter(p => {
      if (!p.expirationDate) return false;
      const daysUntilExpiry = Math.ceil(
        (p.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    res.json({ lowStock, expiringSoon });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// Inventory stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;

    const [products, movements] = await Promise.all([
      prisma.product.findMany({
        where: { businessId, isActive: true },
      }),
      prisma.stockMovement.findMany({
        where: {
          businessId,
          createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
        },
      }),
    ]);

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => Number(p.currentStock) <= Number(p.minStock)).length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + Number(p.currentStock) * Number(p.costPrice),
      0
    );

    const purchaseTotal = movements
      .filter(m => m.type === 'PURCHASE')
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);
    const usageTotal = movements
      .filter(m => m.type === 'SERVICE_USE')
      .reduce((sum, m) => sum + Math.abs(Number(m.totalCost || 0)), 0);

    const consumptionByProduct = movements
      .filter(m => m.type === 'SERVICE_USE')
      .reduce((acc, m) => {
        acc[m.productId] = (acc[m.productId] || 0) + Math.abs(Number(m.quantity));
        return acc;
      }, {} as Record<string, number>);

    const topConsumed = Object.entries(consumptionByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, quantity]) => ({
        product: products.find(p => p.id === productId),
        quantity,
      }));

    res.json({
      totalProducts,
      lowStockCount,
      totalStockValue,
      monthlyPurchases: purchaseTotal,
      monthlyUsage: usageTotal,
      topConsumed,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Stock movement history
router.get('/movements', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).businessId;
    const { productId, type, startDate, endDate, limit = '50' } = req.query;

    const where: any = { businessId };
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        product: { select: { name: true, unit: true } },
        user: { select: { name: true } },
      },
    });

    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

export const inventoryRoutes = router;
