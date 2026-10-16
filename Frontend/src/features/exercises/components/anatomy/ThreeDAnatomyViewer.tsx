import { useRef, useEffect, useState, memo, useCallback } from "react";
import * as THREE from "three";
import {
  CalisHealthMuscle,
  MuscleTarget,
  MuscleActivation,
  MuscleRole,
} from "../../types/exercise";
import { CALISHEALTH_MUSCLE_CATALOG, mapActivationToIntensity } from "./bodyMusclesAdapter";
import {
  RotateCw,
  Maximize2,
  Sparkles,
  Layers,
  Activity,
  Eye,
  Camera,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";

interface ThreeDAnatomyViewerProps {
  targets: MuscleTarget[];
  onSelectMuscle: (muscle: CalisHealthMuscle) => void;
  readOnly?: boolean;
}

interface MuscleMeshDef {
  calisHealthId: string;
  nameVi: string;
  nameEn: string;
  region: string;
  createGeometries: () => THREE.BufferGeometry[];
  positions: [number, number, number][];
  rotations?: [number, number, number][];
  scales?: [number, number, number][];
}

export const ThreeDAnatomyViewer = memo(function ThreeDAnatomyViewer({
  targets,
  onSelectMuscle,
  readOnly = false,
}: ThreeDAnatomyViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<CalisHealthMuscle | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [cameraView, setCameraView] = useState<"front" | "back" | "side" | "upper" | "lower">("front");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const musclesGroupRef = useRef<THREE.Group | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const autoRotateRef = useRef<boolean>(false);
  const targetRotationRef = useRef<{ y: number; x: number }>({ y: 0, x: 0 });
  const currentRotationRef = useRef<{ y: number; x: number }>({ y: 0, x: 0 });
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 7.5));
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);

  autoRotateRef.current = isAutoRotating;

  // Build 3D Muscle Mesh Definitions with smooth anatomically curved 3D primitives
  const getMuscleMeshDefinitions = useCallback((): MuscleMeshDef[] => {
    return [
      // 1. CHEST: Pectoralis Major (Left & Right)
      {
        calisHealthId: "muscle_pectoralis_major",
        nameVi: "Cơ ngực lớn (Pectoralis Major)",
        nameEn: "Pectoralis Major",
        region: "CHEST",
        createGeometries: () => [
          new THREE.BoxGeometry(0.68, 0.48, 0.28),
          new THREE.BoxGeometry(0.68, 0.48, 0.28),
        ],
        positions: [
          [-0.42, 1.32, 0.36],
          [0.42, 1.32, 0.36],
        ],
        rotations: [
          [0, 0.15, -0.08],
          [0, -0.15, 0.08],
        ],
      },
      // 2. ABDOMINALS: Rectus Abdominis (6-Pack)
      {
        calisHealthId: "muscle_rectus_abdominis",
        nameVi: "Cơ thẳng bụng 6 múi (Rectus Abdominis)",
        nameEn: "Rectus Abdominis",
        region: "ABDOMINALS",
        createGeometries: () => [
          new THREE.BoxGeometry(0.55, 0.95, 0.24),
        ],
        positions: [[0, 0.65, 0.32]],
      },
      // 3. OBLIQUES: (Left & Right)
      {
        calisHealthId: "muscle_obliques",
        nameVi: "Cơ liên sườn (Obliques)",
        nameEn: "Obliques",
        region: "ABDOMINALS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.2, 0.24, 0.85, 16),
          new THREE.CylinderGeometry(0.2, 0.24, 0.85, 16),
        ],
        positions: [
          [-0.56, 0.65, 0.15],
          [0.56, 0.65, 0.15],
        ],
        rotations: [
          [0, 0, -0.1],
          [0, 0, 0.1],
        ],
      },
      // 4. SHOULDERS: Anterior Deltoids (Left & Right)
      {
        calisHealthId: "muscle_deltoid_anterior",
        nameVi: "Cơ vai trước (Anterior Deltoid)",
        nameEn: "Anterior Deltoid",
        region: "SHOULDERS",
        createGeometries: () => [
          new THREE.SphereGeometry(0.32, 20, 20),
          new THREE.SphereGeometry(0.32, 20, 20),
        ],
        positions: [
          [-0.98, 1.48, 0.2],
          [0.98, 1.48, 0.2],
        ],
      },
      // 5. SHOULDERS: Lateral Deltoids (Left & Right)
      {
        calisHealthId: "muscle_deltoid_lateral",
        nameVi: "Cơ vai giữa (Lateral Deltoid)",
        nameEn: "Lateral Deltoid",
        region: "SHOULDERS",
        createGeometries: () => [
          new THREE.SphereGeometry(0.3, 20, 20),
          new THREE.SphereGeometry(0.3, 20, 20),
        ],
        positions: [
          [-1.15, 1.45, 0],
          [1.15, 1.45, 0],
        ],
      },
      // 6. SHOULDERS: Posterior Deltoids (Left & Right)
      {
        calisHealthId: "muscle_deltoid_posterior",
        nameVi: "Cơ vai sau (Posterior Deltoid)",
        nameEn: "Posterior Deltoid",
        region: "SHOULDERS",
        createGeometries: () => [
          new THREE.SphereGeometry(0.3, 20, 20),
          new THREE.SphereGeometry(0.3, 20, 20),
        ],
        positions: [
          [-0.95, 1.45, -0.2],
          [0.95, 1.45, -0.2],
        ],
      },
      // 7. ARMS: Biceps Brachii (Left & Right)
      {
        calisHealthId: "muscle_biceps_brachii",
        nameVi: "Cơ nhị đầu tay trước (Biceps)",
        nameEn: "Biceps Brachii",
        region: "ARMS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.2, 0.18, 0.75, 16),
          new THREE.CylinderGeometry(0.2, 0.18, 0.75, 16),
        ],
        positions: [
          [-1.18, 0.88, 0.12],
          [1.18, 0.88, 0.12],
        ],
      },
      // 8. ARMS: Triceps Brachii (Left & Right)
      {
        calisHealthId: "muscle_triceps_brachii",
        nameVi: "Cơ tam đầu tay sau (Triceps)",
        nameEn: "Triceps Brachii",
        region: "ARMS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.22, 0.19, 0.82, 16),
          new THREE.CylinderGeometry(0.22, 0.19, 0.82, 16),
        ],
        positions: [
          [-1.18, 0.88, -0.15],
          [1.18, 0.88, -0.15],
        ],
      },
      // 9. ARMS: Forearms (Left & Right)
      {
        calisHealthId: "muscle_forearms",
        nameVi: "Cơ cẳng tay & Cổ tay (Forearms)",
        nameEn: "Forearms",
        region: "ARMS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.17, 0.13, 0.85, 16),
          new THREE.CylinderGeometry(0.17, 0.13, 0.85, 16),
        ],
        positions: [
          [-1.25, -0.05, 0.05],
          [1.25, -0.05, 0.05],
        ],
      },
      // 10. BACK: Latissimus Dorsi (Left & Right)
      {
        calisHealthId: "muscle_latissimus_dorsi",
        nameVi: "Cơ xô lưng V-Taper (Lats)",
        nameEn: "Latissimus Dorsi",
        region: "BACK",
        createGeometries: () => [
          new THREE.BoxGeometry(0.5, 0.95, 0.28),
          new THREE.BoxGeometry(0.5, 0.95, 0.28),
        ],
        positions: [
          [-0.48, 1.05, -0.32],
          [0.48, 1.05, -0.32],
        ],
        rotations: [
          [0, -0.2, 0.1],
          [0, 0.2, -0.1],
        ],
      },
      // 11. BACK: Trapezius (Upper & Middle Back)
      {
        calisHealthId: "muscle_trapezius",
        nameVi: "Cơ cầu vai & Giữa lưng (Trapezius)",
        nameEn: "Trapezius",
        region: "BACK",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.18, 0.65, 0.9, 16),
        ],
        positions: [[0, 1.55, -0.25]],
      },
      // 12. BACK: Erector Spinae (Lower Back)
      {
        calisHealthId: "muscle_erector_spinae",
        nameVi: "Cơ thắt lưng dưới (Lower Back)",
        nameEn: "Erector Spinae",
        region: "BACK",
        createGeometries: () => [
          new THREE.BoxGeometry(0.48, 0.75, 0.24),
        ],
        positions: [[0, 0.45, -0.28]],
      },
      // 13. GLUTES: Gluteus Maximus (Left & Right)
      {
        calisHealthId: "muscle_gluteus_maximus",
        nameVi: "Cơ mông lớn (Gluteus Maximus)",
        nameEn: "Gluteus Maximus",
        region: "GLUTES",
        createGeometries: () => [
          new THREE.SphereGeometry(0.44, 20, 20),
          new THREE.SphereGeometry(0.44, 20, 20),
        ],
        positions: [
          [-0.38, -0.22, -0.3],
          [0.38, -0.22, -0.3],
        ],
      },
      // 14. LEGS: Quadriceps (Left & Right)
      {
        calisHealthId: "muscle_quadriceps",
        nameVi: "Cơ đùi trước (Quadriceps)",
        nameEn: "Quadriceps",
        region: "LEGS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.32, 0.24, 1.25, 20),
          new THREE.CylinderGeometry(0.32, 0.24, 1.25, 20),
        ],
        positions: [
          [-0.42, -1.05, 0.16],
          [0.42, -1.05, 0.16],
        ],
      },
      // 15. LEGS: Hamstrings (Left & Right)
      {
        calisHealthId: "muscle_hamstrings",
        nameVi: "Cơ đùi sau (Hamstrings)",
        nameEn: "Hamstrings",
        region: "LEGS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.3, 0.23, 1.25, 20),
          new THREE.CylinderGeometry(0.3, 0.23, 1.25, 20),
        ],
        positions: [
          [-0.42, -1.05, -0.16],
          [0.42, -1.05, -0.16],
        ],
      },
      // 16. LEGS: Calves (Left & Right)
      {
        calisHealthId: "muscle_calves",
        nameVi: "Cơ bắp chuối (Calves)",
        nameEn: "Calves",
        region: "LEGS",
        createGeometries: () => [
          new THREE.CylinderGeometry(0.26, 0.16, 1.15, 20),
          new THREE.CylinderGeometry(0.26, 0.16, 1.15, 20),
        ],
        positions: [
          [-0.44, -2.35, -0.06],
          [0.44, -2.35, -0.06],
        ],
      },
    ];
  }, []);

  // Update Muscle Colors based on Active Targets
  const updateMuscleMaterials = useCallback(() => {
    if (!meshMapRef.current) return;

    meshMapRef.current.forEach((meshes, muscleId) => {
      const target = targets.find((t) => t.muscleId === muscleId);

      let color = new THREE.Color("#4a5568"); // Default sleek metallic slate
      let emissive = new THREE.Color("#000000");
      let emissiveIntensity = 0;
      let roughness = 0.45;
      let metalness = 0.2;

      if (target) {
        if (target.role === "PRIMARY") {
          color = new THREE.Color("#e11d48"); // Crimson Red
          emissive = new THREE.Color("#f43f5e");
          emissiveIntensity = target.activationLevel === "VERY_HIGH" ? 0.9 : 0.65;
          roughness = 0.2;
        } else if (target.role === "SECONDARY") {
          color = new THREE.Color("#f59e0b"); // Amber Warm
          emissive = new THREE.Color("#fbbf24");
          emissiveIntensity = 0.5;
          roughness = 0.3;
        } else {
          color = new THREE.Color("#10b981"); // Emerald Green
          emissive = new THREE.Color("#34d399");
          emissiveIntensity = 0.45;
          roughness = 0.3;
        }
      }

      meshes.forEach((mesh) => {
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.copy(color);
          mesh.material.emissive.copy(emissive);
          mesh.material.emissiveIntensity = emissiveIntensity;
          mesh.material.roughness = roughness;
          mesh.material.metalness = metalness;
          mesh.material.needsUpdate = true;
        }
      });
    });
  }, [targets]);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // 3. Renderer with High Performance & Shadow Map
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights: Studio 3-Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(4, 6, 6);
    scene.add(mainLight);

    const backRimLight = new THREE.DirectionalLight(0x4f7f61, 1.8);
    backRimLight.position.set(-4, 3, -6);
    scene.add(backRimLight);

    const blueFillLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    blueFillLight.position.set(0, -5, 4);
    scene.add(blueFillLight);

    // 5. Studio Floor Grid Platform
    const grid = new THREE.GridHelper(8, 20, 0x4f7f61, 0x27272a);
    grid.position.y = -3.2;
    scene.add(grid);

    // 6. Muscular Anatomy Body Group
    const musclesGroup = new THREE.Group();
    scene.add(musclesGroup);
    musclesGroupRef.current = musclesGroup;

    // Base Skeletal / Mannequin Core (Head, Neck, Pelvis, Hands, Feet)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f242c,
      roughness: 0.6,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), baseMaterial);
    head.position.set(0, 2.22, 0);
    musclesGroup.add(head);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.4, 16), baseMaterial);
    neck.position.set(0, 1.82, 0);
    musclesGroup.add(neck);

    // Spine Column
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.6, 16), baseMaterial);
    spine.position.set(0, 0.9, 0);
    musclesGroup.add(spine);

    // Hands
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.1), baseMaterial);
    leftHand.position.set(-1.28, -0.65, 0.05);
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.1), baseMaterial);
    rightHand.position.set(1.28, -0.65, 0.05);
    musclesGroup.add(leftHand, rightHand);

    // Feet
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.48), baseMaterial);
    leftFoot.position.set(-0.44, -3.05, 0.12);
    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.48), baseMaterial);
    rightFoot.position.set(0.44, -3.05, 0.12);
    musclesGroup.add(leftFoot, rightFoot);

    // 7. Generate Interactive 3D Muscle Volumes
    const muscleDefs = getMuscleMeshDefinitions();
    const map = new Map<string, THREE.Mesh[]>();

    muscleDefs.forEach((def) => {
      const geoms = def.createGeometries();
      const meshes: THREE.Mesh[] = [];

      geoms.forEach((geom, idx) => {
        const mat = new THREE.MeshStandardMaterial({
          color: 0x3f4856,
          roughness: 0.4,
          metalness: 0.2,
          emissive: 0x000000,
          emissiveIntensity: 0,
        });

        const mesh = new THREE.Mesh(geom, mat);
        const pos = def.positions[idx] || [0, 0, 0];
        mesh.position.set(pos[0], pos[1], pos[2]);

        if (def.rotations && def.rotations[idx]) {
          mesh.rotation.set(def.rotations[idx][0], def.rotations[idx][1], def.rotations[idx][2]);
        }

        mesh.userData = {
          calisHealthId: def.calisHealthId,
          nameVi: def.nameVi,
          nameEn: def.nameEn,
          region: def.region,
        };

        musclesGroup.add(mesh);
        meshes.push(mesh);
      });

      map.set(def.calisHealthId, meshes);
    });

    meshMapRef.current = map;
    updateMuscleMaterials();

    // 8. Animation & Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (musclesGroupRef.current) {
        if (autoRotateRef.current) {
          musclesGroupRef.current.rotation.y += 0.01;
          targetRotationRef.current.y = musclesGroupRef.current.rotation.y;
        } else {
          // Smooth Lerp rotation
          currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;
          currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
          musclesGroupRef.current.rotation.y = currentRotationRef.current.y;
          musclesGroupRef.current.rotation.x = currentRotationRef.current.x;
        }
      }

      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPosRef.current, 0.08);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update target colors when targets prop change
  useEffect(() => {
    updateMuscleMaterials();
  }, [targets, updateMuscleMaterials]);

  // Mouse drag Orbit Controls handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !musclesGroupRef.current) return;

    // 1. Raycasting for hover state
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(musclesGroupRef.current.children);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      if (hit.userData?.calisHealthId) {
        const muscleMeta = CALISHEALTH_MUSCLE_CATALOG.find(
          (m) => m.id === hit.userData.calisHealthId
        );
        if (muscleMeta) {
          setHoveredMuscle(muscleMeta);
          hoveredMeshRef.current = hit;
        }
      }
    } else {
      setHoveredMuscle(null);
      hoveredMeshRef.current = null;
    }

    // 2. Drag Orbit Rotation
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.008;
      targetRotationRef.current.x = Math.max(-0.4, Math.min(0.4, targetRotationRef.current.x + deltaY * 0.005));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (readOnly || !hoveredMuscle) return;
    onSelectMuscle(hoveredMuscle);
  };

  // Camera Presets
  const setPresetView = (view: "front" | "back" | "side" | "upper" | "lower") => {
    setCameraView(view);
    setIsAutoRotating(false);

    if (view === "front") {
      targetRotationRef.current = { y: 0, x: 0 };
      targetCameraPosRef.current.set(0, 0, 7.5);
    } else if (view === "back") {
      targetRotationRef.current = { y: Math.PI, x: 0 };
      targetCameraPosRef.current.set(0, 0, 7.5);
    } else if (view === "side") {
      targetRotationRef.current = { y: Math.PI / 2, x: 0 };
      targetCameraPosRef.current.set(0, 0, 7.5);
    } else if (view === "upper") {
      targetRotationRef.current = { y: 0, x: -0.15 };
      targetCameraPosRef.current.set(0, 1.2, 5.5);
    } else if (view === "lower") {
      targetRotationRef.current = { y: 0, x: 0.15 };
      targetCameraPosRef.current.set(0, -1.2, 5.5);
    }
  };

  return (
    <div className="relative flex flex-col items-center rounded-3xl border border-border bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-4 text-white shadow-2xl overflow-hidden">
      {/* 1. Header Toolbar with Presets */}
      <div className="flex flex-wrap items-center justify-between w-full border-b border-zinc-800/80 pb-3 gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/20 text-accent border border-accent/30">
            <Sparkles size={14} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Mô hình Giải phẫu 3D (Three.js WebGL)</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
          </div>
        </div>

        {/* Camera Views Selector */}
        <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setPresetView("front")}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              cameraView === "front" ? "bg-accent text-white shadow-xs" : "text-zinc-400 hover:text-white"
            }`}
          >
            Mặt trước
          </button>
          <button
            type="button"
            onClick={() => setPresetView("back")}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              cameraView === "back" ? "bg-accent text-white shadow-xs" : "text-zinc-400 hover:text-white"
            }`}
          >
            Mặt sau
          </button>
          <button
            type="button"
            onClick={() => setPresetView("side")}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              cameraView === "side" ? "bg-accent text-white shadow-xs" : "text-zinc-400 hover:text-white"
            }`}
          >
            Nghiêng
          </button>
          <button
            type="button"
            onClick={() => setPresetView("upper")}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              cameraView === "upper" ? "bg-accent text-white shadow-xs" : "text-zinc-400 hover:text-white"
            }`}
          >
            Thân trên
          </button>
          <button
            type="button"
            onClick={() => setPresetView("lower")}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              cameraView === "lower" ? "bg-accent text-white shadow-xs" : "text-zinc-400 hover:text-white"
            }`}
          >
            Thân dưới
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              isAutoRotating ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-400 hover:text-white"
            }`}
            title="Tự động xoay 360 độ"
          >
            <RotateCw size={11} className={isAutoRotating ? "animate-spin" : ""} />
            <span>360°</span>
          </button>
        </div>
      </div>

      {/* 2. WebGL 3D Canvas Container */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="relative w-full h-[400px] sm:h-[460px] cursor-grab active:cursor-grabbing select-none"
      >
        {/* Floating 3D Hover Badge */}
        {hoveredMuscle && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-2xl bg-zinc-950/90 backdrop-blur-xl px-4 py-2 text-center text-white border border-accent/40 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 z-20">
            <div className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1.5">
              <Activity size={12} />
              <span>{hoveredMuscle.nameVi}</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {hoveredMuscle.name} • Vùng: {hoveredMuscle.region}
            </div>
            {!readOnly && (
              <div className="text-[9px] text-accent-strong font-bold mt-1 uppercase">
                👉 Nhấp chuột để gán / cấu hình
              </div>
            )}
          </div>
        )}

        {/* Helper Hint */}
        <div className="absolute bottom-3 left-3 text-[10px] text-zinc-500 font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-800 pointer-events-none">
          Kéo chuột để xoay 3D • Nhấp vào cơ để chọn
        </div>
      </div>

      {/* 3. Heatmap Activation Colors Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80 w-full z-10">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
          <span className="font-bold text-white">Cơ phát lực chính (Primary)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="font-bold text-white">Cơ bổ trợ lực (Secondary)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-bold text-white">Cơ ổn định khớp (Stabilizers)</span>
        </div>
      </div>
    </div>
  );
});
