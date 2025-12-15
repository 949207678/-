import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SNOW_COUNT = 2000;

// Generate a soft circular glow texture for snow
const createSnowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  return texture;
};

export const SnowParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate random positions and velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(SNOW_COUNT * 3);
    const vel = new Float32Array(SNOW_COUNT); // Horizontal drift speed variance
    
    for (let i = 0; i < SNOW_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;     // X: -25 to 25
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40; // Y: -20 to 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50; // Z: -25 to 25
      
      vel[i] = Math.random(); // Random offset for sine wave
    }
    return [pos, vel];
  }, []);

  const texture = useMemo(() => createSnowTexture(), []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    const array = positionsAttribute.array as Float32Array;
    
    for (let i = 0; i < SNOW_COUNT; i++) {
      const i3 = i * 3;
      
      // Fall down
      array[i3 + 1] -= delta * 2; // Speed
      
      // Wind/Drift effect
      // Use system time + random velocity offset to create unique wave patterns
      array[i3] -= Math.sin(state.clock.elapsedTime * 0.5 + velocities[i]) * delta * 0.5; 
      
      // Reset if below bottom threshold
      if (array[i3 + 1] < -20) {
        array[i3 + 1] = 20;
        array[i3] = (Math.random() - 0.5) * 50; // Reset X randomly
        array[i3 + 2] = (Math.random() - 0.5) * 50; // Reset Z randomly
      }
    }
    
    positionsAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={SNOW_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color="#FFFFFF"
        size={0.2}
        transparent
        opacity={0.8}
        depthWrite={false}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};