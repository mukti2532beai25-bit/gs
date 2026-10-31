import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Holographic Bill Mesh in 3D
function HolographicBill({ isScanning }: { isScanning: boolean }) {
  const billRef = useRef<THREE.Group>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (billRef.current) {
      billRef.current.rotation.y = Math.sin(t * 0.8) * 0.15;
      billRef.current.rotation.x = Math.cos(t * 0.6) * 0.08;
    }

    if (scanLineRef.current) {
      // Move laser line up and down
      const scanY = Math.sin(t * 2.5) * 1.3;
      scanLineRef.current.position.y = scanY;
    }
  });

  return (
    <group ref={billRef} position={[0, 0, 0]}>
      {/* Bill Document Board */}
      <mesh>
        <planeGeometry args={[2.2, 3.2]} />
        <meshPhysicalMaterial
          color="#0F172A"
          emissive="#00D4FF"
          emissiveIntensity={0.15}
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bill Border Glow */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.2, 3.2)]} />
        <lineBasicMaterial color="#00D4FF" linewidth={2} />
      </lineSegments>

      {/* Simulated Bill Text Lines (Holographic ribs) */}
      {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.01]}>
          <planeGeometry args={[1.6 - (idx % 2) * 0.4, 0.06]} />
          <meshBasicMaterial
            color={idx === 1 || idx === 4 ? '#10B981' : '#38BDF8'}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Laser Scanning Bar */}
      {isScanning && (
        <mesh ref={scanLineRef} position={[0, 0, 0.04]}>
          <planeGeometry args={[2.4, 0.08]} />
          <meshBasicMaterial color="#00FF9F" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Corner Target Reticles */}
      {[
        [-1.1, 1.6],
        [1.1, 1.6],
        [-1.1, -1.6],
        [1.1, -1.6],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.02]}>
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
      ))}
    </group>
  );
}

// Scanning Sensor Field / Ring
function SensorRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = -state.clock.getElapsedTime() * 0.4;
  });

  return (
    <mesh ref={ringRef} position={[0, 0, -0.2]}>
      <ringGeometry args={[2.2, 2.3, 48]} />
      <meshBasicMaterial color="#00D4FF" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function ScanningPortal3D({ isScanning = true }: { isScanning?: boolean }) {
  return (
    <div className="w-full h-full min-h-[360px] relative pointer-events-none">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-slate-900/40 rounded-2xl border border-white/5">
            <p className="text-xs font-mono text-cyan-400">3D Scanning Portal Active</p>
          </div>
        }
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 3, 3]} intensity={1.5} color="#00D4FF" />
        <pointLight position={[0, -3, 2]} intensity={1.2} color="#10B981" />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
          <HolographicBill isScanning={isScanning} />
          <SensorRing />
        </Float>
      </Canvas>
    </div>
  );
}
