/**
 * Inspectors Routes — Issue #351
 *
 * Phone number lookup for multi-inspector WhatsApp support.
 * Used by OpenClaw agent to identify which inspector is messaging.
 */

import { Router, Request, Response, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const inspectorsRouter: RouterType = Router();

// Validation schema for phone number
const PhoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 characters')
  .max(20, 'Phone number too long')
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format');

/**
 * Normalize phone number for consistent lookup
 * Removes spaces, dashes, and ensures + prefix
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : `+${digits}`;
}

/**
 * GET /api/inspectors/by-phone/:phone
 * Look up an inspector by their WhatsApp phone number.
 * 
 * Returns:
 * - 200 { id, name, email } if found
 * - 404 if phone number not registered
 * - 400 if invalid phone number format
 */
inspectorsRouter.get('/by-phone/:phone', async (req: Request, res: Response) => {
  try {
    const phoneParam = req.params.phone;
    const phone = typeof phoneParam === 'string' ? decodeURIComponent(phoneParam) : '';
    
    // Validate phone number format
    const parsed = PhoneSchema.safeParse(phone);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid phone number format',
        details: parsed.error.flatten().formErrors,
      });
      return;
    }

    // Normalize for lookup
    const normalizedPhone = normalizePhoneNumber(phone);

    // Find user by phone number (must be verified)
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        phoneVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: 'Inspector not found',
        message: "I don't have you registered. Contact admin to set up your profile.",
      });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error('Inspector lookup error:', err);
    res.status(500).json({ error: 'Failed to look up inspector' });
  }
});
