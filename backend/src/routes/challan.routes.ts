import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, ChallanStatus, MovementType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { validateRequest } from '../middlewares/validate';
import { authenticateJWT, authorize } from '../middlewares/auth';

const router = Router();

const querySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().uuid().optional(),
});

const itemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  status: z.enum([ChallanStatus.DRAFT, ChallanStatus.CONFIRMED]).default(ChallanStatus.DRAFT),
  items: z.array(itemSchema).min(1, 'Challan must contain at least one item'),
});

const updateChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional(),
  items: z.array(itemSchema).min(1, 'Challan must contain at least one item').optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid challan ID format'),
});

// Helper function to generate unique challan number
async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const lastChallan = await prisma.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
  });

  let nextSeq = 1;
  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

router.use(authenticateJWT);

// GET /api/v1/challans (All roles read)
router.get('/', validateRequest({ query: querySchema }), async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status, customerId } = req.query as any;

  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (customerId) {
    whereClause.customerId = customerId;
  }

  const [total, challans] = await Promise.all([
    prisma.challan.count({ where: whereClause }),
    prisma.challan.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true, email: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return sendSuccess(res, challans, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// POST /api/v1/challans (Admin & Sales only)
router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ body: createChallanSchema }),
  async (req: Request, res: Response) => {
    const { customerId, status, items } = req.body;

    // Check customer existence
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return sendError(res, 'NOT_FOUND', 'Customer not found', [], 404);
    }

    // Fetch product details for snapshot
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return sendError(res, 'NOT_FOUND', 'One or more products were not found', [], 404);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalQuantity = 0;
    let totalAmount = 0;

    const snapshotItems = items.map((item: any) => {
      const p = productMap.get(item.productId)!;
      const unitPrice = Number(p.unitPrice);
      const itemTotal = unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += itemTotal;

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unitPrice: p.unitPrice,
        quantity: item.quantity,
      };
    });

    const challanNumber = await generateChallanNumber();

    // If initial status is CONFIRMED, run in transaction with stock check
    if (status === ChallanStatus.CONFIRMED) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Verify stock for all items
          for (const item of snapshotItems) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product || product.currentStock < item.quantity) {
              throw {
                status: 409,
                code: 'INSUFFICIENT_STOCK',
                message: `Insufficient stock for product '${item.productName}' (${item.sku}). Available: ${product ? product.currentStock : 0}, Requested: ${item.quantity}`,
              };
            }
          }

          // Create Challan
          const challan = await tx.challan.create({
            data: {
              challanNumber,
              customerId,
              totalQuantity,
              totalAmount,
              status: ChallanStatus.CONFIRMED,
              createdById: req.user!.userId,
              confirmedAt: new Date(),
              items: {
                create: snapshotItems,
              },
            },
            include: {
              customer: true,
              createdBy: { select: { id: true, name: true, role: true } },
              items: true,
            },
          });

          // Deduct stock & create OUT movement logs
          for (const item of snapshotItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { decrement: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantityChanged: item.quantity,
                movementType: MovementType.OUT,
                reason: `Challan ${challan.challanNumber} Confirmed`,
                createdById: req.user!.userId,
                challanId: challan.id,
              },
            });
          }

          return challan;
        });

        return sendSuccess(res, result, undefined, 201);
      } catch (err: any) {
        if (err.code && err.status) {
          return sendError(res, err.code, err.message, [], err.status);
        }
        return sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to create confirmed challan', [], 500);
      }
    }

    // Save as DRAFT
    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        totalQuantity,
        totalAmount,
        status: ChallanStatus.DRAFT,
        createdById: req.user!.userId,
        items: {
          create: snapshotItems,
        },
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    return sendSuccess(res, challan, undefined, 201);
  }
);

// GET /api/v1/challans/:id (All roles read)
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, currentStock: true, minStockAlert: true, location: true } },
          },
        },
        movements: {
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!challan) {
      return sendError(res, 'NOT_FOUND', 'Challan not found', [], 404);
    }

    return sendSuccess(res, challan);
  }
);

