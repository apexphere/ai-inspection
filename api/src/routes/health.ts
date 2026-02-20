import { Router, type Router as RouterType } from 'express';
import { version } from '../config/version.js';

export const healthRouter: RouterType = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', version });
});
