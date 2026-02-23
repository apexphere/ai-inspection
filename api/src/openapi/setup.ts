/**
 * OpenAPI Setup
 * 
 * Extends Zod with OpenAPI methods. Must be imported before any schemas.
 */

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod globally with OpenAPI methods
extendZodWithOpenApi(z);

export { z };
