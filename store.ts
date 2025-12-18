import { create } from 'zustand';
import { AppState, HandData, PhotoData } from './types';

interface StoreState {
  // Gesture State
  handData: HandData;
  setHandData: (data: Partial<HandData>) => void;
  
  // App Logic State
  appState: AppState;
  setAppState: (state: AppState) => void;
  
  // Rotation Control (Smoothed in Scene, Target here)
  targetRotation: { x: number; y: number };
  setTargetRotation: (x: number, y: number) => void;

  // Photos
  photos: PhotoData[];
  addPhotos: (urls: string[]) => void;
  clearPhotos: () => void;
  
  activePhotoId: string | null;
  setActivePhotoId: (id: string | null) => void;

  // Random Photo Logic
  viewedPhotoIds: string[]; // Track which photos have been randomly shown
  activateRandomPhoto: () => void;
}

export const useStore = create<StoreState>((set) => ({
  handData: {
    x: 0.5,
    y: 0.5,
    isPinching: false,
    isFist: true, // Default to tree shape
    isOpen: false,
    detected: false,
  },
  setHandData: (data) => set((state) => ({ handData: { ...state.handData, ...data } })),

  appState: AppState.TREE,
  setAppState: (appState) => set({ appState }),

  targetRotation: { x: 0, y: 0 },
  setTargetRotation: (x, y) => set({ targetRotation: { x, y } }),

  photos: [],
  viewedPhotoIds: [],

  addPhotos: (urls) => set((state) => {
    // Generate positions for multiple photos at once
    const newPhotos: PhotoData[] = urls.map(url => {
      // Adjusted height limits to avoid the star at y=9.5
      // Range: -7 (bottom) to 5 (below star)
      const minY = -7;
      const maxY = 5;
      const y = minY + Math.random() * (maxY - minY);
      
      // Calculate radius based on height (Cone shape)
      // Base radius at bottom is larger, radius at top is smaller
      // Linear interpolation: y=-7 -> r=6.5, y=5 -> r=2.5
      const t = (y - minY) / (maxY - minY); // 0 at bottom, 1 at top
      
      // Reduced radius multiplier (0.75) to keep photos closer to the trunk/inner volume
      const r = ((1 - t) * 6.5 + 2.5) * 0.75;

      const theta = Math.random() * Math.PI * 2;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        url,
        position: [r * Math.cos(theta), y, r * Math.sin(theta)],
      };
    });
    
    return {
      photos: [
        ...state.photos,
        ...newPhotos
      ],
      // Reset viewed list when new photos are added (optional, but cleaner)
      viewedPhotoIds: []
    };
  }),
  
  clearPhotos: () => set({ photos: [], viewedPhotoIds: [] }),

  activePhotoId: null,
  setActivePhotoId: (id) => set({ activePhotoId: id }),

  activateRandomPhoto: () => set((state) => {
    if (state.photos.length === 0) return state;

    // Filter photos that haven't been viewed yet
    let availablePhotos = state.photos.filter(p => !state.viewedPhotoIds.includes(p.id));

    // If all photos have been viewed, reset the pool (allow re-viewing)
    let nextViewedIds = [...state.viewedPhotoIds];
    if (availablePhotos.length === 0) {
      availablePhotos = [...state.photos];
      nextViewedIds = []; 
    }

    // Pick a random one
    const randomIndex = Math.floor(Math.random() * availablePhotos.length);
    const selectedPhoto = availablePhotos[randomIndex];

    // Add to viewed list
    nextViewedIds.push(selectedPhoto.id);

    return {
      activePhotoId: selectedPhoto.id,
      viewedPhotoIds: nextViewedIds
    };
  }),
}));