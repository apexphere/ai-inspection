import { Router } from 'express';
import { z } from 'zod';
import { CompanyService } from '../services/company.js';

const companyService = new CompanyService();
export const companiesRouter = Router();

const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

// POST /api/companies
companiesRouter.post('/', async (req, res) => {
  try {
    const parsed = CreateCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const company = await companyService.create(parsed.data);
    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// GET /api/companies
companiesRouter.get('/', async (_req, res) => {
  try {
    const companies = await companyService.list();
    res.json(companies);
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'Failed to list companies' });
  }
});

// GET /api/companies/:id
companiesRouter.get('/:id', async (req, res) => {
  try {
    const company = await companyService.getById(req.params.id);
    res.json(company);
  } catch (error) {
    if (error instanceof Error && error.message === 'Company not found') {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

// PUT /api/companies/:id
companiesRouter.put('/:id', async (req, res) => {
  try {
    const parsed = UpdateCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const company = await companyService.update(req.params.id, parsed.data);
    res.json(company);
  } catch (error) {
    if (error instanceof Error && error.message === 'Company not found') {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// DELETE /api/companies/:id
companiesRouter.delete('/:id', async (req, res) => {
  try {
    await companyService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Company not found') {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    // Prisma foreign key constraint error
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      res.status(409).json({ error: 'Cannot delete company with linked personnel' });
      return;
    }
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// POST /api/companies/:id/logo
companiesRouter.post('/:id/logo', async (req, res) => {
  try {
    // For now, accept logoPath in body. File upload will be added later.
    const { logoPath } = req.body;
    if (!logoPath || typeof logoPath !== 'string') {
      res.status(400).json({ error: 'logoPath is required' });
      return;
    }
    const company = await companyService.updateLogo(req.params.id, logoPath);
    res.json(company);
  } catch (error) {
    if (error instanceof Error && error.message === 'Company not found') {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    console.error('Update logo error:', error);
    res.status(500).json({ error: 'Failed to update logo' });
  }
});
