/**
 * Admin Service Key Routes — Issue #597
 */

import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import {
  ServiceKeyService,
  DuplicateKeyNameError,
  ServiceKeyNotFoundError,
} from '../../services/service-key.js';

const prisma = new PrismaClient();
const service = new ServiceKeyService(prisma);

const CreateServiceKeySchema = z.object({
  name: z.string().min(1),
  actor: z.string().min(1),
  scopes: z.array(z.string()).min(1),
  expiresAt: z.string().datetime().optional(),
});

type CreateServiceKeyInput = z.infer<typeof CreateServiceKeySchema>;

function generateRawKey(): string {
  return `sk_${crypto.randomBytes(24).toString('hex')}`;
}

export function createServiceKeysAdminRouter(
  svc: ServiceKeyService = service,
): RouterType {
  const router: RouterType = Router();

  // POST /api/admin/service-keys
  router.post('/', async (req: Request, res: Response) => {
    const parsed = CreateServiceKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, actor, scopes, expiresAt } = parsed.data as CreateServiceKeyInput;
    const rawKey = generateRawKey();

    try {
      const created = await svc.create({
        name,
        actor,
        scopes,
        rawKey,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.status(201).json({
        id: created.id,
        name: created.name,
        actor: created.actor,
        scopes: created.scopes,
        keyPrefix: created.keyPrefix,
        active: created.active,
        expiresAt: created.expiresAt,
        createdAt: created.createdAt,
        key: rawKey, // returned only once
      });
    } catch (err) {
      if (err instanceof DuplicateKeyNameError) {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create service key' });
    }
  });

  // GET /api/admin/service-keys
  router.get('/', async (_req: Request, res: Response) => {
    const keys = await svc.list();
    res.json(keys);
  });

  // DELETE /api/admin/service-keys/:id
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const updated = await svc.deactivate(req.params.id as string);
      res.json({
        id: updated.id,
        name: updated.name,
        active: updated.active,
        updatedAt: updated.updatedAt,
      });
    } catch (err) {
      if (err instanceof ServiceKeyNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Failed to deactivate service key' });
    }
  });

  // POST /api/admin/service-keys/:id/regenerate
  router.post('/:id/regenerate', async (req: Request, res: Response) => {
    const rawKey = generateRawKey();

    try {
      const newKey = await svc.regenerate(req.params.id as string, rawKey);
      res.status(201).json({
        id: newKey.id,
        name: newKey.name,
        actor: newKey.actor,
        scopes: newKey.scopes,
        keyPrefix: newKey.keyPrefix,
        active: newKey.active,
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
        key: rawKey, // returned only once
      });
    } catch (err) {
      if (err instanceof ServiceKeyNotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Failed to regenerate service key' });
    }
  });


  return router;
}

export const serviceKeysAdminRouter = createServiceKeysAdminRouter();
