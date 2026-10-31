import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Floating Ledger Sheet with 3D depth
function FloatingLedgerSheet({ position, rotation, scale = 1, color = '#00D4FF' }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y += Math.sin(t * 1.5 + position[0]) * 0.002;
    meshRef.current.rotation.z = rotation[2] + Math.sin(t * 0.8) * 0.05;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[1.8, 2.4, 0.04]} />
        <meshPhysicalMaterial
          color="#0B132B"
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

// Particle field representing financial transactions & data flow
function FinancialDataParticles({ count = 120 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00D4FF'),
      new THREE.Color('#10B981'),
      new THREE.Color('#F59E0B'),
      new THREE.Color('#38BDF8'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime() * 0.1;
    pointsRef.current.rotation.y = t * 0.4;
    pointsRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// Glowing Rupee / Ledger Core Ring
function LedgerCoreRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;
    ringRef.current.rotation.x = 1.1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
  });

  return (
    <mesh ref={ringRef} position={[2.5, 0, -1]}>
      <torusGeometry args={[2.2, 0.03, 16, 64]} />
      <meshStandardMaterial
        color="#00D4FF"
        emissive="#00D4FF"
        emissiveIntensity={1.2}
        roughness={0.1}
      />
    </mesh>
  );
}

export default function LedgerEnvironment3D() {
  return (
    <div className="w-full h-full min-h-[320px] relative pointer-events-none">
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5">
            <p className="text-xs font-mono text-cyan-400">3D Environment Loaded in Safe Mode</p>
          </div>
        }
      >
        <PerspectiveCamera makeDefault position={[0, 0, 6.5]} fov={50} />
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#00D4FF" />
        <pointLight position={[-5, -4, 2]} intensity={1.2} color="#10B981" />
        <directionalLight position={[0, 4, 3]} intensity={0.8} />

        {/* 3D Visual Objects */}
        <FloatingLedgerSheet position={[-2.2, 0.4, -0.5]} rotation={[0.2, 0.4, -0.1]} color="#00D4FF" scale={0.9} />
        <FloatingLedgerSheet position={[2.4, -0.6, 0.2]} rotation={[-0.2, -0.3, 0.15]} color="#10B981" scale={0.8} />
        <FloatingLedgerSheet position={[0.2, 1.2, -1.8]} rotation={[0.1, -0.2, -0.05]} color="#F59E0B" scale={0.65} />

        <LedgerCoreRing />
        <FinancialDataParticles count={140} />
      </Canvas>
    </div>
  );
}
