import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

export interface ColumnMeta {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
  nullable?: boolean;
  ref?: string;
}

export interface TableMeta {
  id: string;
  name: string;
  role: string;
  color: string;
  records: number;
  isSource?: boolean;
  pos3d: [number, number, number];
  columns: ColumnMeta[];
}

export interface RelationshipMeta {
  id: string;
  from: string;
  to: string;
  fromCol: string;
  toCol: string;
  label: string;
  color: string;
}

interface DatabaseArchitect3DProps {
  tables: TableMeta[];
  relationships: RelationshipMeta[];
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  currentStage: 'raw' | '1nf' | '2nf' | '3nf';
  activeTableIds: string[];
  resetCameraTrigger?: number;
}

// ── 3D Table Node Component ─────────────────────────────────────────────────
function TableBoxNode({
  table,
  isSelected,
  isActiveInStage,
  onSelect,
}: {
  table: TableMeta;
  isSelected: boolean;
  isActiveInStage: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const pkCount = useMemo(() => table.columns.filter((c) => c.isPK).length, [table]);
  const fkCount = useMemo(() => table.columns.filter((c) => c.isFK).length, [table]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Subtle floating breathing effect
    const baseY = table.pos3d[1];
    groupRef.current.position.y = baseY + Math.sin(t * 1.5 + table.pos3d[0]) * 0.05;

    // Smooth scaling for active/inactive state
    const targetScale = !isActiveInStage ? 0.4 : isSelected ? 1.15 : hovered ? 1.08 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
  });

  const boxWidth = 1.6;
  const boxHeight = 0.95;
  const boxDepth = 0.35;

  return (
    <group
      ref={groupRef}
      position={table.pos3d}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Table Box Body */}
      <mesh>
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
        <meshPhysicalMaterial
          color={isSelected ? '#064E3B' : hovered ? '#0F172A' : '#090D1A'}
          emissive={isSelected ? '#00FF9F' : hovered ? table.color : table.color}
          emissiveIntensity={isSelected ? 0.7 : hovered ? 0.45 : 0.25}
          roughness={0.15}
          metalness={0.7}
          clearcoat={0.9}
          transparent
          opacity={isActiveInStage ? 0.92 : 0.2}
        />
      </mesh>

      {/* Wireframe Outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)]} />
        <lineBasicMaterial
          color={isSelected ? '#00FF9F' : hovered ? '#38BDF8' : table.color}
          transparent
          opacity={isActiveInStage ? 0.8 : 0.15}
          linewidth={2}
        />
      </lineSegments>

      {/* Outer Halo on Selection */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[boxWidth + 0.15, boxHeight + 0.15, boxDepth + 0.15]} />
          <meshBasicMaterial color="#00FF9F" wireframe transparent opacity={0.35} />
        </mesh>
      )}

      {/* 3D Text Header */}
      <Text
        position={[0, 0.22, boxDepth / 2 + 0.02]}
        fontSize={0.13}
        color={isSelected ? '#00FF9F' : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
      >
        {table.name}
      </Text>

      {/* Role Subtext */}
      <Text
        position={[0, 0.04, boxDepth / 2 + 0.02]}
        fontSize={0.075}
        color="#94A3B8"
        anchorX="center"
        anchorY="middle"
      >
        {table.role.length > 24 ? table.role.slice(0, 24) + '...' : table.role}
      </Text>

      {/* Column and Key Badges */}
      <Text
        position={[0, -0.16, boxDepth / 2 + 0.02]}
        fontSize={0.07}
        color={table.color}
        anchorX="center"
        anchorY="middle"
      >
        {`${table.columns.length} cols • PK: ${pkCount} • FK: ${fkCount}`}
      </Text>

      {/* Record Counter Pill */}
      <Text
        position={[0, -0.32, boxDepth / 2 + 0.02]}
        fontSize={0.065}
        color="#64748B"
        anchorX="center"
        anchorY="middle"
      >
        {`${table.records} records`}
      </Text>
    </group>
  );
}

