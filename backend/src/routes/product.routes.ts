import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, MovementType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { validateRequest } from '../middlewares/validate';
import { authenticateJWT, authorize } from '../middlewares/auth';

const router = Router();

const querySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
  q: z.string().optional(),
  lowStock: z.string().optional().transform((v) => v === 'true'),
});

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than zero'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minStockAlert: z.number().int().min(0, 'Minimum stock alert must be 0 or greater').default(10),
  location: z.string().min(2, 'Location is required'),
});

const updateProductSchema = createProductSchema.partial();

const stockAdjustmentSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity must be greater than zero'),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().min(2, 'Reason is required for manual stock adjustment'),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

router.use(authenticateJWT);

// GET /api/v1/products (All roles read)
router.get('/', validateRequest({ query: querySchema }), async (req: Request, res: Response) => {
  const { page = 1, limit = 10, q, lowStock } = req.query as any;

  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Low stock condition: currentStock <= minStockAlert
  if (lowStock) {
    // Filter in DB where currentStock <= minStockAlert
    // Since prisma where with column comparison is not direct without raw, we can query raw or compare
    // Or in Prisma 5: currentStock: { lte: prisma.product.fields.minStockAlert }
    // Let's handle lowStock filtering safely:
  }

  let products;
  let total;

  if (lowStock) {
    const allProducts = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    const lowStockItems = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
    total = lowStockItems.length;
    products = lowStockItems.slice(skip, skip + limit);
  } else {
    [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);
  }

  return sendSuccess(res, products, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// POST /api/v1/products (Admin & Warehouse only)
router.post(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateRequest({ body: createProductSchema }),
  async (req: Request, res: Response) => {
    const { sku } = req.body;

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return sendError(res, 'DUPLICATE_SKU', `Product with SKU '${sku}' already exists`, [], 409);
    }

    const product = await prisma.product.create({
      data: req.body,
    });

    // If initial stock > 0, create an initial IN movement log
    if (product.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: product.currentStock,
          movementType: MovementType.IN,
          reason: 'Initial stock setup',
          createdById: req.user!.userId,
        },
      });
    }

    return sendSuccess(res, product, undefined, 201);
  }
);

// GET /api/v1/products/:id (All roles read)
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        movements: {
          include: {
            createdBy: { select: { id: true, name: true, role: true, email: true } },
            challan: { select: { id: true, challanNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return sendError(res, 'NOT_FOUND', 'Product not found', [], 404);
    }

    return sendSuccess(res, product);
  }
);

// PATCH /api/v1/products/:id (Admin & Warehouse only)
router.patch(
  '/:id',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateRequest({ params: idParamSchema, body: updateProductSchema }),
  async (req: Request, res: Response) => {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Product not found', [], 404);
    }

    if (req.body.sku && req.body.sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({ where: { sku: req.body.sku } });
      if (duplicateSku) {
        return sendError(res, 'DUPLICATE_SKU', `Product with SKU '${req.body.sku}' already exists`, [], 409);
      }
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return sendSuccess(res, updated);
  }
);

// GET /api/v1/products/:id/stock-movements (All roles read)
router.get(
  '/:id/stock-movements',
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true, email: true } },
        challan: { select: { id: true, challanNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, movements);
  }
);

// POST /api/v1/products/:id/stock-movements (Admin & Warehouse only - Manual Adjustment)
router.post(
  '/:id/stock-movements',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validateRequest({ params: idParamSchema, body: stockAdjustmentSchema }),
  async (req: Request, res: Response) => {
    const { quantityChanged, movementType, reason } = req.body;
    const productId = req.params.id;

    // Use transaction to ensure stock consistency
    try {
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
        }

        let newStock = product.currentStock;
        if (movementType === MovementType.IN) {
          newStock += quantityChanged;
        } else {
          newStock -= quantityChanged;
          if (newStock < 0) {
            throw {
              status: 409,
              code: 'INSUFFICIENT_STOCK',
              message: `Cannot complete stock OUT adjustment. Available stock is ${product.currentStock}, requested reduction is ${quantityChanged}.`,
            };
          }
        }

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { currentStock: newStock },
        });

        const movement = await tx.stockMovement.create({
          data: {
            productId,
            quantityChanged,
            movementType,
            reason,
            createdById: req.user!.userId,
          },
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
          },
        });

        return { product: updatedProduct, movement };
      });

      return sendSuccess(res, result, undefined, 201);
    } catch (err: any) {
      if (err.code && err.status) {
        return sendError(res, err.code, err.message, [], err.status);
      }
      return sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to adjust stock', [], 500);
    }
  }
);

export default router;
