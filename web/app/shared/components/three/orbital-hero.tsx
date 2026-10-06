import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * A quiet, rotating cluster of extruded ribbons meant to feel like
 * "course material being woven together". No bloom, no glass — intentionally
 * clean, pairs well with a cream/paper background.
 */
export function OrbitalHero() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-5, -2, -3]} intensity={0.3} color="#9ab" />

      <Float
        speed={1.2}
        rotationIntensity={0.4}
        floatIntensity={0.6}
        floatingRange={[-0.1, 0.1]}
      >
        <RibbonStack />
      </Float>
    </Canvas>
  );
}

function RibbonStack() {
  const group = useRef<THREE.Group>(null);
  const ribbons = useMemo(() => {
    const items: {
      radius: number;
      tube: number;
      arc: number;
      rot: [number, number, number];
      color: string;
    }[] = [];
    const palette = ["#181714", "#3a63f0", "#00693e", "#c2b280", "#262521"];
    for (let i = 0; i < 5; i++) {
      items.push({
        radius: 1.6 + i * 0.18,
        tube: 0.028,
        arc: Math.PI * 1.4,
        rot: [i * 0.4, i * 0.6, i * 0.2],
        color: palette[i % palette.length],
      });
    }
    return items;
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.12;
    group.current.rotation.x += dt * 0.04;
  });

  return (
    <group ref={group}>
      {ribbons.map((r, i) => (
        <mesh key={i} rotation={r.rot}>
          <torusGeometry args={[r.radius, r.tube, 48, 128, r.arc]} />
          <meshStandardMaterial
            color={r.color}
            metalness={0.1}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Core */}
      <mesh>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial
          color="#181714"
          flatShading
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
