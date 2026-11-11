
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  OrbitControls,
  Sphere,
  Stars,
} from "@react-three/drei";

function AnimatedSphere() {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere args={[1.25, 100, 100]} scale={1.15}>
        <MeshDistortMaterial
          color="#397cff"
          emissive="#5124bd"
          emissiveIntensity={1.8}
          roughness={0.15}
          metalness={0.8}
          distort={0.42}
          speed={2.5}
        />
      </Sphere>
    </Float>
  );
}

function OrbitRing({
  radius,
  rotation,
  color,
}: {
  radius: number;
  rotation: [number, number, number];
  color: string;
}) {
  return (
    <mesh rotation={rotation}>
      <torusGeometry args={[radius, 0.009, 16, 160]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
      />
    </mesh>
  );
}

export default function AIHero3D() {
  return (
    <div className="ai-hero-3d">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.2} />

          <pointLight
            position={[3, 3, 4]}
            intensity={35}
            color="#48cfff"
          />

          <pointLight
            position={[-3, -2, 2]}
            intensity={25}
            color="#a66bff"
          />

          <Stars
            radius={80}
            depth={40}
            count={1000}
            factor={3}
            saturation={0.5}
            fade
            speed={0.7}
          />

          <AnimatedSphere />

          <OrbitRing
            radius={1.75}
            rotation={[0.7, 0.2, 0.4]}
            color="#48cfff"
          />

          <OrbitRing
            radius={2}
            rotation={[1.2, 0.8, 0.2]}
            color="#a66bff"
          />

          <OrbitRing
            radius={2.2}
            rotation={[0.2, 1.1, 0.8]}
            color="#367aff"
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.8}
          />
        </Suspense>
      </Canvas>

      <div className="ai-hero-label">
        <span>✧</span>
        <strong>COGNITIVE AI CORE</strong>
        <small>INTELLIGENT SYSTEM ACTIVE</small>
      </div>
    </div>
  );
}
