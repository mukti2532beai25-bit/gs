import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

interface TableNodeProps {
  position: [number, number, number];
  name: string;
  fieldsCount: number;
  color: string;
}

function TableNode({ position, name, fieldsCount, color }: TableNodeProps) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0]) * 0.06;
  });

  return (
    <group ref={meshRef} position={position}>
      {/* 3D Glass Table Box */}
      <mesh>
        <boxGeometry args={[1.2, 0.7, 0.4]} />
        <meshPhysicalMaterial
          color="#0A0F1E"
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.1}
          metalness={0.6}
          clearcoat={1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Wireframe border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.2, 0.7, 0.4)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>

      {/* Table Label */}
      <Text
        position={[0, 0.1, 0.22]}
        fontSize={0.13}
        color="#F8FAFC"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      <Text
        position={[0, -0.12, 0.22]}
        fontSize={0.08}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {`${fieldsCount} schema fields`}
      </Text>
    </group>
  );
}

function ERRelationLine({ start, end, color = '#38BDF8' }: { start: [number, number, number]; end: [number, number, number]; color?: string }) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={0.4} linewidth={1} />
    </line>
  );
}

export default function DatabaseGraph3D() {
  const nodes: { id: string; name: string; fieldsCount: number; color: string; pos: [number, number, number] }[] = [
    { id: 'business', name: 'Business', fieldsCount: 10, color: '#F59E0B', pos: [0, 1.4, 0] },
    { id: 'bill', name: 'Bill', fieldsCount: 16, color: '#00D4FF', pos: [0, 0, 0.3] },
    { id: 'billItem', name: 'BillItem', fieldsCount: 9, color: '#00FF9F', pos: [2.1, -0.8, -0.2] },
    { id: 'customer', name: 'Customer', fieldsCount: 6, color: '#10B981', pos: [-2.2, 0.2, 0] },
    { id: 'product', name: 'Product', fieldsCount: 8, color: '#38BDF8', pos: [1.8, 1.0, -0.4] },
    { id: 'vocab', name: 'Vocabulary', fieldsCount: 7, color: '#A855F7', pos: [-1.9, -1.2, 0.1] },
  ];

  return (
    <div className="w-full h-full min-h-[380px] relative pointer-events-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={50} />
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 4, 4]} intensity={1.5} color="#00D4FF" />
        <pointLight position={[-4, -4, 2]} intensity={1.2} color="#10B981" />

        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          {nodes.map((node) => (
            <TableNode
              key={node.id}
              position={node.pos}
              name={node.name}
              fieldsCount={node.fieldsCount}
              color={node.color}
            />
          ))}

          {/* Relations */}
          <ERRelationLine start={[0, 1.4, 0]} end={[0, 0, 0.3]} color="#F59E0B" />
          <ERRelationLine start={[0, 0, 0.3]} end={[2.1, -0.8, -0.2]} color="#00D4FF" />
          <ERRelationLine start={[0, 0, 0.3]} end={[-2.2, 0.2, 0]} color="#10B981" />
          <ERRelationLine start={[2.1, -0.8, -0.2]} end={[1.8, 1.0, -0.4]} color="#38BDF8" />
          <ERRelationLine start={[0, 1.4, 0]} end={[-1.9, -1.2, 0.1]} color="#A855F7" />
        </Float>
      </Canvas>
    </div>
  );
}
