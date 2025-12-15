import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { AppState } from '../types';

// Function to generate an "Origami" style star texture on a canvas
const createOrigamiStarTexture = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = size * 0.45;
    const innerRadius = size * 0.2;
    const points = 5;

    // Draw 5 segments (diamonds) to simulate folds
    for (let i = 0; i < points * 2; i += 2) {
      const angle1 = (i * Math.PI) / points - Math.PI / 2; // Tip
      const angle2 = ((i + 1) * Math.PI) / points - Math.PI / 2; // Inner Valley
      const angle3 = ((i + 2) * Math.PI) / points - Math.PI / 2; // Next Tip

      // Coordinates
      const x1 = cx + Math.cos(angle1) * outerRadius;
      const y1 = cy + Math.sin(angle1) * outerRadius;
      
      const x2 = cx + Math.cos(angle2) * innerRadius;
      const y2 = cy + Math.sin(angle2) * innerRadius;
      
      const x3 = cx + Math.cos(angle3) * outerRadius;
      const y3 = cy + Math.sin(angle3) * outerRadius;

      // We draw two triangles per point to simulate the fold down the middle
      // Left side of the point (lighter)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fillStyle = '#FFFACD'; // LemonChiffon
      ctx.fill();

      // Right side of the point (slightly darker to simulate shadow/fold)
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3); // Actually this logic connects previous tip to next tip via valley.
      // Let's simplify: Draw the "kite" shape for each point.
    }
    
    // Clear and redraw properly with Kites
    ctx.clearRect(0,0,size,size);
    
    for (let i = 0; i < points; i++) {
        const angleTip = (i * 2 * Math.PI) / points - Math.PI / 2;
        const angleLeft = ((i * 2 - 1) * Math.PI) / points - Math.PI / 2;
        const angleRight = ((i * 2 + 1) * Math.PI) / points - Math.PI / 2;

        const xTip = cx + Math.cos(angleTip) * outerRadius;
        const yTip = cy + Math.sin(angleTip) * outerRadius;
        
        const xLeft = cx + Math.cos(angleLeft) * innerRadius;
        const yLeft = cy + Math.sin(angleLeft) * innerRadius;

        const xRight = cx + Math.cos(angleRight) * innerRadius;
        const yRight = cy + Math.sin(angleRight) * innerRadius;

        // Left Half of the arm
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(xLeft, yLeft);
        ctx.lineTo(xTip, yTip);
        ctx.closePath();
        ctx.fillStyle = '#FFF8DC'; // Cornsilk
        ctx.fill();

        // Right Half of the arm (Darker)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(xTip, yTip);
        ctx.lineTo(xRight, yRight);
        ctx.closePath();
        ctx.fillStyle = '#F0E68C'; // Khaki
        ctx.fill();
    }
    
    // Add a soft glow in center
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.2, 'rgba(255, 215, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, size/2, 0, Math.PI*2);
    ctx.fill();
  }
  
  return new THREE.CanvasTexture(canvas);
};

export const TreeStar: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { appState } = useStore();

  const texture = useMemo(() => createOrigamiStarTexture(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // --- POSITION LOGIC ---
    const isExploded = appState === AppState.EXPLODE;
    
    // Target Positions
    // Tree: Top of tree (Adjusted height for Billboard)
    const treePos = new THREE.Vector3(0, 9.5, 0);
    // Explode: Center of screen
    const centerPos = new THREE.Vector3(0, 0, 0);

    const target = isExploded ? centerPos : treePos;
    
    // Smooth transition
    meshRef.current.position.lerp(target, delta * 3);

    // --- SCALE LOGIC ---
    // Scale up slightly when in center
    const targetScale = isExploded ? 3.5 : 2.5;
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 3);
    meshRef.current.scale.setScalar(newScale);
    
    // Add subtle pulse
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    meshRef.current.scale.multiplyScalar(pulse);
  });

  return (
    <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
      <mesh ref={meshRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          map={texture}
          transparent={true}
          opacity={1}
          depthWrite={false}
          toneMapped={false}
          color="#FFFFFF"
        />
      </mesh>
    </Billboard>
  );
};