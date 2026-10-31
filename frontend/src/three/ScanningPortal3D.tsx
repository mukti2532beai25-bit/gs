import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

export type ScanState = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'complete' | 'failed';

interface ScanningPortal3DProps {
  scanState?: ScanState;
}

// ── 1. The Holographic / Physical Paper Bill with Animated Edges ─────────────
function PaperBillModel({ scanState }: { scanState: ScanState }) {
  const groupRef = useRef<THREE.Group>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);

  const isScanningActive = scanState === 'scanning' || scanState === 'extracting';
  const isFailed = scanState === 'failed';
  const isComplete = scanState === 'complete';

  const glowColor = isFailed ? '#EF4444' : isComplete ? '#00FF9F' : isScanningActive ? '#00FF9F' : '#00D4FF';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gentle floating orientation
      const tiltAmp = isScanningActive ? 0.05 : 0.12;
      groupRef.current.rotation.y = Math.sin(t * 0.8) * tiltAmp;
      groupRef.current.rotation.x = 0.1 + Math.cos(t * 0.6) * 0.05;
    }

    if (scanLineRef.current && isScanningActive) {
      // High-speed emerald scanning laser sweep
      const speed = scanState === 'extracting' ? 4.5 : 2.8;
      scanLineRef.current.position.y = Math.sin(t * speed) * 1.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main 3D Bill Sheet */}
      <mesh>
        <planeGeometry args={[2.3, 3.3]} />
        <meshPhysicalMaterial
          color="#0B132B"
          emissive={glowColor}
          emissiveIntensity={isScanningActive ? 0.35 : 0.15}
          roughness={0.2}
          metalness={0.6}
          clearcoat={1}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Animated Glowing Document Borders */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.3, 3.3)]} />
        <lineBasicMaterial color={glowColor} linewidth={2} />
      </lineSegments>

      {/* Four Registration Target Corners */}
      {[
        [-1.15, 1.65],
        [1.15, 1.65],
        [-1.15, -1.65],
        [1.15, -1.65],
      ].map(([x, y], idx) => (
        <group key={`corner-${idx}`} position={[x, y, 0.03]}>
          <mesh>
            <ringGeometry args={[0.07, 0.11, 16]} />
            <meshBasicMaterial color={isScanningActive ? '#00FF9F' : '#F59E0B'} />
          </mesh>
        </group>
      ))}

      {/* Simulated Printed Lines */}
      {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.3].map((y, idx) => (
        <mesh key={`text-rib-${idx}`} position={[0, y, 0.02]}>
          <planeGeometry args={[1.7 - (idx % 3) * 0.3, 0.05]} />
          <meshBasicMaterial
            color={idx === 2 || idx === 5 ? '#00FF9F' : '#38BDF8'}
            transparent
            opacity={isScanningActive ? 0.9 : 0.6}
          />
        </mesh>
      ))}

      {/* Moving Emerald Laser Scanning Beam */}
      {isScanningActive && (
        <mesh ref={scanLineRef} position={[0, 0, 0.06]}>
          <planeGeometry args={[2.5, 0.08]} />
          <meshBasicMaterial
            color="#00FF9F"
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Holographic Watermark / Status */}
      <Text
        position={[0, -1.3, 0.04]}
        fontSize={0.12}
        color={glowColor}
        anchorX="center"
        anchorY="middle"
      >
        {isScanningActive
          ? 'NEURAL OCR IN PROGRESS'
          : isComplete
          ? 'EXTRACTION VERIFIED'
          : isFailed
          ? 'CAPTURE ERROR'
          : '3D SCAN READY'}
      </Text>
    </group>
  );
}

// ── 2. Dual Concentric Scanning Rings ─────────────────────────────────────────
function DualPortalRings({ scanState }: { scanState: ScanState }) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  const isScanningActive = scanState === 'scanning' || scanState === 'extracting';
  const ringColor = scanState === 'failed' ? '#EF4444' : '#00D4FF';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speedMultiplier = isScanningActive ? 2.5 : 1.0;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.25 * speedMultiplier;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.4 * speedMultiplier;
    }
  });

  return (
    <group position={[0, 0, -0.2]}>
      {/* Outer Torus Portal Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[2.3, 0.02, 16, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.4} />
      </mesh>

      {/* Inner Torus Portal Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[2.0, 0.03, 16, 48]} />
        <meshStandardMaterial
          color="#00FF9F"
          emissive="#00FF9F"
          emissiveIntensity={isScanningActive ? 1.2 : 0.4}
        />
      </mesh>
    </group>
  );
}

// ── 3. OCR Scanning Particles ─────────────────────────────────────────────────
function OcrScanningParticles({ scanState, count = 100 }: { scanState: ScanState; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const isScanningActive = scanState === 'scanning' || scanState === 'extracting';

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color('#00FF9F'), new THREE.Color('#00D4FF'), new THREE.Color('#38BDF8')];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const speed = isScanningActive ? 0.3 : 0.1;
    pointsRef.current.rotation.y = t * speed;
    pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={isScanningActive ? 0.16 : 0.09}
        vertexColors
        transparent
        opacity={isScanningActive ? 0.9 : 0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── 4. Main Scanning Scene Container ──────────────────────────────────────────
export default function ScanningPortal3D({ scanState = 'idle' }: ScanningPortal3DProps) {
  const isScanningActive = scanState === 'scanning' || scanState === 'extracting';

  return (
    <div className="w-full h-full min-h-[380px] relative pointer-events-none">
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5">
            <p className="text-xs font-mono text-emerald-400">3D Scanning Portal Active (Safe Mode)</p>
          </div>
        }
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={45} />

        {/* Ambient & Spotlight Beam */}
        <ambientLight intensity={0.5} />
        <pointLight
          position={[0, 2, 3]}
          intensity={isScanningActive ? 2.2 : 1.2}
          color={isScanningActive ? '#00FF9F' : '#00D4FF'}
        />
        <pointLight position={[-3, -3, 2]} intensity={0.8} color="#10B981" />

        <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.3}>
          <PaperBillModel scanState={scanState} />
          <DualPortalRings scanState={scanState} />
          <OcrScanningParticles scanState={scanState} count={120} />
        </Float>
      </Canvas>
    </div>
  );
}