// PATCH /api/v1/challans/:id (Admin & Sales only - editable drafts only)
router.patch(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ params: idParamSchema, body: updateChallanSchema }),
  async (req: Request, res: Response) => {
    const existing = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Challan not found', [], 404);
    }

    if (existing.status !== ChallanStatus.DRAFT) {
      return sendError(
        res,
        'INVALID_STATE',
        `Challan in '${existing.status}' status cannot be edited. Only DRAFT challans are editable.`,
        [],
        400
      );
    }

    const { customerId, items } = req.body;

    let totalQuantity = existing.totalQuantity;
    let totalAmount = Number(existing.totalAmount);
    let snapshotItems: any[] | undefined = undefined;

    if (items) {
      const productIds = items.map((i: any) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        return sendError(res, 'NOT_FOUND', 'One or more products were not found', [], 404);
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      totalQuantity = 0;
      totalAmount = 0;

      snapshotItems = items.map((item: any) => {
        const p = productMap.get(item.productId)!;
        const unitPrice = Number(p.unitPrice);
        const itemTotal = unitPrice * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += itemTotal;

        return {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          unitPrice: p.unitPrice,
          quantity: item.quantity,
        };
      });
    }

    // Delete old items and recreate if items updated
    const updated = await prisma.$transaction(async (tx) => {
      if (snapshotItems) {
        await tx.challanItem.deleteMany({ where: { challanId: req.params.id } });
      }

      return tx.challan.update({
        where: { id: req.params.id },
        data: {
          ...(customerId ? { customerId } : {}),
          totalQuantity,
          totalAmount,
          ...(snapshotItems
            ? {
                items: {
                  create: snapshotItems,
                },
              }
            : {}),
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });
    });

    return sendSuccess(res, updated);
  }
);

// POST /api/v1/challans/:id/confirm (Admin & Sales only - Transactional Confirm)
router.post(
  '/:id/confirm',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const challan = await tx.challan.findUnique({
          where: { id: req.params.id },
          include: { items: true },
        });

        if (!challan) {
          throw { status: 404, code: 'NOT_FOUND', message: 'Challan not found' };
        }

        if (challan.status === ChallanStatus.CONFIRMED) {
          throw {
            status: 409,
            code: 'ALREADY_CONFIRMED',
            message: `Challan '${challan.challanNumber}' is already confirmed and cannot be confirmed again.`,
          };
        }

        if (challan.status === ChallanStatus.CANCELLED) {
          throw {
            status: 400,
            code: 'INVALID_STATE',
            message: `Cancelled challan '${challan.challanNumber}' cannot be confirmed.`,
          };
        }

        // Verify stock for all items atomically
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.currentStock < item.quantity) {
            throw {
              status: 409,
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for product '${item.productName}' (${item.sku}). Available stock: ${product ? product.currentStock : 0}, Required: ${item.quantity}`,
            };
          }
        }

        // Deduct stock and log OUT movement for each item
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: MovementType.OUT,
              reason: `Challan ${challan.challanNumber} Confirmed`,
              createdById: req.user!.userId,
              challanId: challan.id,
            },
          });
        }

        // Update Challan Status
        const updatedChallan = await tx.challan.update({
          where: { id: req.params.id },
          data: {
            status: ChallanStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
          include: {
            customer: true,
            createdBy: { select: { id: true, name: true, role: true } },
            items: true,
          },
        });

        return updatedChallan;
      });

      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.code && err.status) {
        return sendError(res, err.code, err.message, [], err.status);
      }
      return sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to confirm sales challan', [], 500);
    }
  }
);

// POST /api/v1/challans/:id/cancel (Admin & Sales only - Cancel Confirmed Challan & Restore Stock)
router.post(
  '/:id/cancel',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const challan = await tx.challan.findUnique({
          where: { id: req.params.id },
          include: { items: true },
        });

        if (!challan) {
          throw { status: 404, code: 'NOT_FOUND', message: 'Challan not found' };
        }

        if (challan.status === ChallanStatus.CANCELLED) {
          throw {
            status: 409,
            code: 'ALREADY_CANCELLED',
            message: `Challan '${challan.challanNumber}' is already cancelled.`,
          };
        }

        const wasConfirmed = challan.status === ChallanStatus.CONFIRMED;

        // If it was confirmed, restore stock and add IN movement logs
        if (wasConfirmed) {
          for (const item of challan.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantityChanged: item.quantity,
                movementType: MovementType.IN,
                reason: `Challan ${challan.challanNumber} Cancelled (Stock Restored)`,
                createdById: req.user!.userId,
                challanId: challan.id,
              },
            });
          }
        }

        const updatedChallan = await tx.challan.update({
          where: { id: req.params.id },
          data: {
            status: ChallanStatus.CANCELLED,
            cancelledAt: new Date(),
          },
          include: {
            customer: true,
            createdBy: { select: { id: true, name: true, role: true } },
            items: true,
          },
        });

        return updatedChallan;
      });

      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.code && err.status) {
        return sendError(res, err.code, err.message, [], err.status);
      }
      return sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to cancel sales challan', [], 500);
    }
  }
);

export default router;
