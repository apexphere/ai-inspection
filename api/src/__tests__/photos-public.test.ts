import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const PRESIGNED_URL = 'https://r2.example.com/project-photo.jpg';

vi.mock('../services/r2-storage.js', () => ({
  isR2Configured: () => true,
  getPresignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/project-photo.jpg'),
}));

vi.mock('../services/project-photo.js', () => {
  class ProjectPhotoNotFoundError extends Error {}
  class ProjectPhotoService {
    constructor() {
      (globalThis as any).__projectPhotoServiceInstance = this;
    }
    findById = vi.fn();
  }

  return {
    ProjectPhotoService,
    ProjectPhotoNotFoundError,
    __getLastInstance: () => (globalThis as any).__projectPhotoServiceInstance,
  };
});

import { photosPublicRouter } from '../routes/photos-public.js';
const projectPhotoModule = await import('../services/project-photo.js') as any;
import { getPresignedUrl } from '../services/r2-storage.js';

function createApp() {
  const app = express();
  app.use('/api/photos', photosPublicRouter);
  return app;
}

describe('photos-public project photo file route', () => {
  beforeEach(() => {
    const instance = projectPhotoModule.__getLastInstance();
    if (instance) {
      instance.findById.mockResolvedValue({
        id: 'photo-1',
        filePath: 'photos/project/photo-1.jpg',
        thumbnailPath: 'photos/project/photo-1_thumb.jpg',
        mimeType: 'image/jpeg',
      });
    }
    vi.mocked(getPresignedUrl).mockClear();
  });

  it('redirects to presigned URL for project photo thumbnails', async () => {
    const app = createApp();
    const response = await request(app).get('/api/photos/photo-1/file?thumbnail=true');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(PRESIGNED_URL);
    expect(vi.mocked(getPresignedUrl)).toHaveBeenCalledWith('photos/project/photo-1_thumb.jpg');
  });

  it('returns 404 when project photo is not found', async () => {
    const instance = projectPhotoModule.__getLastInstance();
    instance.findById.mockRejectedValue(new projectPhotoModule.ProjectPhotoNotFoundError('missing'));

    const app = createApp();
    const response = await request(app).get('/api/photos/missing/file');

    expect(response.status).toBe(404);
  });
});
