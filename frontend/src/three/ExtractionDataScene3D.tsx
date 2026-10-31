import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NodeProps {
  position: [number, number, number];
  confidence: number;
  label: string;
}

function ExtractionNode({ position, confidence, label }: NodeProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Confidence color scale: Emerald (>=0.9), Cyan (0.75-0.89), Gold (<0.75)
  const color = confidence >= 0.9 ? '#10B981' : confidence >= 0.75 ? '#00D4FF' : '#F59E0B';
  const statusText = confidence >= 0.9 ? 'High' : confidence >= 0.75 ? 'Review' : 'Low';

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * 1.8 + position[0]) * 0.05;
  });

  return (
    <group ref={meshRef} position={position}>
      {/* 3D Wireframe Polyhedron */}
      <mesh>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          wireframe
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Field Label */}
      <Text
        position={[0, 0.45, 0]}
        fontSize={0.11}
        color="#F8FAFC"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* Confidence Pill */}
      <Text
        position={[0, -0.4, 0]}
        fontSize={0.08}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {`${Math.round(confidence * 100)}% (${statusText})`}
      </Text>
    </group>
  );
}

// ── Streaming Data Packets from Raw Document to Structured Records ───────────
function DataPacketStream({ start, end, speed = 1 }: { start: [number, number, number]; end: [number, number, number]; speed?: number }) {
  const packetRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!packetRef.current) return;
    const t = (state.clock.getElapsedTime() * speed) % 1;
    // Linear lerp along path
    packetRef.current.position.x = start[0] + (end[0] - start[0]) * t;
    packetRef.current.position.y = start[1] + (end[1] - start[1]) * t;
    packetRef.current.position.z = start[2] + (end[2] - start[2]) * t;
  });

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);

  return (
    <group>
      {/* Laser trajectory line */}
      <line>
        <primitive object={lineGeo} attach="geometry" />
        <lineBasicMaterial color="#00FF9F" transparent opacity={0.25} linewidth={1} />
      </line>

      {/* Glowing Moving Packet */}
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#00FF9F" />
      </mesh>
    </group>
  );
}

export default function ExtractionDataScene3D({ overallConfidence = 0.88 }: { overallConfidence?: number }) {
  const docPos: [number, number, number] = [-2.2, 0, 0];
  const nodeVendor: [number, number, number] = [0.8, 1.1, 0];
  const nodeItems: [number, number, number] = [1.8, 0.2, 0.2];
  const nodeTax: [number, number, number] = [0.8, -1.1, -0.1];
  const nodeTotal: [number, number, number] = [2.2, -0.8, 0.1];

  return (
    <div className="w-full h-full min-h-[280px] relative pointer-events-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 4.8]} fov={46} />
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 3, 3]} intensity={1.5} color="#00D4FF" />
        <pointLight position={[-3, -3, 2]} intensity={1.2} color="#10B981" />

        <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.3}>
          {/* Source Document Sheet Representation */}
          <group position={docPos} rotation={[0, 0.35, -0.05]}>
            <mesh>
              <planeGeometry args={[1.4, 2.0]} />
              <meshPhysicalMaterial
                color="#0F172A"
                emissive="#00D4FF"
                emissiveIntensity={0.2}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(1.4, 2.0)]} />
              <lineBasicMaterial color="#00D4FF" />
            </lineSegments>
            <Text position={[0, 0, 0.02]} fontSize={0.1} color="#38BDF8" anchorX="center" anchorY="middle">
              RAW OCR INVOICE
            </Text>
          </group>

          {/* Structured Database Record Nodes */}
          <ExtractionNode position={nodeVendor} confidence={0.94} label="Store Header" />
          <ExtractionNode position={nodeItems} confidence={overallConfidence} label="Line Items" />
          <ExtractionNode position={nodeTax} confidence={0.92} label="GST Tax" />
          <ExtractionNode position={nodeTotal} confidence={0.98} label="Grand Total" />

          {/* Flowing Data Stream Trajectories */}
          <DataPacketStream start={docPos} end={nodeVendor} speed={0.9} />
          <DataPacketStream start={docPos} end={nodeItems} speed={1.2} />
          <DataPacketStream start={docPos} end={nodeTax} speed={0.8} />
          <DataPacketStream start={nodeItems} end={nodeTotal} speed={1.4} />
        </Float>
      </Canvas>
    </div>
  );
}
