import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

interface AudioWaveformProps {
  isListening?: boolean;
  analyser?: AnalyserNode | null;
}

// ── Concentric 3D Frequency Rings ───────────────────────────────────────────
function FrequencyRings({ isListening, analyser }: AudioWaveformProps) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const dataArray = useMemo(() => new Uint8Array(32), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    let bass = 0;
    let mid = 0;
    let treble = 0;

    if (isListening && analyser) {
      analyser.getByteFrequencyData(dataArray);
      bass = (dataArray[2] || 0) / 255;
      mid = (dataArray[10] || 0) / 255;
      treble = (dataArray[20] || 0) / 255;
    } else if (isListening) {
      bass = 0.3 + Math.sin(t * 4) * 0.2;
      mid = 0.25 + Math.cos(t * 3) * 0.15;
      treble = 0.2 + Math.sin(t * 5) * 0.1;
    }

    if (ring1Ref.current) {
      const s1 = 1.0 + bass * 0.6 + Math.sin(t * 2) * 0.05;
      ring1Ref.current.scale.set(s1, s1, s1);
      ring1Ref.current.rotation.x = t * 0.4;
      ring1Ref.current.rotation.y = t * 0.2;
    }
    if (ring2Ref.current) {
      const s2 = 1.4 + mid * 0.7 + Math.cos(t * 2.2) * 0.05;
      ring2Ref.current.scale.set(s2, s2, s2);
      ring2Ref.current.rotation.x = -t * 0.3;
      ring2Ref.current.rotation.z = t * 0.25;
    }
    if (ring3Ref.current) {
      const s3 = 1.8 + treble * 0.8 + Math.sin(t * 1.8) * 0.05;
      ring3Ref.current.scale.set(s3, s3, s3);
      ring3Ref.current.rotation.y = -t * 0.35;
      ring3Ref.current.rotation.z = -t * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.3, 0.018, 16, 64]} />
        <meshStandardMaterial
          color={isListening ? '#00FF9F' : '#00D4FF'}
          emissive={isListening ? '#00FF9F' : '#00D4FF'}
          emissiveIntensity={isListening ? 1.6 : 0.4}
          wireframe={false}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.65, 0.015, 16, 64]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={isListening ? 1.4 : 0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.0, 0.012, 16, 64]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={isListening ? 1.2 : 0.25}
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
}

// ── Floating Sound Particles ────────────────────────────────────────────────
function SoundParticles({ isListening, count = 70 }: { isListening?: boolean; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.0 + Math.random() * 1.5;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      sc[i] = Math.random() * 0.06 + 0.02;
    }
    return [pos, sc];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const speed = isListening ? 0.35 : 0.1;
    pointsRef.current.rotation.y = t * speed;
    pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isListening ? 0.07 : 0.04}
        color={isListening ? '#00FF9F' : '#00D4FF'}
        transparent
        opacity={isListening ? 0.85 : 0.4}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── 3D Cylindrical Waveform Bars ────────────────────────────────────────────
function WaveformBars({ isListening = false, analyser, count = 48 }: AudioWaveformProps & { count?: number }) {
  const barsRef = useRef<THREE.Group>(null);
  const freqData = useMemo(() => new Uint8Array(64), []);

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

    if (isListening && analyser) {
      analyser.getByteFrequencyData(freqData);
    }

    barsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      let height = 0.15;

      if (isListening && analyser) {
        const binIndex = i % 32;
        const normalized = (freqData[binIndex] || 0) / 255;
        height = 0.2 + normalized * 1.4;
      } else if (isListening) {
        // Fallback synthetic wave when mic stream is not directly piped to analyser
        height = 0.25 + Math.abs(Math.sin(t * 6 + i * 0.4)) * 0.75;
      } else {
        // Idle ambient breathing
        height = 0.15 + Math.abs(Math.sin(t * 1.5 + i * 0.25)) * 0.15;
      }

      // Smooth interpolation
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, height, 0.25);
      mesh.position.z = Math.sin(t * 2 + i * 0.2) * 0.08;
    });

    barsRef.current.rotation.z = t * (isListening ? 0.25 : 0.08);
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
            <cylinderGeometry args={[0.035, 0.035, 1, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isListening ? 1.2 : 0.2}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Glowing Microphone Central Element ──────────────────────────────────────
function GlowingMicrophoneCore({ isListening, analyser }: AudioWaveformProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  const dataArray = useMemo(() => new Uint8Array(16), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    let volumeScale = 1.0;
    if (isListening && analyser) {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((acc, v) => acc + v, 0) / dataArray.length / 255;
      volumeScale = 1.0 + avg * 0.45;
    } else if (isListening) {
      volumeScale = 1.0 + Math.sin(t * 7) * 0.15;
    } else {
      volumeScale = 1.0 + Math.sin(t * 2) * 0.03;
    }

    const curScale = groupRef.current.scale.x;
    const targetScale = THREE.MathUtils.lerp(curScale, volumeScale, 0.2);
    groupRef.current.scale.set(targetScale, targetScale, targetScale);

    if (glowMeshRef.current) {
      glowMeshRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Microphone Capsule */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.45, 32]} />
        <meshStandardMaterial
          color={isListening ? '#00FF9F' : '#00D4FF'}
          emissive={isListening ? '#00FF9F' : '#00D4FF'}
          emissiveIntensity={isListening ? 1.6 : 0.5}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* Mic Top Dome */}
      <mesh position={[0, 0.375, 0]}>
        <sphereGeometry args={[0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isListening ? '#00FF9F' : '#38BDF8'}
          emissive={isListening ? '#00FF9F' : '#38BDF8'}
          emissiveIntensity={isListening ? 1.8 : 0.6}
          roughness={0.2}
          wireframe
        />
      </mesh>
      {/* Mic Base Collar */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 0.2, 32]} />
        <meshStandardMaterial
          color="#0F172A"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Glowing Pulsing Outer Sphere Aura */}
      <mesh ref={glowMeshRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          color={isListening ? '#00FF9F' : '#00D4FF'}
          emissive={isListening ? '#00FF9F' : '#00D4FF'}
          emissiveIntensity={isListening ? 0.8 : 0.15}
          transparent
          opacity={isListening ? 0.25 : 0.08}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ── Main Scene ──────────────────────────────────────────────────────────────
export default function AudioWaveform3D({ isListening = false, analyser = null }: AudioWaveformProps) {
  return (
    <div className="w-full h-full min-h-[340px] relative pointer-events-none">
      <Canvas gl={{ alpha: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 4.3]} fov={50} />
        <ambientLight intensity={0.6} />
        <pointLight
          position={[0, 0, 3]}
          intensity={isListening ? 2.5 : 1.2}
          color={isListening ? '#00FF9F' : '#00D4FF'}
        />
        <pointLight position={[-3, -3, -2]} intensity={0.9} color="#00D4FF" />
        <pointLight position={[3, 3, -1]} intensity={0.7} color="#10B981" />

        <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.35}>
          <GlowingMicrophoneCore isListening={isListening} analyser={analyser} />
          <WaveformBars isListening={isListening} analyser={analyser} />
          <FrequencyRings isListening={isListening} analyser={analyser} />
          <SoundParticles isListening={isListening} />
        </Float>
      </Canvas>
    </div>
  );
}
