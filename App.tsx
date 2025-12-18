import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars, Float, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

import { useStore } from './store';
import { GestureController } from './components/GestureController';
import { TreeParticles } from './components/TreeParticles';
import { PhotoCloud } from './components/PhotoCloud';
import { UIOverlay } from './components/UIOverlay';
import { TreeStar } from './components/TreeStar';
import { SnowParticles } from './components/SnowParticles';

const SceneContent: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { targetRotation } = useStore();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smoothly rotate the entire tree group based on hand movement
      // Damping the rotation for a cinematic feel
      const dampX = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotation.y * 0.5, delta * 2);
      const dampY = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.x * 0.5, delta * 2);
      
      groupRef.current.rotation.x = dampX;
      groupRef.current.rotation.y = dampY;
    }
  });

  return (
    <>
      {/* Rotatable Tree Group */}
      <group ref={groupRef}>
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <TreeParticles />
          <PhotoCloud />
          <TreeStar />
        </Float>
        
        {/* Central glow light */}
        <pointLight position={[0, 0, 0]} intensity={2} color="#ffaa00" distance={10} decay={2} />
      </group>

      {/* Global Snow (Unaffected by tree rotation) */}
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

          {/* Environment & Lighting */}
          <ambientLight intensity={0.2} color="#ffffff" />
          <spotLight 
            position={[20, 20, 20]} 
            angle={0.25} 
            penumbra={1} 
            intensity={500} 
            color="#ffddaa" 
            castShadow 
          />
          <pointLight position={[-10, -10, -10]} intensity={10} color="#ff0040" />

          {/* Reflections */}
          <Environment preset="city" />
          
          {/* Background Stars */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          {/* Main 3D Content */}
          <SceneContent />
          
          <ContactShadows opacity={0.5} scale={50} blur={2} far={10} resolution={256} color="#000000" />

          {/* Post Processing for "Cinematic Glow" */}
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.8} 
              mipmapBlur 
              intensity={1.5} 
              radius={0.4}
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