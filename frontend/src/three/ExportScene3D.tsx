import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

interface ExportScene3DProps {
  activeFormat: 'csv' | 'json';
  exportState: 'idle' | 'preparing' | 'ready' | 'failed';
}

// ── Floating Central Data Cube ──────────────────────────────────────────────
function CentralDataCube({ activeFormat, exportState }: ExportScene3DProps) {
  const cubeRef = useRef<THREE.Mesh>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);

  const primaryColor = activeFormat === 'csv' ? '#10B981' : '#00D4FF';
  const emissiveColor =
    exportState === 'failed'
      ? '#EF4444'
      : exportState === 'ready'
      ? '#00FF9F'
      : primaryColor;

  useFrame((state) => {
    if (!cubeRef.current) return;
    const t = state.clock.getElapsedTime();

    // Rotation speed accelerates during export preparation
    const speed = exportState === 'preparing' ? 3.5 : 0.8;
    cubeRef.current.rotation.x = t * speed * 0.7;
    cubeRef.current.rotation.y = t * speed;

    // Pulse scale during export
    const pulse =
      exportState === 'preparing'
        ? 1.0 + Math.sin(t * 10) * 0.12
        : exportState === 'ready'
        ? 1.15
        : 1.0 + Math.sin(t * 2) * 0.04;

    cubeRef.current.scale.set(pulse, pulse, pulse);

    // Completion shockwave ring animation
    if (glowRingRef.current) {
      if (exportState === 'ready') {
        const ringScale = 1.0 + (t * 2) % 2.5;
        glowRingRef.current.scale.set(ringScale, ringScale, ringScale);
        (glowRingRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          1 - (ringScale - 1) / 1.5
        );
      } else {
        glowRingRef.current.scale.set(1, 1, 1);
        (glowRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  });

  return (
    <group>
      <mesh ref={cubeRef}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshPhysicalMaterial
          color="#060B18"
          emissive={emissiveColor}
          emissiveIntensity={exportState === 'preparing' ? 1.5 : 0.65}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          wireframe={exportState === 'preparing'}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.22, 1.22, 1.22)]} />
        <lineBasicMaterial
          color={emissiveColor}
          transparent
          opacity={0.85}
          linewidth={2}
        />
      </lineSegments>

      {/* Completion shockwave ring */}
      <mesh ref={glowRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 64]} />
        <meshBasicMaterial
          color="#00FF9F"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── Orbiting Structured Data Blocks ─────────────────────────────────────────
function OrbitingDataBlocks({ activeFormat, exportState }: ExportScene3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const color = activeFormat === 'csv' ? '#10B981' : '#00D4FF';

  const blocks = useMemo(() => {
    return [
      { radius: 1.8, speed: 1.2, offset: 0, size: 0.32, color },
      { radius: 2.1, speed: -0.9, offset: Math.PI / 3, size: 0.28, color: '#38BDF8' },
      { radius: 2.3, speed: 1.4, offset: (2 * Math.PI) / 3, size: 0.3, color: '#F59E0B' },
      { radius: 1.9, speed: -1.1, offset: Math.PI, size: 0.26, color: '#A855F7' },
      { radius: 2.2, speed: 0.8, offset: (4 * Math.PI) / 3, size: 0.34, color },
      { radius: 2.0, speed: -1.3, offset: (5 * Math.PI) / 3, size: 0.28, color: '#00FF9F' },
    ];
  }, [color]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const speedMult = exportState === 'preparing' ? 2.5 : 1.0;

    groupRef.current.children.forEach((child, i) => {
      const b = blocks[i];
      if (!b) return;
      const angle = t * b.speed * speedMult * 0.6 + b.offset;
      child.position.x = Math.cos(angle) * b.radius;
      child.position.z = Math.sin(angle) * b.radius;
      child.position.y = Math.sin(t * 2 + i) * 0.25;

      child.rotation.x = t * 1.5;
      child.rotation.y = t * 1.2;
    });
  });

  return (
    <group ref={groupRef}>
      {blocks.map((b, i) => (
        <mesh key={i}>
          <boxGeometry args={[b.size, b.size, b.size]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={exportState === 'preparing' ? 1.4 : 0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Glowing Export Pathway & Data Stream ────────────────────────────────────
function ExportPathway({ activeFormat, exportState }: ExportScene3DProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const color = activeFormat === 'csv' ? '#10B981' : '#00D4FF';

  const particleCount = 80;
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Cylinder distribution along vertical pathway
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.45;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5; // y from -2.5 to 2.5
      pos[i * 3 + 2] = Math.sin(angle) * r;
      spd[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, spd];
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const posAttr = particlesRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    const mult = exportState === 'preparing' ? 3.5 : 1.2;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3 + 1; // y coordinate
      array[idx] -= speeds[i] * delta * mult;
      // Loop back to top
      if (array[idx] < -2.5) {
        array[idx] = 2.5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* Central Laser Beam Pathway */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 5, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={exportState === 'preparing' ? 0.8 : 0.25}
        />
      </mesh>

      {/* Streaming Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={exportState === 'preparing' ? 0.08 : 0.05}
          color={color}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Pathway Boundary Rings */}
      {[-2, 0, 2].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.015, 16, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={exportState === 'preparing' ? 0.7 : 0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Floating 3D Format Symbol ───────────────────────────────────────────────
function FloatingFormatBadge({ activeFormat }: { activeFormat: 'csv' | 'json' }) {
  const badgeRef = useRef<THREE.Group>(null);
  const color = activeFormat === 'csv' ? '#10B981' : '#00D4FF';

  useFrame((state) => {
    if (!badgeRef.current) return;
    const t = state.clock.getElapsedTime();
    badgeRef.current.position.y = 1.6 + Math.sin(t * 2) * 0.08;
    badgeRef.current.rotation.y = Math.sin(t * 1.5) * 0.2;
  });

  return (
    <group ref={badgeRef}>
      {/* Background Pill */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.45, 0.1]} />
        <meshStandardMaterial
          color="#060B18"
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <Text
        position={[0, 0, 0.08]}
        fontSize={0.2}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {activeFormat.toUpperCase()}
      </Text>
    </group>
  );
}

// ── Main Scene Component ────────────────────────────────────────────────────
export default function ExportScene3D({
  activeFormat = 'csv',
  exportState = 'idle',
}: ExportScene3DProps) {
  const primaryColor = activeFormat === 'csv' ? '#10B981' : '#00D4FF';

  return (
    <div className="w-full h-full min-h-[300px] sm:min-h-[360px] relative pointer-events-none select-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5.0]} fov={48} />
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 4, 4]} intensity={2.0} color={primaryColor} />
        <pointLight position={[-4, -4, 2]} intensity={1.2} color="#38BDF8" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.35}>
          <FloatingFormatBadge activeFormat={activeFormat} />
          <CentralDataCube activeFormat={activeFormat} exportState={exportState} />
          <OrbitingDataBlocks activeFormat={activeFormat} exportState={exportState} />
          <ExportPathway activeFormat={activeFormat} exportState={exportState} />
        </Float>
      </Canvas>
    </div>
  );
}
