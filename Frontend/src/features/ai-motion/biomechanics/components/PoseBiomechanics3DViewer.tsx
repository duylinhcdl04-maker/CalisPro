import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Layers,
  Activity,
  Gauge,
  Flame,
  RotateCw,
  Compass,
  Maximize2,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type {
  Landmark3DPosition,
  VisualizationMode,
  BiomechanicsOverlayConfig,
} from '../types';
import {
  LANDMARK_3D_DEFAULT_COORDS,
  MUSCLE_GROUPS,
  JOINT_DEFINITIONS,
  getExerciseMuscles,
} from '../constants';
import { SKELETON_CONNECTIONS, MEDIAPIPE_LANDMARKS } from '../../constants/landmarks';
import { calculate3DAngle } from '../utils';
import { BiomechanicsLegend } from './BiomechanicsLegend';
import { BiomechanicsDetailHUD } from './BiomechanicsDetailHUD';

interface PoseBiomechanics3DViewerProps {
  landmarks3D: Landmark3DPosition[];
  selectedLandmarkIndex: number | null;
  onLandmarkSelect: (index: number) => void;
  selectedRegion?: string;
  exerciseCode?: string;
}

export const PoseBiomechanics3DViewer: React.FC<PoseBiomechanics3DViewerProps> = ({
  landmarks3D,
  selectedLandmarkIndex,
  onLandmarkSelect,
  selectedRegion = 'ALL',
  exerciseCode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Viewport Settings State
  const [mode, setMode] = useState<VisualizationMode>('COMBINED');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [overlayConfig, setOverlayConfig] = useState<BiomechanicsOverlayConfig>({
    showJointAngles: true,
    showAlignmentLine: true,
    showSymmetryLine: true,
    showReferenceRange: true,
    showFloorGrid: true,
  });

  // Hovered tooltip state
  const [hoveredLandmark, setHoveredLandmark] = useState<{
    landmark: Landmark3DPosition;
    screenX: number;
    screenY: number;
  } | null>(null);

  // References for Three.js internals
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const landmarkMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const muscleMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const humanSilhouetteRef = useRef<THREE.Group | null>(null);
  const skeletonGroupRef = useRef<THREE.Group | null>(null);
  const biomechanicsGroupRef = useRef<THREE.Group | null>(null);
  const heatmapGroupRef = useRef<THREE.Group | null>(null);
  const angleSpriteRef = useRef<THREE.Sprite | null>(null);
  const angleArcMeshRef = useRef<THREE.Line | null>(null);
  const selectedRingRef = useRef<THREE.Mesh | null>(null);

  const exerciseMuscles = useMemo(() => getExerciseMuscles(exerciseCode), [exerciseCode]);

  // Selected Landmark Object
  const currentSelectedLandmark = useMemo(
    () => landmarks3D.find((l) => l.index === selectedLandmarkIndex) || null,
    [landmarks3D, selectedLandmarkIndex]
  );

  // --- CAMERA PRESET HANDLERS ---
  const handleCameraPreset = useCallback(
    (preset: 'FRONT' | 'SIDE' | 'BACK' | 'TOP' | 'ISO' | 'RESET') => {
      if (!cameraRef.current || !controlsRef.current) return;
      const camera = cameraRef.current;
      const controls = controlsRef.current;

      const target = new THREE.Vector3(0, 1.0, 0);
      controls.target.copy(target);

      switch (preset) {
        case 'FRONT':
        case 'RESET':
          camera.position.set(0, 1.15, 3.2);
          break;
        case 'SIDE':
          camera.position.set(3.2, 1.15, 0);
          break;
        case 'BACK':
          camera.position.set(0, 1.15, -3.2);
          break;
        case 'TOP':
          camera.position.set(0, 3.8, 0.01);
          break;
        case 'ISO':
          camera.position.set(2.2, 1.8, 2.2);
          break;
      }
      camera.lookAt(target);
      controls.update();
    },
    []
  );

  // --- THREE.JS INITIALIZATION & RENDER LOOP ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#070d18'); // Deep Dark Navy Slate

    // Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.15, 3.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.replaceChildren(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 6.5;
    controls.minDistance = 0.8;
    controls.target.set(0, 1.0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 2.8);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.6);
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // Floor Grid Helper (Level 2)
    const gridHelper = new THREE.GridHelper(3.6, 24, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Floor Target Circle
    const floorCircleGeo = new THREE.RingGeometry(0.3, 1.4, 32);
    const floorCircleMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const floorCircle = new THREE.Mesh(floorCircleGeo, floorCircleMat);
    floorCircle.rotation.x = Math.PI / 2;
    floorCircle.position.y = 0.001;
    scene.add(floorCircle);

    // Groups
    const silhouetteGroup = new THREE.Group();
    const skeletonGroup = new THREE.Group();
    const biomechanicsGroup = new THREE.Group();
    const heatmapGroup = new THREE.Group();

    scene.add(silhouetteGroup);
    scene.add(skeletonGroup);
    scene.add(biomechanicsGroup);
    scene.add(heatmapGroup);

    humanSilhouetteRef.current = silhouetteGroup;
    skeletonGroupRef.current = skeletonGroup;
    biomechanicsGroupRef.current = biomechanicsGroup;
    heatmapGroupRef.current = heatmapGroup;

    // ==========================================
    // 1. DIGITAL HUMAN BODY SILHOUETTE (Cyber Mesh)
    // ==========================================
    const cyberMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.7,
      thickness: 0.4,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    // Cranium
    const headGeo = new THREE.SphereGeometry(0.12, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, cyberMaterial);
    headMesh.position.set(0, 1.82, 0.03);
    headMesh.scale.set(1.0, 1.25, 1.1);
    silhouetteGroup.add(headMesh);

    // Torso (Upper Chest)
    const chestGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.38, 20);
    const chestMesh = new THREE.Mesh(chestGeo, cyberMaterial);
    chestMesh.position.set(0, 1.4, 0.01);
    silhouetteGroup.add(chestMesh);

    // Abdomen & Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.32, 20);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, cyberMaterial);
    pelvisMesh.position.set(0, 1.05, 0.0);
    silhouetteGroup.add(pelvisMesh);

    // Limbs Helper Builder
    const createLimbMesh = (radiusTop: number, radiusBottom: number, height: number) => {
      const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
      return new THREE.Mesh(geo, cyberMaterial);
    };

    // Upper Arms
    const armL = createLimbMesh(0.065, 0.055, 0.32);
    armL.position.set(-0.33, 1.4, 0);
    armL.rotation.z = 0.25;
    silhouetteGroup.add(armL);

    const armR = createLimbMesh(0.065, 0.055, 0.32);
    armR.position.set(0.33, 1.4, 0);
    armR.rotation.z = -0.25;
    silhouetteGroup.add(armR);

    // Forearms
    const foreL = createLimbMesh(0.055, 0.045, 0.3);
    foreL.position.set(-0.41, 1.1, 0.01);
    foreL.rotation.z = 0.15;
    silhouetteGroup.add(foreL);

    const foreR = createLimbMesh(0.055, 0.045, 0.3);
    foreR.position.set(0.41, 1.1, 0.01);
    foreR.rotation.z = -0.15;
    silhouetteGroup.add(foreR);

    // Thighs
    const thighL = createLimbMesh(0.09, 0.065, 0.44);
    thighL.position.set(-0.17, 0.74, 0.01);
    silhouetteGroup.add(thighL);

    const thighR = createLimbMesh(0.09, 0.065, 0.44);
    thighR.position.set(0.17, 0.74, 0.01);
    silhouetteGroup.add(thighR);

    // Shins
    const shinL = createLimbMesh(0.065, 0.045, 0.42);
    shinL.position.set(-0.18, 0.3, 0.0);
    silhouetteGroup.add(shinL);

    const shinR = createLimbMesh(0.065, 0.045, 0.42);
    shinR.position.set(0.18, 0.3, 0.0);
    silhouetteGroup.add(shinR);

    // ==========================================
    // 2. LEVEL 2: BIOMECHANICS PLUMB LINE & AXES
    // ==========================================
    // Plumb line (Center of gravity / balance vertical axis)
    const plumbLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 2.05, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const plumbLineMat = new THREE.LineDashedMaterial({
      color: 0x00f0ff,
      dashSize: 0.06,
      gapSize: 0.04,
      linewidth: 2,
    });
    const plumbLine = new THREE.Line(plumbLineGeo, plumbLineMat);
    plumbLine.computeLineDistances();
    biomechanicsGroup.add(plumbLine);

    // Coronal Symmetry Grid Plane
    const symmetryPlaneGeo = new THREE.PlaneGeometry(0.8, 1.9);
    const symmetryPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const symmetryPlane = new THREE.Mesh(symmetryPlaneGeo, symmetryPlaneMat);
    symmetryPlane.position.set(0, 0.95, 0);
    biomechanicsGroup.add(symmetryPlane);

    // Selected Landmark Halo Ring
    const haloGeo = new THREE.RingGeometry(0.04, 0.055, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.visible = false;
    scene.add(haloMesh);
    selectedRingRef.current = haloMesh;

    // ==========================================
    // 3. LEVEL 3: 3D MUSCLE HEATMAP MESHES
    // ==========================================
    MUSCLE_GROUPS.forEach((mg) => {
      let geo: THREE.BufferGeometry;
      if (mg.shapeType === 'ELLIPSOID') {
        geo = new THREE.SphereGeometry(mg.dimensions[0] / 2, 16, 16);
      } else if (mg.shapeType === 'CYLINDER') {
        geo = new THREE.CylinderGeometry(mg.dimensions[0] / 2, mg.dimensions[0] / 2, mg.dimensions[1], 16);
      } else {
        geo = new THREE.BoxGeometry(mg.dimensions[0], mg.dimensions[1], mg.dimensions[2]);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        emissive: 0x000000,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.35,
        roughness: 0.4,
        metalness: 0.2,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...mg.baseCenter);
      mesh.userData = { muscleId: mg.id, nameVi: mg.nameVi };
      heatmapGroup.add(mesh);
      muscleMeshesRef.current.set(mg.id, mesh);
    });

    // ==========================================
    // 4. ANIMATION RENDER LOOP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Controls update
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.2;
      controls.update();

      // Pulsate selected halo ring
      if (selectedRingRef.current && selectedRingRef.current.visible) {
        const pulse = 1.0 + Math.sin(elapsedTime * 4) * 0.15;
        selectedRingRef.current.scale.set(pulse, pulse, pulse);
        selectedRingRef.current.lookAt(camera.position);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ==========================================
    // 5. RESIZE LISTENER
    // ==========================================
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // ==========================================
    // 6. RAYCASTER CLICK & HOVER INTERACTION
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check landmarks first
      const landmarkMeshes = Array.from(landmarkMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(landmarkMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && typeof hit.userData.landmarkIndex === 'number') {
          onLandmarkSelect(hit.userData.landmarkIndex);
        }
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const landmarkMeshes = Array.from(landmarkMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(landmarkMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && typeof hit.userData.landmarkIndex === 'number') {
          const lm = landmarks3D.find((l) => l.index === hit.userData.landmarkIndex);
          if (lm) {
            setHoveredLandmark({
              landmark: lm,
              screenX: event.clientX - rect.left,
              screenY: event.clientY - rect.top,
            });
            renderer.domElement.style.cursor = 'pointer';
            return;
          }
        }
      }
      setHoveredLandmark(null);
      renderer.domElement.style.cursor = 'default';
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.dispose();
    };
  }, []);

  // --- UPDATE SKELETON NODES & BONES ---
  useEffect(() => {
    const skeletonGroup = skeletonGroupRef.current;
    if (!skeletonGroup || !sceneRef.current) return;

    // Clear old skeleton elements
    while (skeletonGroup.children.length > 0) {
      const child = skeletonGroup.children[0];
      skeletonGroup.remove(child);
    }
    landmarkMeshesRef.current.clear();

    const lmMap = new Map<number, Landmark3DPosition>();
    landmarks3D.forEach((l) => lmMap.set(l.index, l));

    // Create 33 Landmark Node Spheres
    landmarks3D.forEach((lm) => {
      const isSelected = selectedLandmarkIndex === lm.index;
      const isReq = lm.visibilityRequirement === 'REQUIRED';
      const isOpt = lm.visibilityRequirement === 'OPTIONAL';
      const isFiltered = selectedRegion === 'ALL' || lm.region === selectedRegion;

      const sphereGeo = new THREE.SphereGeometry(isSelected ? 0.032 : 0.022, 20, 20);

      let color = 0x475569;
      let emissive = 0x000000;
      let emissiveIntensity = 0.2;

      if (isReq) {
        color = 0x10b981; // Emerald Green
        emissive = 0x059669;
        emissiveIntensity = 0.6;
      } else if (isOpt) {
        color = 0x6366f1; // Indigo / Purple
        emissive = 0x4f46e5;
        emissiveIntensity = 0.4;
      }

      if (isSelected) {
        color = 0xf59e0b; // Amber Gold
        emissive = 0xd97706;
        emissiveIntensity = 1.0;
      }

      const sphereMat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity,
        roughness: 0.2,
        metalness: 0.3,
        transparent: true,
        opacity: isFiltered ? 1.0 : 0.3,
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(lm.x, lm.y, lm.z);
      sphereMesh.userData = { landmarkIndex: lm.index, nameVi: lm.nameVi };

      skeletonGroup.add(sphereMesh);
      landmarkMeshesRef.current.set(lm.index, sphereMesh);
    });

    // Create Connecting Cylinder Bones
    SKELETON_CONNECTIONS.forEach(([idxA, idxB]) => {
      const lmA = lmMap.get(idxA);
      const lmB = lmMap.get(idxB);
      if (!lmA || !lmB) return;

      const posA = new THREE.Vector3(lmA.x, lmA.y, lmA.z);
      const posB = new THREE.Vector3(lmB.x, lmB.y, lmB.z);
      const distance = posA.distanceTo(posB);
      const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);

      const isBothRequired =
        lmA.visibilityRequirement === 'REQUIRED' && lmB.visibilityRequirement === 'REQUIRED';
      const isAnyDisabled =
        lmA.visibilityRequirement === 'DISABLED' || lmB.visibilityRequirement === 'DISABLED';

      const boneRadius = isBothRequired ? 0.009 : 0.006;
      const boneGeo = new THREE.CylinderGeometry(boneRadius, boneRadius, distance, 12);

      const boneMat = new THREE.MeshStandardMaterial({
        color: isAnyDisabled ? 0x334155 : isBothRequired ? 0x00f0ff : 0x818cf8,
        emissive: isBothRequired ? 0x0284c7 : 0x4338ca,
        emissiveIntensity: isBothRequired ? 0.6 : 0.3,
        transparent: true,
        opacity: isAnyDisabled ? 0.25 : 0.85,
      });

      const boneMesh = new THREE.Mesh(boneGeo, boneMat);
      boneMesh.position.copy(midpoint);

      // Rotate bone to point from posA to posB
      const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
      boneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

      skeletonGroup.add(boneMesh);
    });

    // Position the Selected Halo Ring
    if (selectedRingRef.current && currentSelectedLandmark) {
      selectedRingRef.current.position.set(
        currentSelectedLandmark.x,
        currentSelectedLandmark.y,
        currentSelectedLandmark.z
      );
      selectedRingRef.current.visible = true;
    } else if (selectedRingRef.current) {
      selectedRingRef.current.visible = false;
    }
  }, [landmarks3D, selectedLandmarkIndex, selectedRegion, currentSelectedLandmark]);

  // --- UPDATE LEVEL 2 BIOMECHANICS OVERLAYS (ANGLE ARCS) ---
  useEffect(() => {
    const biomechanicsGroup = biomechanicsGroupRef.current;
    if (!biomechanicsGroup) return;

    // Remove previous dynamic angle arc
    if (angleArcMeshRef.current) {
      biomechanicsGroup.remove(angleArcMeshRef.current);
      angleArcMeshRef.current = null;
    }

    if (!overlayConfig.showJointAngles || !selectedLandmarkIndex) return;

    // Find associated joint
    const joint = JOINT_DEFINITIONS.find(
      (j) =>
        j.landmarkVertex === selectedLandmarkIndex ||
        j.landmarkA === selectedLandmarkIndex ||
        j.landmarkC === selectedLandmarkIndex
    );

    if (!joint) return;

    const lmMap = new Map<number, Landmark3DPosition>();
    landmarks3D.forEach((l) => lmMap.set(l.index, l));

    const lmA = lmMap.get(joint.landmarkA);
    const lmV = lmMap.get(joint.landmarkVertex);
    const lmC = lmMap.get(joint.landmarkC);

    if (!lmA || !lmV || !lmC) return;

    const posA = new THREE.Vector3(lmA.x, lmA.y, lmA.z);
    const posV = new THREE.Vector3(lmV.x, lmV.y, lmV.z);
    const posC = new THREE.Vector3(lmC.x, lmC.y, lmC.z);

    const vecA = new THREE.Vector3().subVectors(posA, posV).normalize();
    const vecC = new THREE.Vector3().subVectors(posC, posV).normalize();

    // Create curve points along the angle arc
    const arcPoints: THREE.Vector3[] = [];
    const arcRadius = 0.12;
    const segments = 24;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const interpolatedDir = new THREE.Vector3().lerpVectors(vecA, vecC, t).normalize();
      const pt = new THREE.Vector3().copy(posV).addScaledVector(interpolatedDir, arcRadius);
      arcPoints.push(pt);
    }

    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    biomechanicsGroup.add(arcLine);
    angleArcMeshRef.current = arcLine;
  }, [selectedLandmarkIndex, landmarks3D, overlayConfig.showJointAngles]);

  // --- UPDATE LEVEL 3 MUSCLE HEATMAP SHADERS & OPACITY ---
  useEffect(() => {
    muscleMeshesRef.current.forEach((mesh, muscleId) => {
      const match = exerciseMuscles.find((em) => em.muscleId === muscleId);
      const role = match?.role || 'NONE';

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      if (mode === 'SKELETON') {
        mat.opacity = 0.05;
        mat.color.setHex(0x1e293b);
        mat.emissive.setHex(0x000000);
        return;
      }

      if (role === 'PRIMARY') {
        mat.color.setHex(0xf43f5e); // Rose / Crimson Fire
        mat.emissive.setHex(0xe11d48);
        mat.emissiveIntensity = mode === 'HEATMAP' ? 1.4 : 0.8;
        mat.opacity = mode === 'HEATMAP' ? 0.75 : 0.55;
      } else if (role === 'SECONDARY') {
        mat.color.setHex(0xfbbf24); // Amber / Yellow
        mat.emissive.setHex(0xd97706);
        mat.emissiveIntensity = mode === 'HEATMAP' ? 0.9 : 0.5;
        mat.opacity = mode === 'HEATMAP' ? 0.65 : 0.45;
      } else if (role === 'STABILIZER') {
        mat.color.setHex(0x22d3ee); // Cyan / Blue
        mat.emissive.setHex(0x0891b2);
        mat.emissiveIntensity = mode === 'HEATMAP' ? 0.8 : 0.45;
        mat.opacity = mode === 'HEATMAP' ? 0.6 : 0.4;
      } else {
        mat.color.setHex(0x1e293b);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.1;
        mat.opacity = mode === 'HEATMAP' ? 0.2 : 0.15;
      }
    });
  }, [mode, exerciseMuscles]);

  // --- UPDATE LAYER VISIBILITY BASED ON CURRENT MODE ---
  useEffect(() => {
    if (humanSilhouetteRef.current) {
      humanSilhouetteRef.current.visible = mode === 'COMBINED' || mode === 'BIOMECHANICS';
    }
    if (skeletonGroupRef.current) {
      skeletonGroupRef.current.visible = true; // Always visible
    }
    if (biomechanicsGroupRef.current) {
      biomechanicsGroupRef.current.visible = mode === 'COMBINED' || mode === 'BIOMECHANICS';
    }
    if (heatmapGroupRef.current) {
      heatmapGroupRef.current.visible = mode === 'COMBINED' || mode === 'HEATMAP';
    }
  }, [mode]);

  return (
    <div className="relative w-full rounded-3xl border border-border/80 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col">
      {/* TOP HEADER CONTROLS: MODES & PRESETS */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Visual Mode Selector Tabs */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-neutral-950/80 p-1 backdrop-blur-md border border-white/10 shadow-xl">
          {[
            { id: 'COMBINED', label: 'Xem Tổng Hợp', icon: Layers, desc: 'Digital Human + Skeleton + Biomechanics + Heatmap' },
            { id: 'SKELETON', label: 'Khung Xương', icon: Activity, desc: '33 Khớp Xương MediaPipe' },
            { id: 'BIOMECHANICS', label: 'Cơ Sinh Học', icon: Gauge, desc: 'Góc gập/duỗi & Trục thăng bằng' },
            { id: 'HEATMAP', label: 'Nhiệt Cơ', icon: Flame, desc: 'Bản đồ phát lực các nhóm cơ' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as VisualizationMode)}
                title={tab.desc}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-neutral-950 shadow-[0_0_12px_rgba(6,182,212,0.6)] font-extrabold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Camera Preset Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-neutral-950/80 p-1 backdrop-blur-md border border-white/10 shadow-xl">
          <button
            onClick={() => handleCameraPreset('FRONT')}
            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Góc nhìn chính diện"
          >
            Trước
          </button>
          <button
            onClick={() => handleCameraPreset('SIDE')}
            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Góc nhìn bên sườn"
          >
            Nghiêng
          </button>
          <button
            onClick={() => handleCameraPreset('BACK')}
            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Góc nhìn phía sau"
          >
            Sau
          </button>
          <button
            onClick={() => handleCameraPreset('TOP')}
            className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Góc nhìn từ đỉnh đầu"
          >
            Đỉnh
          </button>
          <div className="h-4 w-px bg-white/20 mx-0.5" />
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`rounded-xl p-1.5 text-xs transition-colors ${
              autoRotate ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={autoRotate ? 'Dừng tự động xoay' : 'Bật tự động xoay 360°'}
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleCameraPreset('RESET')}
            className="rounded-xl p-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Đặt lại camera về ban đầu"
          >
            <Compass size={13} />
          </button>
        </div>
      </div>

      {/* 3D WEBGL CANVAS VIEWPORT */}
      <div
        ref={mountRef}
        className="w-full h-[460px] sm:h-[500px] cursor-grab active:cursor-grabbing relative"
      />

      {/* FLOATING HOVER TOOLTIP */}
      {hoveredLandmark && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl bg-neutral-900/90 border border-cyan-500/40 px-3 py-1.5 text-xs text-white shadow-2xl backdrop-blur-md transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: hoveredLandmark.screenX, top: hoveredLandmark.screenY }}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-cyan-400">
              #{hoveredLandmark.landmark.index.toString().padStart(2, '0')}
            </span>
            <span className="font-bold">{hoveredLandmark.landmark.nameVi}</span>
          </div>
          <div className="text-[10px] text-white/60 font-mono">
            X: {hoveredLandmark.landmark.x.toFixed(2)} | Y: {hoveredLandmark.landmark.y.toFixed(2)} | Z: {hoveredLandmark.landmark.z.toFixed(2)}
          </div>
        </div>
      )}

      {/* BOTTOM FLOATING BAR: TELEMETRY & LEGEND */}
      <div className="p-3 bg-neutral-950/90 border-t border-white/10 backdrop-blur-md space-y-2.5">
        <BiomechanicsDetailHUD
          selectedLandmark={currentSelectedLandmark}
          allLandmarks={landmarks3D}
          exerciseCode={exerciseCode}
          mode={mode}
        />
        <BiomechanicsLegend mode={mode} />
      </div>
    </div>
  );
};
