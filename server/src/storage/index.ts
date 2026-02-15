/**
 * Storage Module
 * 
 * Data persistence layer for inspections and media.
 * Currently using mock storage - will be replaced by SQLite in #2.
 */

export { mockStorage, MockStorage } from './mock-storage.js';
export type { 
  Inspection, 
  Finding, 
  Photo, 
  SectionStatus,
  InspectionMetadata,
} from './mock-storage.js';
