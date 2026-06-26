import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, Text, useGLTF } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { Box as BoxIcon, AlertCircle } from "lucide-react";
import { BoxGeometry, EdgesGeometry } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

export interface ModelMetrics {
  bboxWidth: number;
  bboxHeight: number;
  bboxDepth: number;
  volume: number;
  surfaceArea: number;
}

function computeMetrics(size: THREE.Vector3): ModelMetrics {
  const w = size.x, h = size.y, d = size.z;
  return {
    bboxWidth: w,
    bboxHeight: h,
    bboxDepth: d,
    volume: w * h * d,
    surfaceArea: 2 * (w * h + w * d + h * d),
  };
}

interface Scene3DProps {
  modelPath: string | null;
  modelUrl: string | null;
  projectId: string;
  dimensions: { length: number; width: number; height: number } | null;
  onModelMetrics?: (metrics: ModelMetrics | null) => void;
}

function RoomBox({ dimensions }: { dimensions: { length: number; width: number; height: number } }) {
  const { length, width, height } = dimensions;
  const scale = Math.max(length, width, height);
  const l = (length / scale) * 4;
  const w = (width / scale) * 4;
  const h = (height / scale) * 4;

  const edges = new EdgesGeometry(new BoxGeometry(l, h, w));

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[l, w]} />
        <meshStandardMaterial color="#e2e8f0" opacity={0.6} transparent />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments geometry={edges} position={[0, h / 2, 0]}>
        <lineBasicMaterial color="#3b82f6" opacity={0.8} transparent />
      </lineSegments>

      {/* Walls semi-transparent */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[l, h, w]} />
        <meshStandardMaterial color="#dbeafe" opacity={0.15} transparent wireframe={false} />
      </mesh>

      {/* Labels */}
      <Text position={[l / 2 + 0.3, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.15} color="#1e40af">
        {`C: ${dimensions.length}m`}
      </Text>
      <Text position={[0, 0.1, w / 2 + 0.3]} rotation={[0, 0, 0]} fontSize={0.15} color="#1e40af">
        {`L: ${dimensions.width}m`}
      </Text>
      <Text position={[l / 2 + 0.3, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.15} color="#0e7490">
        {`A: ${dimensions.height}m`}
      </Text>
    </group>
  );
}

function GLBModel({ url, onMetrics }: { url: string; onMetrics?: (m: ModelMetrics) => void }) {
  const { scene } = useGLTF(url);
  // Auto-center and scale
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = maxDim > 0 ? 3 / maxDim : 1;
  const center = new THREE.Vector3();
  box.getCenter(center);

  useEffect(() => { onMetrics?.(computeMetrics(size)); }, [url]);

  return (
    <primitive
      object={scene}
      scale={scaleFactor}
      position={[-center.x * scaleFactor, -center.y * scaleFactor + (size.y * scaleFactor) / 2, -center.z * scaleFactor]}
    />
  );
}

function OBJModel({ url, onMetrics }: { url: string; onMetrics?: (m: ModelMetrics) => void }) {
  const obj = useLoader(OBJLoader, url);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = maxDim > 0 ? 3 / maxDim : 1;
  const center = new THREE.Vector3();
  box.getCenter(center);

  useEffect(() => { onMetrics?.(computeMetrics(size)); }, [url]);

  return (
    <primitive
      object={obj}
      scale={scaleFactor}
      position={[-center.x * scaleFactor, -center.y * scaleFactor + (size.y * scaleFactor) / 2, -center.z * scaleFactor]}
    />
  );
}

function STLModel({ url, onMetrics }: { url: string; onMetrics?: (m: ModelMetrics) => void }) {
  const geometry = useLoader(STLLoader, url);
  geometry.computeVertexNormals();
  const box = new THREE.Box3().setFromBufferAttribute(
    geometry.attributes.position as THREE.BufferAttribute
  );
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = maxDim > 0 ? 3 / maxDim : 1;
  const center = new THREE.Vector3();
  box.getCenter(center);

  useEffect(() => { onMetrics?.(computeMetrics(size)); }, [url]);

  return (
    <mesh
      scale={scaleFactor}
      position={[-center.x * scaleFactor, -center.y * scaleFactor + (size.y * scaleFactor) / 2, -center.z * scaleFactor]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color="#93c5fd" />
    </mesh>
  );
}

function Model3D({ url, fileName, onMetrics }: { url: string; fileName: string; onMetrics?: (m: ModelMetrics) => void }) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "glb" || ext === "gltf") return <GLBModel url={url} onMetrics={onMetrics} />;
  if (ext === "obj") return <OBJModel url={url} onMetrics={onMetrics} />;
  if (ext === "stl") return <STLModel url={url} onMetrics={onMetrics} />;
  return null;
}

function EmptyScene() {
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      <Text position={[0, 1, 0]} fontSize={0.3} color="#94a3b8" anchorX="center" anchorY="middle">
        {"Preencha as dimensões\npara visualizar o ambiente"}
      </Text>
    </group>
  );
}

function UnsupportedFormat({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toUpperCase();
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      <Text position={[0, 1.5, 0]} fontSize={0.25} color="#64748b" anchorX="center" anchorY="middle">
        {`Arquivo ${ext} enviado com sucesso`}
      </Text>
      <Text position={[0, 0.9, 0]} fontSize={0.18} color="#94a3b8" anchorX="center" anchorY="middle">
        {"Visualização não disponível\npara este formato"}
      </Text>
    </group>
  );
}

export function Scene3D({ modelPath, modelUrl, dimensions, onModelMetrics }: Scene3DProps) {
  const [modelError, setModelError] = useState(false);
  const fileName = modelPath?.split("/").pop() ?? "";
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isViewable = ["glb", "gltf", "obj", "stl"].includes(ext ?? "");
  const hasModel = !!modelUrl && isViewable && !modelError;

  useEffect(() => {
    if (!hasModel) onModelMetrics?.(null);
  }, [hasModel, onModelMetrics]);

  return (
    <div className="relative w-full" style={{ height: 360 }}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border">
        <BoxIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {hasModel ? `Modelo: ${fileName}` : "Visualização 3D"}
        </span>
      </div>

      {modelError && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-destructive/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-destructive/30">
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs text-destructive">Erro ao carregar modelo</span>
        </div>
      )}

      <Canvas camera={{ position: [6, 4, 6], fov: 50 }} shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <Environment preset="city" />

          {hasModel ? (
            <Model3D url={modelUrl} fileName={fileName} onMetrics={onModelMetrics} />
          ) : modelUrl && !isViewable && fileName ? (
            <UnsupportedFormat fileName={fileName} />
          ) : dimensions ? (
            <RoomBox dimensions={dimensions} />
          ) : (
            <EmptyScene />
          )}


          <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#94a3b8"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#475569"
            fadeDistance={20}
            fadeStrength={1}
            infiniteGrid
          />

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={2}
            maxDistance={30}
            target={[0, 1, 0]}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border border-border">
        🖱️ Arrastar • Scroll para zoom
      </div>
    </div>
  );
}