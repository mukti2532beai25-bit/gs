import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

function DataCube({ position, color, delay }: { position: [number, number, number]; color: string; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.5 + delay;
    meshRef.current.rotation.y = t * 0.6 + delay;
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + delay) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.55, 0.55, 0.55]} />
      <meshPhysicalMaterial
        color="#0B132B"
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.8}
        clearcoat={1}
      />
    </mesh>
  );
}

export default function ExportCubes3D({ activeFormat = 'csv' }: { activeFormat?: string }) {
  const activeColor =
    activeFormat === 'csv'
      ? '#10B981'
      : activeFormat === 'json'
      ? '#00D4FF'
      : '#F59E0B';

  return (
    <div className="w-full h-full min-h-[300px] relative pointer-events-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={50} />
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={1.5} color={activeColor} />
        <pointLight position={[-3, -3, 2]} intensity={1.0} color="#38BDF8" />

        <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.5}>
          {/* Formed cluster of 3D data blocks */}
          <DataCube position={[0, 0, 0]} color={activeColor} delay={0} />
          <DataCube position={[-0.9, 0.6, -0.2]} color="#10B981" delay={1} />
          <DataCube position={[0.9, 0.6, 0.2]} color="#00D4FF" delay={2} />
          <DataCube position={[-0.8, -0.7, 0.3]} color="#F59E0B" delay={3} />
          <DataCube position={[0.8, -0.7, -0.3]} color="#38BDF8" delay={4} />

          {/* Central data carrier ring */}
          <mesh rotation={[1.2, 0, 0]}>
            <torusGeometry args={[1.8, 0.02, 16, 64]} />
            <meshBasicMaterial color={activeColor} transparent opacity={0.6} />
          </mesh>
        </Float>
      </Canvas>
    </div>
  );
}
