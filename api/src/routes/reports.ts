import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import * as fs from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import {
  ReportService,
  ReportNotFoundError,
  InspectionNotFoundError,
  ReportGenerationError,
} from '../services/report.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const service = new ReportService(repository);

export const reportsRouter: RouterType = Router();

// POST /api/inspections/:inspectionId/report - Generate PDF report
reportsRouter.post(
  '/inspections/:inspectionId/report',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const report = await service.generate(inspectionId);

      res.status(201).json({
        id: report.id,
        inspectionId: report.inspectionId,
        format: report.format,
        path: report.path,
        createdAt: report.createdAt,
      });
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof ReportGenerationError) {
        res.status(500).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/report - Get latest report (metadata)
reportsRouter.get(
  '/inspections/:inspectionId/report',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const report = await service.getLatest(inspectionId);

      res.json({
        id: report.id,
        inspectionId: report.inspectionId,
        format: report.format,
        path: report.path,
        createdAt: report.createdAt,
      });
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof ReportNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/report/download - Download PDF file
reportsRouter.get(
  '/inspections/:inspectionId/report/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const filePath = await service.getFilePath(inspectionId);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({ error: 'Report file not found on disk' });
        return;
      }

      // Serve the PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="inspection-${inspectionId}.pdf"`);

      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof ReportNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
