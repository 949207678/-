export enum AppState {
  TREE = 'TREE',       // Fist: Collapsed / Normal Tree
  EXPLODE = 'EXPLODE', // Open Palm: Scattered particles
}

export interface HandData {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  isPinching: boolean;
  isFist: boolean;
  isOpen: boolean;
  detected: boolean;
}

export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number]; // Position on the tree
}