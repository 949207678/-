
import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

import { useStore } from './store';
import { GestureController } from './components/GestureController';
import { TreeParticles } from './components/TreeParticles';
import { PhotoCloud } from './components/PhotoCloud';
import { UIOverlay } from './components/UIOverlay';
import { TreeStar } from './components/TreeStar';
import { SnowParticles } from './components/SnowParticles';
import { AppState } from './types';

const SceneContent: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const autoRotateRef = useRef(0);
  const { targetRotation, appState } = useStore();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Slow auto-rotation only when in TREE state
      if (appState === AppState.TREE) {
        autoRotateRef.current += delta * 0.2; // Slow rotation speed
      } else {
        // Optional: Slowly decay auto-rotation if you want it to stop exactly where it is when exploding
        // Or keep it for continuity. Here we'll keep it as a base offset.
      }

      // Smoothly rotate the entire tree group based on hand movement
      // targetRotation.y maps to X rotation, targetRotation.x maps to Y rotation
      const dampX = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.y * 0.5, delta * 2);
      
      // Combine auto-rotation with user gesture rotation
      const targetY = (appState === AppState.TREE ? autoRotateRef.current : 0) + (targetRotation.x * 0.5);
      const dampY = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, delta * 2);
      
      groupRef.current.rotation.x = dampX;
      groupRef.current.rotation.y = dampY;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <TreeParticles />
          <PhotoCloud />
          <TreeStar />
        </Float>
        
        {/* Central warm glow light */}
        <pointLight position={[0, 0, 0]} intensity={3} color="#ffaa00" distance={15} decay={2} />
      </group>

      {/* Global Snow */}
      <SnowParticles />
    </>
  );
};

const App: React.FC = () => {
  return (
    <>
      <GestureController />
      <UIOverlay />
      
      <Canvas
        shadows
        camera={{ position: [0, 0, 35], fov: 45 }}
        gl={{ toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
        className="w-full h-full bg-black"
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050202']} />
          <fog attach="fog" args={['#050202', 20, 90]} />

          {/* Optimized Lighting Setup - Replaces HDR Environment */}
          <ambientLight intensity={0.5} color="#ffffff" />
          
          {/* Key warm light */}
          <spotLight 
            position={[25, 25, 25]} 
            angle={0.2} 
            penumbra={1} 
            intensity={1200} 
            color="#fff2cc" 
            castShadow 
          />
          
          {/* Rim light for gold definition */}
          <directionalLight position={[-15, 10, 10]} intensity={2.5} color="#ffffff" />
          
          {/* Accent colored lights */}
          <pointLight position={[-15, -10, -5]} intensity={40} color="#ff0040" />
          <pointLight position={[15, 0, -10]} intensity={30} color="#0088ff" />

          {/* Background Stars */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Main 3D Content */}
          <SceneContent />
          
          <ContactShadows opacity={0.5} scale={50} blur={2} far={10} resolution={256} color="#000000" />

          {/* Post Processing */}
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.8} 
              mipmapBlur 
              intensity={1.8} 
              radius={0.5}
            />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

        </Suspense>
      </Canvas>
    </>
  );
};

export default App;
