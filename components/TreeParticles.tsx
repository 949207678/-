import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { AppState } from '../types';
import { generateParticles } from '../utils/math';

// Reusable dummy object for updates
const tempObject = new THREE.Object3D();

const LEAF_COUNT = 1500;
const GOLD_COUNT = 600;
const RIBBON_COUNT = 600; // Increased count for smoother line

export const TreeParticles: React.FC = () => {
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const goldRef = useRef<THREE.InstancedMesh>(null);
  const ribbonRef = useRef<THREE.InstancedMesh>(null);
  const { appState } = useStore();

  // Generate static positions
  const leafData = useMemo(() => generateParticles(LEAF_COUNT, 'leaf'), []);
  const goldData = useMemo(() => generateParticles(GOLD_COUNT, 'gold'), []);
  const ribbonData = useMemo(() => generateParticles(RIBBON_COUNT, 'ribbon'), []);

  // Animation Refs (Current Positions)
  const currentLeafPos = useRef(new Float32Array(LEAF_COUNT * 3));
  const currentGoldPos = useRef(new Float32Array(GOLD_COUNT * 3));
  const currentRibbonPos = useRef(new Float32Array(RIBBON_COUNT * 3));

  // Initialize current positions
  useMemo(() => {
    for (let i = 0; i < LEAF_COUNT * 3; i++) currentLeafPos.current[i] = leafData[i];
    for (let i = 0; i < GOLD_COUNT * 3; i++) currentGoldPos.current[i] = goldData[i];
    for (let i = 0; i < RIBBON_COUNT * 3; i++) currentRibbonPos.current[i] = ribbonData[i];
  }, [leafData, goldData, ribbonData]);

  useFrame((state, delta) => {
    const isExploded = appState === AppState.EXPLODE;
    const lerpFactor = THREE.MathUtils.clamp(delta * 2.5, 0, 1);
    const time = state.clock.getElapsedTime();

    // --- ANIMATE LEAVES ---
    if (leavesRef.current) {
      for (let i = 0; i < LEAF_COUNT; i++) {
        const i3 = i * 6;
        const ci3 = i * 3;

        const targetX = isExploded ? leafData[i3 + 3] : leafData[i3];
        const targetY = isExploded ? leafData[i3 + 4] : leafData[i3 + 1];
        const targetZ = isExploded ? leafData[i3 + 5] : leafData[i3 + 2];

        currentLeafPos.current[ci3] += (targetX - currentLeafPos.current[ci3]) * lerpFactor;
        currentLeafPos.current[ci3 + 1] += (targetY - currentLeafPos.current[ci3 + 1]) * lerpFactor;
        currentLeafPos.current[ci3 + 2] += (targetZ - currentLeafPos.current[ci3 + 2]) * lerpFactor;

        tempObject.position.set(
          currentLeafPos.current[ci3],
          currentLeafPos.current[ci3 + 1],
          currentLeafPos.current[ci3 + 2]
        );
        
        // Idle rotation
        tempObject.rotation.x = time * 0.2 + i;
        tempObject.rotation.y = time * 0.1 + i;
        
        const scale = isExploded ? 0.5 : 1.0; 
        tempObject.scale.setScalar(scale);

        tempObject.updateMatrix();
        leavesRef.current.setMatrixAt(i, tempObject.matrix);
      }
      leavesRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- ANIMATE GOLD SPHERES ---
    if (goldRef.current) {
      for (let i = 0; i < GOLD_COUNT; i++) {
        const i3 = i * 6;
        const ci3 = i * 3;

        const targetX = isExploded ? goldData[i3 + 3] : goldData[i3];
        const targetY = isExploded ? goldData[i3 + 4] : goldData[i3 + 1];
        const targetZ = isExploded ? goldData[i3 + 5] : goldData[i3 + 2];

        currentGoldPos.current[ci3] += (targetX - currentGoldPos.current[ci3]) * lerpFactor;
        currentGoldPos.current[ci3 + 1] += (targetY - currentGoldPos.current[ci3 + 1]) * lerpFactor;
        currentGoldPos.current[ci3 + 2] += (targetZ - currentGoldPos.current[ci3 + 2]) * lerpFactor;

        tempObject.position.set(
          currentGoldPos.current[ci3],
          currentGoldPos.current[ci3 + 1],
          currentGoldPos.current[ci3 + 2]
        );

        // Gold spheres rotate slowly
        tempObject.rotation.set(time * 0.5, time * 0.5, 0);
        
        // Pulse scale slightly for sparkle effect
        const scale = (isExploded ? 0.6 : 1.0) + Math.sin(time * 2 + i) * 0.1;
        tempObject.scale.setScalar(scale);

        tempObject.updateMatrix();
        goldRef.current.setMatrixAt(i, tempObject.matrix);
      }
      goldRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- ANIMATE RIBBON ---
    if (ribbonRef.current) {
      for (let i = 0; i < RIBBON_COUNT; i++) {
        const i3 = i * 6;
        const ci3 = i * 3;

        const targetX = isExploded ? ribbonData[i3 + 3] : ribbonData[i3];
        const targetY = isExploded ? ribbonData[i3 + 4] : ribbonData[i3 + 1];
        const targetZ = isExploded ? ribbonData[i3 + 5] : ribbonData[i3 + 2];

        currentRibbonPos.current[ci3] += (targetX - currentRibbonPos.current[ci3]) * lerpFactor;
        currentRibbonPos.current[ci3 + 1] += (targetY - currentRibbonPos.current[ci3 + 1]) * lerpFactor;
        currentRibbonPos.current[ci3 + 2] += (targetZ - currentRibbonPos.current[ci3 + 2]) * lerpFactor;

        tempObject.position.set(
          currentRibbonPos.current[ci3],
          currentRibbonPos.current[ci3 + 1],
          currentRibbonPos.current[ci3 + 2]
        );
        
        // Ribbon particles flow
        tempObject.rotation.set(time, time * 0.5, 0);
        
        // Smaller, elegant particles
        const scale = isExploded ? 0.5 : 0.4;
        tempObject.scale.setScalar(scale);

        tempObject.updateMatrix();
        ribbonRef.current.setMatrixAt(i, tempObject.matrix);
      }
      ribbonRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Leaves: Pink Octahedrons */}
      <instancedMesh ref={leavesRef} args={[undefined, undefined, LEAF_COUNT]} castShadow receiveShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color="#FFB7C5" 
          emissive="#FF69B4"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.6}
        />
      </instancedMesh>

      {/* Gold Spheres: Metallic and Shiny */}
      <instancedMesh ref={goldRef} args={[undefined, undefined, GOLD_COUNT]} castShadow receiveShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFA500"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={1.0}
          envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Ribbon: White Tiny Tetrahedrons (Diamond Dust) */}
      <instancedMesh ref={ribbonRef} args={[undefined, undefined, RIBBON_COUNT]}>
        <tetrahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF"
          emissiveIntensity={1.0}
          roughness={0.0}
          metalness={0.5}
        />
      </instancedMesh>
    </group>
  );
};