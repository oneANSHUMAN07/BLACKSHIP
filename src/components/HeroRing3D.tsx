import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

function ChromeKnot() {
  const knotRef = useRef<THREE.Group>(null);
  const geometry = useMemo(
    () => new THREE.TorusKnotGeometry(1.04, 0.205, 192, 28, 2, 3),
    []
  );
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useFrame((state, delta) => {
    if (!reducedMotion && knotRef.current) {
      // Negative Y turns clockwise when viewed from above the vertical axis.
      knotRef.current.rotation.y -= Math.min(delta, 0.05) * 0.42;
    }
  });

  return (
    <group ref={knotRef} rotation={[0.12, 0, 0.06]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e5e8ee"
          metalness={1}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.65}
        />
      </mesh>
    </group>
  );
}

function StudioReflections() {
  return (
    <Environment resolution={128}>
      <color attach="background" args={['#08090c']} />
      <Lightformer intensity={5} position={[0, 3, 2]} scale={[5, 1.2, 1]} />
      <Lightformer intensity={3.5} position={[-3, 0, 1]} scale={[1, 4, 1]} />
      <Lightformer intensity={4} position={[3, 0, -1]} scale={[1, 3.5, 1]} />
      <Lightformer intensity={2.5} position={[0, -3, 1]} scale={[4, 0.8, 1]} />
      <Lightformer intensity={1.5} position={[0, 1, -4]} scale={[3, 2, 1]} />
    </Environment>
  );
}

export const HeroRing3D: React.FC = () => (
  <Canvas
    camera={{ position: [0, 0, 4.25], fov: 38, near: 0.1, far: 30 }}
    dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => {
      gl.setClearColor('#000000', 0);
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.1;
    }}
    fallback={<span className="text-xs text-zinc-500">WebGL is required to display the 3D sculpture.</span>}
  >
    <ambientLight intensity={0.12} />
    <StudioReflections />
    <ChromeKnot />
  </Canvas>
);
