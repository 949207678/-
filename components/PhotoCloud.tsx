import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { AppState, PhotoData } from '../types';

export const PhotoCloud: React.FC = () => {
  const { photos, appState, handData, activePhotoId, setActivePhotoId, activateRandomPhoto } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Track previous pinch state to detect the "moment" pinch starts (Rising Edge)
  const wasPinching = useRef(false);

  // Reusable vector to prevent garbage collection every frame
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const isPinching = handData.detected && handData.isPinching;

    // --- PINCH START LOGIC (Rising Edge) ---
    // We only trigger selection logic exactly when the user *starts* pinching.
    // This allows "pinch in empty space -> get random photo".
    if (isPinching && !wasPinching.current && !activePhotoId) {
      
      // Hand Coordinates: 0-1 (Top-Left origin logic in CSS, but Hand Data is passed as Normalized)
      // Convert to NDC: range [-1, 1], Y up.
      const ndcX = (handData.x * 2) - 1;
      const ndcY = -(handData.y * 2) + 1;
      
      let minDistance = Infinity;
      let nearestId = null;
      
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          // Check if it's the specific group holding the photo logic
          if (child.userData && child.userData.id) {
            // Get current world position
            child.getWorldPosition(tempVec);
            
            // Project 3D position to 2D Screen Space (NDC)
            tempVec.project(camera);
            
            // Calculate distance to hand cursor
            const dx = tempVec.x - ndcX;
            const dy = tempVec.y - ndcY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Check closeness
            // Threshold 0.3 is roughly 15% of screen width radius
            // Ensure object is in front of camera (z < 1)
            if (dist < minDistance && dist < 0.3 && tempVec.z < 1) {
              minDistance = dist;
              nearestId = child.userData.id;
            }
          }
        });
      }

      if (nearestId) {
        // Found a specific photo nearby
        setActivePhotoId(nearestId);
      } else {
        // Pinched in empty space -> Summon random photo from library
        activateRandomPhoto();
      }
    } 
    
    // --- PINCH RELEASE LOGIC ---
    // If we stop pinching, release the active photo
    if (!isPinching && activePhotoId) {
      setActivePhotoId(null);
    }

    // Update history for next frame
    wasPinching.current = isPinching;
  });

  return (
    <group ref={groupRef}>
      {photos.map((photo) => (
        <PhotoItem 
          key={photo.id} 
          photo={photo} 
          active={activePhotoId === photo.id} 
          exploded={appState === AppState.EXPLODE} 
        />
      ))}
    </group>
  );
};

interface PhotoItemProps {
  photo: PhotoData;
  active: boolean;
  exploded: boolean;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ photo, active, exploded }) => {
  // Use a Group as the main animated object
  const groupRef = useRef<THREE.Group>(null);
  const frameMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetPos = new THREE.Vector3();
  const targetScale = new THREE.Vector3();
  
  // Get screen aspect ratio to adjust zoom size
  const { size, camera } = useThree();

  // Calculate a unique explode position for this photo that covers the whole sphere
  // independent of its tree position
  const explodePos = useMemo(() => {
    // Generate a pseudo-random direction on a sphere based on photo ID
    // We use a simple hash of the ID to seed randoms
    let hash = 0;
    for (let i = 0; i < photo.id.length; i++) {
      hash = (hash << 5) - hash + photo.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    
    // Spherical coordinates
    const u = (seed % 1000) / 1000;
    const v = ((seed * 13) % 1000) / 1000;
    
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    // Explode Radius: Between 15 and 25 (wider than tree)
    const r = 18 + ((seed * 7) % 10);
    
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }, [photo.id]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const lerpSpeed = active ? 6 : 3;

    if (active) {
      // --- ACTIVE ANIMATION ---
      const camDir = new THREE.Vector3();
      state.camera.getWorldDirection(camDir);
      
      const distance = 8;
      const fovRad = (state.camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const visibleHeight = 2 * distance * Math.tan(fovRad / 2);
      const visibleWidth = visibleHeight * (size.width / size.height);
      
      const minDimension = Math.min(visibleHeight, visibleWidth);
      const responsiveScale = minDimension * 0.75; 

      targetPos.copy(state.camera.position).add(camDir.multiplyScalar(distance));
      targetScale.set(responsiveScale, responsiveScale, responsiveScale);
      
      groupRef.current.lookAt(state.camera.position);

      // --- FRAME GLOW PULSE ---
      if (frameMaterialRef.current) {
        // Oscillate emissive intensity between 0.3 and 1.2
        const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 4.5) * 0.45;
        frameMaterialRef.current.emissiveIntensity = pulse;
        
        // Subtle color shift for extra magic
        const hueShift = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        frameMaterialRef.current.emissive.setHSL(0.12 + hueShift, 0.9, 0.5);
      }
    } else {
      // --- INACTIVE ANIMATION ---
      const [px, py, pz] = photo.position;
      
      if (exploded) {
         targetPos.copy(explodePos);
         targetScale.set(1.5, 1.5, 1.5);
      } else {
         targetPos.set(px, py, pz);
         targetScale.set(1.2, 1.2, 1.2);
      }

      // Reset material when not active
      if (frameMaterialRef.current) {
        frameMaterialRef.current.emissiveIntensity = 0.2;
      }
    }
    
    groupRef.current.position.lerp(targetPos, delta * lerpSpeed);
    groupRef.current.scale.lerp(targetScale, delta * lerpSpeed);
    
    // Hover effect
    if (!active) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime + photo.position[0]) * 0.002;
    }
  });

  return (
    <Billboard follow={true}>
      <group ref={groupRef} userData={{ id: photo.id }}>
        {/* The Photo Image */}
        <Image 
          url={photo.url} 
          transparent 
          side={THREE.DoubleSide}
          scale={[1, 1, 1]} 
        />
        
        {/* Golden Frame - Visible when active */}
        <mesh position={[0, 0, -0.05]} visible={active}>
          <boxGeometry args={[1.1, 1.1, 0.05]} />
          <meshStandardMaterial 
            ref={frameMaterialRef}
            color="#FFD700" 
            metalness={1.0} 
            roughness={0.15} 
            emissive="#B8860B"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Backing */}
        <mesh position={[0, 0, -0.01]} visible={!active}>
          <planeGeometry args={[1.05, 1.05]} />
          <meshBasicMaterial color="#000" opacity={0.5} transparent />
        </mesh>
      </group>
    </Billboard>
  );
}