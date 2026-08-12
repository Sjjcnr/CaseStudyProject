import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, CustomerType, CustomerStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { validateRequest } from '../middlewares/validate';
import { authenticateJWT, authorize } from '../middlewares/auth';

const router = Router();

const querySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
  q: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  type: z.nativeEnum(CustomerType).optional(),
});

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(5, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().nullable().optional(),
  type: z.nativeEnum(CustomerType),
  address: z.string().min(5, 'Address is required'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z.string().nullable().optional().transform((val) => (val ? new Date(val) : null)),
  notes: z.string().nullable().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

const createFollowUpSchema = z.object({
  note: z.string().min(2, 'Follow-up note is required'),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid customer ID format'),
});

// All routes require authentication
router.use(authenticateJWT);

// GET /api/v1/customers (All roles read)
router.get('/', validateRequest({ query: querySchema }), async (req: Request, res: Response) => {
  const { page = 1, limit = 10, q, status, type } = req.query as any;

  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (type) {
    whereClause.type = type;
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { businessName: { contains: q, mode: 'insensitive' } },
      { mobile: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { followUps: true, challans: true },
        },
      },
    }),
  ]);

  return sendSuccess(res, customers, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// POST /api/v1/customers (Admin & Sales only)
router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ body: createCustomerSchema }),
  async (req: Request, res: Response) => {
    const customer = await prisma.customer.create({
      data: req.body,
    });
    return sendSuccess(res, customer, undefined, 201);
  }
);

// GET /api/v1/customers/:id (All roles read)
router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        followUps: {
          include: {
            author: { select: { id: true, name: true, role: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      return sendError(res, 'NOT_FOUND', 'Customer not found', [], 404);
    }

    return sendSuccess(res, customer);
  }
);

// PATCH /api/v1/customers/:id (Admin & Sales only)
router.patch(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ params: idParamSchema, body: updateCustomerSchema }),
  async (req: Request, res: Response) => {
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return sendError(res, 'NOT_FOUND', 'Customer not found', [], 404);
    }

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return sendSuccess(res, updated);
  }
);

// GET /api/v1/customers/:id/follow-ups (All roles read)
router.get(
  '/:id/follow-ups',
  validateRequest({ params: idParamSchema }),
  async (req: Request, res: Response) => {
    const followUps = await prisma.customerFollowUp.findMany({
      where: { customerId: req.params.id },
      include: {
        author: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, followUps);
  }
);

// POST /api/v1/customers/:id/follow-ups (Admin & Sales only)
router.post(
  '/:id/follow-ups',
  authorize(Role.ADMIN, Role.SALES),
  validateRequest({ params: idParamSchema, body: createFollowUpSchema }),
  async (req: Request, res: Response) => {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) {
      return sendError(res, 'NOT_FOUND', 'Customer not found', [], 404);
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: req.params.id,
        note: req.body.note,
        authorId: req.user!.userId,
      },
      include: {
        author: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    return sendSuccess(res, followUp, undefined, 201);
  }
);

export default router;