// ── Relationship Line with Animated Particles ───────────────────────────────
function RelationshipConnector({
  rel,
  startPos,
  endPos,
  isSelected,
  isDimmed,
}: {
  rel: RelationshipMeta;
  startPos: [number, number, number];
  endPos: [number, number, number];
  isSelected: boolean;
  isDimmed: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);

  // Compute points along line
  const startVec = useMemo(() => new THREE.Vector3(...startPos), [startPos]);
  const endVec = useMemo(() => new THREE.Vector3(...endPos), [endPos]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
  }, [startVec, endVec]);

  useFrame((state) => {
    if (!particleRef.current) return;
    const t = (state.clock.getElapsedTime() * 0.4) % 1;
    // Animate data particle along the vector from source to target
    particleRef.current.position.lerpVectors(startVec, endVec, t);
  });

  return (
    <group>
      {/* Connecting Laser Wire */}
      <primitive
        object={
          new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: isSelected ? '#00FF9F' : rel.color,
              transparent: true,
              opacity: isDimmed ? 0.08 : isSelected ? 0.95 : 0.45,
            })
          )
        }
      />
      {/* Animated Traveling Data Particle */}
      {!isDimmed && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#00FF9F' : '#38BDF8'}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Camera Controller for Smooth Reset ──────────────────────────────────────
function CameraController({ resetTrigger }: { resetTrigger?: number }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      camera.position.set(0, 0, 6.2);
      controlsRef.current.update();
    }
  }, [resetTrigger, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={2.5}
      maxDistance={12}
      maxPolarAngle={Math.PI / 1.5}
      minPolarAngle={Math.PI / 6}
    />
  );
}

// ── Main Scene Export ───────────────────────────────────────────────────────
export default function DatabaseArchitect3D({
  tables,
  relationships,
  selectedTableId,
  onSelectTable,
  currentStage,
  activeTableIds,
  resetCameraTrigger = 0,
}: DatabaseArchitect3DProps) {
  // Map tables by ID for fast position lookup
  const tableMap = useMemo(() => {
    const map = new Map<string, TableMeta>();
    tables.forEach((t) => map.set(t.id, t));
    return map;
  }, [tables]);

  return (
    <div className="w-full h-full min-h-[460px] sm:min-h-[520px] relative select-none">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        onClick={() => onSelectTable('')}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 6.2]} fov={48} />
        <CameraController resetTrigger={resetCameraTrigger} />

        <ambientLight intensity={0.65} />
        <pointLight position={[5, 5, 5]} intensity={1.8} color="#00D4FF" />
        <pointLight position={[-5, -5, 3]} intensity={1.4} color="#10B981" />
        <pointLight position={[0, 4, -2]} intensity={1.2} color="#F59E0B" />

        <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.2}>
          {/* Render 3D Table Nodes */}
          {tables.map((table) => {
            const isActive = activeTableIds.includes(table.id);
            const isSelected = selectedTableId === table.id;
            return (
              <TableBoxNode
                key={table.id}
                table={table}
                isSelected={isSelected}
                isActiveInStage={isActive}
                onSelect={() => onSelectTable(table.id)}
              />
            );
          })}

          {/* Render Relationship Connections */}
          {relationships.map((rel) => {
            const startTable = tableMap.get(rel.from);
            const endTable = tableMap.get(rel.to);
            if (!startTable || !endTable) return null;

            const isStartActive = activeTableIds.includes(startTable.id);
            const isEndActive = activeTableIds.includes(endTable.id);
            const isDimmed = !isStartActive || !isEndActive;
            const isSelected =
              selectedTableId === startTable.id || selectedTableId === endTable.id;

            return (
              <RelationshipConnector
                key={rel.id}
                rel={rel}
                startPos={startTable.pos3d}
                endPos={endTable.pos3d}
                isSelected={isSelected}
                isDimmed={isDimmed}
              />
            );
          })}
        </Float>
      </Canvas>
    </div>
  );
}
