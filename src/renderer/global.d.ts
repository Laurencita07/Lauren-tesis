/**
 * Tipos globales en el renderer (API expuesta por preload).
 */
import type { ElectronAPI } from '../preload';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
