import fs from 'fs';
import path from 'path';

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get the absolute path to the storage directory.
 */
export function getStoragePath(...segments: string[]): string {
  return path.join(process.cwd(), 'storage', ...segments);
}

/**
 * Check if a file exists at the given path.
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Delete a file if it exists.
 */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Get file size in bytes.
 */
export function getFileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size;
}
