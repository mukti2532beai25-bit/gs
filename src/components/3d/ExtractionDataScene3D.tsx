import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function ConfidenceNode({ position, confidence = 0.9, label }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = confidence >= 0.9 ? '#10B981' : confidence >= 0.75 ? '#00D4FF' : '#F59E0B';

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.8;
    meshRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.08;
  });

  return (
    <group position={position}>
      {/* Outer Hex/Octahedron wireframe */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          wireframe
        />
      </mesh>
      {/* Inner glowing sphere */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function ConnectingDataLine({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);

  return (
    <line>
      <primitive object={lineGeometry} attach="geometry" />
      <lineBasicMaterial color="#38BDF8" transparent opacity={0.3} linewidth={1} />
    </line>
  );
}

export default function ExtractionDataScene3D({ overallConfidence = 0.88 }: { overallConfidence?: number }) {
  return (
    <div className="w-full h-full min-h-[280px] relative pointer-events-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={50} />
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={1.5} color="#00D4FF" />
        <pointLight position={[-3, -3, 2]} intensity={1.2} color="#10B981" />

        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          {/* Central AI Verification Core */}
          <ConfidenceNode position={[0, 0, 0]} confidence={overallConfidence} />

          {/* Satellite line-item extraction nodes */}
          <ConfidenceNode position={[-1.6, 0.8, -0.4]} confidence={0.95} />
          <ConfidenceNode position={[1.6, 0.7, -0.3]} confidence={0.88} />
          <ConfidenceNode position={[-1.4, -0.9, 0.2]} confidence={0.92} />
          <ConfidenceNode position={[1.5, -0.8, 0.1]} confidence={0.76} />

          {/* Data Lines */}
          <ConnectingDataLine start={[0, 0, 0]} end={[-1.6, 0.8, -0.4]} />
          <ConnectingDataLine start={[0, 0, 0]} end={[1.6, 0.7, -0.3]} />
          <ConnectingDataLine start={[0, 0, 0]} end={[-1.4, -0.9, 0.2]} />
          <ConnectingDataLine start={[0, 0, 0]} end={[1.5, -0.8, 0.1]} />
        </Float>
      </Canvas>
    </div>
  );
}
