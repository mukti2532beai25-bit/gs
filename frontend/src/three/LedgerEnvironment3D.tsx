import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── 1. The Central Floating 3D Digital Ledger ────────────────────────────────
function DigitalLedgerModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle breathing rotation & float
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    groupRef.current.rotation.x = 0.25 + Math.cos(t * 0.3) * 0.05;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.1;
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Ledger Spine */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[0.3, 3.2, 0.5]} />
        <meshPhysicalMaterial
          color="#064E3B"
          emissive="#00FF9F"
          emissiveIntensity={0.25}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Left Ledger Page Block */}
      <mesh position={[-1.1, 0, 0]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[2.0, 3.0, 0.2]} />
        <meshPhysicalMaterial
          color="#0A1628"
          emissive="#00D4FF"
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Left Holographic Ruled Lines */}
      {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((y, idx) => (
        <mesh key={`left-line-${idx}`} position={[-1.1, y, 0.11]} rotation={[0, 0.15, 0]}>
          <planeGeometry args={[1.6, 0.04]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Right Ledger Page Block */}
      <mesh position={[1.1, 0, 0]} rotation={[0, -0.15, 0]}>
        <boxGeometry args={[2.0, 3.0, 0.2]} />
        <meshPhysicalMaterial
          color="#0A1628"
          emissive="#10B981"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Right Holographic Ruled Lines */}
      {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((y, idx) => (
        <mesh key={`right-line-${idx}`} position={[1.1, y, 0.11]} rotation={[0, -0.15, 0]}>
          <planeGeometry args={[1.6, 0.04]} />
          <meshBasicMaterial color="#00D4FF" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Ledger Header Badge */}
      <mesh position={[1.1, 1.1, 0.12]} rotation={[0, -0.15, 0]}>
        <planeGeometry args={[1.2, 0.25]} />
        <meshBasicMaterial color="#00FF9F" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── 2. Interactive Animated Bill Cards ───────────────────────────────────────
function FloatingBillCard({
  position,
  rotation,
  title,
  amount,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  title: string;
  amount: string;
  color: string;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const speed = hovered ? 0.3 : 1.2;
    meshRef.current.position.y = position[1] + Math.sin(t * speed + position[0]) * 0.12;

    const targetScale = hovered ? 1.12 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card Backplate */}
      <mesh>
        <boxGeometry args={[1.7, 2.2, 0.05]} />
        <meshPhysicalMaterial
          color="#050816"
          emissive={hovered ? '#00FF9F' : color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Card Border Wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.7, 2.2, 0.05)]} />
        <lineBasicMaterial color={hovered ? '#00FF9F' : color} linewidth={2} />
      </lineSegments>

      {/* Card Label */}
      <Text position={[0, 0.6, 0.04]} fontSize={0.14} color="#F8FAFC" anchorX="center" anchorY="middle">
        {title}
      </Text>
      <Text position={[0, -0.2, 0.04]} fontSize={0.22} color="#00FF9F" anchorX="center" anchorY="middle">
        {amount}
      </Text>
      <Text position={[0, -0.6, 0.04]} fontSize={0.1} color="#94A3B8" anchorX="center" anchorY="middle">
        VERIFIED LEDGER
      </Text>
    </group>
  );
}

// ── 3. Connected Customer & Product Data Nodes ───────────────────────────────
function ConnectedDataNode({
  position,
  label,
  type,
  connectTo,
}: {
  position: [number, number, number];
  label: string;
  type: 'customer' | 'product';
  connectTo: [number, number, number];
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = type === 'customer' ? '#10B981' : '#00D4FF';

  useFrame((state) => {
    if (!sphereRef.current) return;
    const t = state.clock.getElapsedTime();
    sphereRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.06;
  });

  const lineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...position),
      new THREE.Vector3(...connectTo),
    ]);
  }, [position, connectTo]);

  return (
    <group>
      {/* Connecting Laser Beam */}
      <line>
        <primitive object={lineGeo} attach="geometry" />
        <lineBasicMaterial color={color} transparent opacity={hovered ? 0.8 : 0.35} linewidth={1} />
      </line>

      {/* 3D Sphere Node */}
      <mesh
        ref={sphereRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.28 : 0.2, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : 0.7}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      <Text
        position={[position[0], position[1] - 0.35, position[2]]}
        fontSize={0.11}
        color="#E2E8F0"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// ── 4. Floating Financial Particle Field ─────────────────────────────────────
function FloatingDataParticles({ count = 160 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00FF9F'),
      new THREE.Color('#10B981'),
      new THREE.Color('#00D4FF'),
      new THREE.Color('#34D399'),
      new THREE.Color('#FBBF24'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime() * 0.08;
    pointsRef.current.rotation.y = t * 0.5;
    pointsRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── 5. Main Canvas Scene with Emerald Lighting & Camera Parallax ─────────────
export default function LedgerEnvironment3D() {
  return (
    <div className="w-full h-full min-h-[380px] relative pointer-events-auto">
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5">
            <p className="text-xs font-mono text-emerald-400">3D Fintech Ledger Environment Active</p>
          </div>
        }
      >
        <PerspectiveCamera makeDefault position={[0, 0, 7.2]} fov={46} />

        {/* Subtle Emerald & Cyan Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 6, 4]} intensity={0.9} color="#ECFDF5" />
        <pointLight position={[0, 0, 3]} intensity={1.8} color="#00FF9F" distance={10} />
        <pointLight position={[-5, 4, 2]} intensity={1.5} color="#00D4FF" distance={12} />
        <pointLight position={[5, -3, 2]} intensity={1.2} color="#10B981" distance={10} />

        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.3}>
          {/* Central 3D Digital Ledger */}
          <DigitalLedgerModel />

          {/* Left Floating Bill Card */}
          <FloatingBillCard
            position={[-3.3, 0.4, 0.2]}
            rotation={[0.1, 0.3, -0.05]}
            title="INV-84920"
            amount="₹1,240.00"
            color="#00D4FF"
          />

          {/* Right Floating Bill Card */}
          <FloatingBillCard
            position={[3.3, -0.3, 0.1]}
            rotation={[-0.1, -0.3, 0.06]}
            title="INV-84921"
            amount="₹3,450.00"
            color="#10B981"
          />

          {/* Connected Customer Node */}
          <ConnectedDataNode
            position={[-2.4, -1.8, 0.5]}
            label="Suresh Kumar"
            type="customer"
            connectTo={[-1.1, -0.2, 0]}
          />

          {/* Connected Product Node */}
          <ConnectedDataNode
            position={[2.4, 1.8, 0.4]}
            label="Amul Milk 1L"
            type="product"
            connectTo={[1.1, 0.2, 0]}
          />

          {/* Connected Spices Node */}
          <ConnectedDataNode
            position={[-2.0, 1.9, 0.3]}
            label="Tata Salt"
            type="product"
            connectTo={[-1.1, 0.2, 0]}
          />

          {/* Floating Data Particle Matrix */}
          <FloatingDataParticles count={160} />
        </Float>
      </Canvas>
    </div>
  );
}
