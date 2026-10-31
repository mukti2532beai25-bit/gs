import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

function WaveformBars({ isListening = false, count = 48 }: { isListening?: boolean; count?: number }) {
  const barsRef = useRef<THREE.Group>(null);

  const bars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { x, y, angle };
    });
  }, [count]);

  useFrame((state) => {
    if (!barsRef.current) return;
    const t = state.clock.getElapsedTime();

    barsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const speed = isListening ? 6 : 1.5;
      const amp = isListening ? 0.6 : 0.15;
      const height = 0.2 + Math.abs(Math.sin(t * speed + i * 0.35)) * amp;
      mesh.scale.y = height;
      mesh.position.z = Math.sin(t * 2 + i * 0.2) * 0.1;
    });

    barsRef.current.rotation.z = t * 0.15;
  });

  return (
    <group ref={barsRef}>
      {bars.map((bar, i) => {
        const color = isListening
          ? i % 2 === 0
            ? '#00FF9F'
            : '#00D4FF'
          : '#334155';

        return (
          <mesh
            key={i}
            position={[bar.x, bar.y, 0]}
            rotation={[0, 0, bar.angle + Math.PI / 2]}
          >
            <boxGeometry args={[0.08, 1, 0.08]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isListening ? 0.9 : 0.2}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CentralVoiceCore({ isListening }: { isListening: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!coreRef.current) return;
    const t = state.clock.getElapsedTime();
    const scale = isListening ? 1 + Math.sin(t * 8) * 0.15 : 1;
    coreRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[0.45, 32, 32]} />
      <meshStandardMaterial
        color={isListening ? '#00FF9F' : '#00D4FF'}
        emissive={isListening ? '#00FF9F' : '#00D4FF'}
        emissiveIntensity={isListening ? 1.4 : 0.5}
        roughness={0.1}
      />
    </mesh>
  );
}

export default function AudioWaveform3D({ isListening = false }: { isListening?: boolean }) {
  return (
    <div className="w-full h-full min-h-[340px] relative pointer-events-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 4.2]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 3]} intensity={1.5} color={isListening ? '#00FF9F' : '#00D4FF'} />
        <pointLight position={[-3, -3, -2]} intensity={0.8} color="#00D4FF" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <CentralVoiceCore isListening={isListening} />
          <WaveformBars isListening={isListening} />
        </Float>
      </Canvas>
    </div>
  );
}
