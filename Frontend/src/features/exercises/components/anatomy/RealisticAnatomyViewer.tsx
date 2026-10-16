import { useState, memo, useMemo } from "react";
import {
  CalisHealthMuscle,
  MuscleTarget,
  MuscleRole,
} from "../../types/exercise";
import { CALISHEALTH_MUSCLE_CATALOG } from "./bodyMusclesAdapter";
import {
  Activity,
  Sparkles,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface RealisticAnatomyViewerProps {
  targets: MuscleTarget[];
  onSelectMuscle: (muscle: CalisHealthMuscle) => void;
  readOnly?: boolean;
}

export const RealisticAnatomyViewer = memo(function RealisticAnatomyViewer({
  targets,
  onSelectMuscle,
  readOnly = false,
}: RealisticAnatomyViewerProps) {
  const [viewSide, setViewSide] = useState<"front" | "back">("front");
  const [hoveredMuscleId, setHoveredMuscleId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [regionFilter, setRegionFilter] = useState<"ALL" | "UPPER" | "CORE" | "LOWER">("ALL");

  const targetMap = useMemo(() => {
    const map = new Map<string, MuscleTarget>();
    targets.forEach((t) => map.set(t.muscleId, t));
    return map;
  }, [targets]);

  const hoveredMuscle = useMemo(() => {
    if (!hoveredMuscleId) return null;
    return CALISHEALTH_MUSCLE_CATALOG.find((m) => m.id === hoveredMuscleId) || null;
  }, [hoveredMuscleId]);

  function getMuscleColorStyle(muscleId: string) {
    const target = targetMap.get(muscleId);
    const isHovered = hoveredMuscleId === muscleId;

    if (isHovered && !target) {
      return {
        fill: "url(#hoverGrad)",
        stroke: "#38bdf8",
        strokeWidth: 2,
        filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))",
      };
    }

    if (target) {
      if (target.role === "PRIMARY") {
        return {
          fill: "url(#primaryGrad)",
          stroke: "#f43f5e",
          strokeWidth: isHovered ? 2.5 : 1.8,
          filter: "drop-shadow(0 0 8px rgba(225, 29, 72, 0.9))",
        };
      }
      if (target.role === "SECONDARY") {
        return {
          fill: "url(#secondaryGrad)",
          stroke: "#fbbf24",
          strokeWidth: isHovered ? 2.5 : 1.8,
          filter: "drop-shadow(0 0 7px rgba(245, 158, 11, 0.85))",
        };
      }
      return {
        fill: "url(#stabilizerGrad)",
        stroke: "#34d399",
        strokeWidth: isHovered ? 2.5 : 1.8,
        filter: "drop-shadow(0 0 7px rgba(16, 185, 129, 0.85))",
      };
    }

    return {
      fill: "url(#muscleBaseGrad)",
      stroke: "#8c3b36",
      strokeWidth: 0.8,
      filter: "none",
    };
  }

  const handleMuscleClick = (muscleId: string) => {
    if (readOnly) return;
    const muscle = CALISHEALTH_MUSCLE_CATALOG.find((m) => m.id === muscleId);
    if (muscle) {
      onSelectMuscle(muscle);
    }
  };

  return (
    <div className="relative flex flex-col items-center rounded-3xl border border-border bg-gradient-to-b from-slate-900/95 via-slate-950 to-black p-4 sm:p-5 text-white shadow-2xl overflow-hidden w-full select-none">
      {/* 1. Header Navigation & View Controls */}
      <div className="flex flex-wrap items-center justify-between w-full border-b border-slate-800/80 pb-3 gap-2 z-20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Activity size={16} />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Hệ Cơ Giải Phẫu Học (Human Muscular Anatomy)</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Mô hình sợi cơ y học chân thực 100% • Tương tác trực tiếp
            </div>
          </div>
        </div>

        {/* View Switcher (Mặt trước / Mặt sau) & Tools */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl border border-slate-800 bg-slate-900/90 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewSide("front")}
              className={`rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                viewSide === "front"
                  ? "bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mặt Trước (Anterior)
            </button>
            <button
              type="button"
              onClick={() => setViewSide("back")}
              className={`rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                viewSide === "back"
                  ? "bg-rose-600 text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mặt Sau (Posterior)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showLabels
                ? "border-sky-500/40 bg-sky-500/15 text-sky-400 shadow-xs"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            }`}
            title="Bật/Tắt nhãn giải phẫu y khoa"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">Nhãn y khoa</span>
          </button>
        </div>
      </div>

      {/* 2. Region Quick Filter Bar */}
      <div className="flex items-center justify-center gap-1.5 pt-2 pb-1 text-[11px] font-bold z-10 w-full overflow-x-auto no-scrollbar">
        <span className="text-slate-500 text-[10px] uppercase font-mono mr-1">Phân vùng:</span>
        <button
          type="button"
          onClick={() => setRegionFilter("ALL")}
          className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
            regionFilter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          Toàn thân
        </button>
        <button
          type="button"
          onClick={() => setRegionFilter("UPPER")}
          className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
            regionFilter === "UPPER" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          Thân trên
        </button>
        <button
          type="button"
          onClick={() => setRegionFilter("CORE")}
          className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
            regionFilter === "CORE" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          Cơ lõi / Bụng
        </button>
        <button
          type="button"
          onClick={() => setRegionFilter("LOWER")}
          className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
            regionFilter === "LOWER" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          Thân dưới / Chân
        </button>
      </div>

      {/* 3. SVG High-Fidelity Anatomical Canvas Viewport */}
      <div className="relative flex justify-center items-center w-full min-h-[500px] max-h-[620px] overflow-hidden py-3">
        <svg
          viewBox="0 0 700 820"
          className="w-full h-full max-h-[580px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-transform duration-300"
          style={{
            transform: `scale(${zoomLevel})`,
          }}
        >
          <defs>
            {/* Realistic Muscle Fiber & Tendon Shading Gradients */}
            <radialGradient id="muscleBaseGrad" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#d9625b" />
              <stop offset="55%" stopColor="#b33f38" />
              <stop offset="90%" stopColor="#802621" />
              <stop offset="100%" stopColor="#591916" />
            </radialGradient>

            <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="60%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>

            <linearGradient id="secondaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="stabilizerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <linearGradient id="hoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="tendonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="skinBoneBase" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0b49f" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c7927e" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid Studio Background Lines */}
          <g opacity="0.1">
            <line x1="0" y1="780" x2="700" y2="780" stroke="#38bdf8" strokeWidth="1" />
            <line x1="100" y1="780" x2="350" y2="740" stroke="#38bdf8" strokeWidth="0.5" />
            <line x1="600" y1="780" x2="350" y2="740" stroke="#38bdf8" strokeWidth="0.5" />
            <ellipse cx="350" cy="780" rx="220" ry="18" fill="none" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* ========================================================================= */}
          {/* MẶT TRƯỚC (ANTERIOR VIEW)                                                 */}
          {/* ========================================================================= */}
          {viewSide === "front" && (
            <g id="anterior-anatomy">
              {/* Head & Neck Base Structure */}
              <g id="head-neck-front">
                <ellipse cx="350" cy="75" rx="36" ry="46" fill="url(#skinBoneBase)" stroke="#8c3b36" strokeWidth="1" />
                {/* Facial muscle contours */}
                <path d="M335 65 Q350 75 365 65 Q350 95 335 65 Z" fill="#b33f38" opacity="0.6" />
                <path d="M338 92 Q350 102 362 92 Z" fill="#802621" opacity="0.7" />

                {/* Sternocleidomastoid (Cơ ức đòn chũm) */}
                <path
                  d="M334 98 L343 142 L347 142 L339 96 Z"
                  fill="#c04942"
                  stroke="#591916"
                  strokeWidth="0.6"
                />
                <path
                  d="M366 98 L357 142 L353 142 L361 96 Z"
                  fill="#c04942"
                  stroke="#591916"
                  strokeWidth="0.6"
                />
              </g>

              {/* 1. Trapezius (Cầu vai trước) */}
              <g
                id="muscle_trapezius"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_trapezius")}
                onMouseEnter={() => setHoveredMuscleId("muscle_trapezius")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Trap */}
                <path
                  d="M334 100 Q315 118 292 138 L308 142 Q328 132 342 138 Z"
                  style={getMuscleColorStyle("muscle_trapezius")}
                />
                {/* Right Trap */}
                <path
                  d="M366 100 Q385 118 408 138 L392 142 Q372 132 358 138 Z"
                  style={getMuscleColorStyle("muscle_trapezius")}
                />
              </g>

              {/* Clavicle / Collarbone Tendons */}
              <path
                d="M344 142 Q320 138 288 145 L288 148 Q320 142 344 145 Z"
                fill="url(#tendonGrad)"
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />
              <path
                d="M356 142 Q380 138 412 145 L412 148 Q380 142 356 145 Z"
                fill="url(#tendonGrad)"
                stroke="#cbd5e1"
                strokeWidth="0.5"
              />

              {/* 2. Anterior & Lateral Deltoid (Cơ vai trước & vai giữa) */}
              <g
                id="muscle_deltoid_anterior"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_deltoid_anterior")}
                onMouseEnter={() => setHoveredMuscleId("muscle_deltoid_anterior")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Deltoid */}
                <path
                  d="M288 144 Q262 165 258 200 Q272 208 282 188 Q290 168 290 146 Z"
                  style={getMuscleColorStyle("muscle_deltoid_anterior")}
                />
                {/* Right Deltoid */}
                <path
                  d="M412 144 Q438 165 442 200 Q428 208 418 188 Q410 168 410 146 Z"
                  style={getMuscleColorStyle("muscle_deltoid_anterior")}
                />
              </g>

              {/* 3. Pectoralis Major (Cơ ngực lớn) */}
              <g
                id="muscle_pectoralis_major"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_pectoralis_major")}
                onMouseEnter={() => setHoveredMuscleId("muscle_pectoralis_major")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Pec Major */}
                <path
                  d="M346 146 Q318 144 288 152 Q282 188 300 215 Q325 220 346 205 Q348 175 346 146 Z"
                  style={getMuscleColorStyle("muscle_pectoralis_major")}
                />
                {/* Right Pec Major */}
                <path
                  d="M354 146 Q382 144 412 152 Q418 188 400 215 Q375 220 354 205 Q352 175 354 146 Z"
                  style={getMuscleColorStyle("muscle_pectoralis_major")}
                />
                {/* Sternum Center Division Tendon */}
                <line x1="350" y1="145" x2="350" y2="218" stroke="#f1f5f9" strokeWidth="2.5" opacity="0.8" />
              </g>

              {/* 4. Biceps Brachii (Cơ nhị đầu tay trước) */}
              <g
                id="muscle_biceps_brachii"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_biceps_brachii")}
                onMouseEnter={() => setHoveredMuscleId("muscle_biceps_brachii")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Bicep */}
                <path
                  d="M260 200 Q248 238 252 278 Q268 280 274 245 Q278 212 270 200 Z"
                  style={getMuscleColorStyle("muscle_biceps_brachii")}
                />
                {/* Right Bicep */}
                <path
                  d="M440 200 Q452 238 448 278 Q432 280 426 245 Q422 212 430 200 Z"
                  style={getMuscleColorStyle("muscle_biceps_brachii")}
                />
              </g>

              {/* 5. Forearms / Brachioradialis (Cơ cẳng tay trước) */}
              <g
                id="muscle_forearms"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_forearms")}
                onMouseEnter={() => setHoveredMuscleId("muscle_forearms")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Forearm */}
                <path
                  d="M252 280 Q236 318 232 375 Q244 380 252 370 Q266 325 264 280 Z"
                  style={getMuscleColorStyle("muscle_forearms")}
                />
                {/* Right Forearm */}
                <path
                  d="M448 280 Q464 318 468 375 Q456 380 448 370 Q434 325 436 280 Z"
                  style={getMuscleColorStyle("muscle_forearms")}
                />
                {/* Left Hand Base */}
                <path d="M232 376 Q224 405 228 425 Q238 428 244 400 L248 375 Z" fill="#c7927e" />
                {/* Right Hand Base */}
                <path d="M468 376 Q476 405 472 425 Q462 428 456 400 L452 375 Z" fill="#c7927e" />
              </g>

              {/* 6. Rectus Abdominis (Cơ thẳng bụng 6 múi) */}
              <g
                id="muscle_rectus_abdominis"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_rectus_abdominis")}
                onMouseEnter={() => setHoveredMuscleId("muscle_rectus_abdominis")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Upper 2 Abs */}
                <path d="M330 220 Q348 220 348 244 Q330 244 330 220 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} />
                <path d="M352 220 Q370 220 370 244 Q352 244 352 220 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} />

                {/* Middle 2 Abs */}
                <path d="M330 248 Q348 248 348 274 Q330 274 330 248 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} />
                <path d="M352 248 Q370 248 370 274 Q352 274 352 248 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} />

                {/* Lower 2 Abs */}
                <path d="M330 278 Q348 278 348 308 Q332 308 330 278 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} />
                <path d="M352 278 Q370 278 370 308 Q368 308 352 278 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} />

                {/* Linea Alba & Tendinous Intersections */}
                <line x1="350" y1="215" x2="350" y2="340" stroke="#f1f5f9" strokeWidth="2" opacity="0.85" />
                <line x1="326" y1="246" x2="374" y2="246" stroke="#f1f5f9" strokeWidth="1.8" opacity="0.8" />
                <line x1="326" y1="276" x2="374" y2="276" stroke="#f1f5f9" strokeWidth="1.8" opacity="0.8" />
                <line x1="328" y1="308" x2="372" y2="308" stroke="#f1f5f9" strokeWidth="1.8" opacity="0.8" />

                {/* Pyramidalis / Deep Lower Abdominal Wall */}
                <path d="M332 312 L350 348 L368 312 Z" style={getMuscleColorStyle("muscle_rectus_abdominis")} opacity="0.9" />
              </g>

              {/* 7. Obliques (Cơ liên sườn bụng & Serratus Anterior) */}
              <g
                id="muscle_obliques"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_obliques")}
                onMouseEnter={() => setHoveredMuscleId("muscle_obliques")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Obliques + Serratus */}
                <path
                  d="M298 220 Q285 240 286 280 Q292 335 324 350 Q326 315 326 220 Z"
                  style={getMuscleColorStyle("muscle_obliques")}
                />
                {/* Right Obliques + Serratus */}
                <path
                  d="M402 220 Q415 240 414 280 Q408 335 376 350 Q374 315 374 220 Z"
                  style={getMuscleColorStyle("muscle_obliques")}
                />
              </g>

              {/* Pelvis / Inguinal Ligament */}
              <path d="M324 352 Q350 380 376 352 L350 395 Z" fill="#e2e8f0" opacity="0.75" />

              {/* 8. Quadriceps Femoris (Cơ đùi trước - Rectus Femoris, Vastus Lateralis, Vastus Medialis) */}
              <g
                id="muscle_quadriceps"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_quadriceps")}
                onMouseEnter={() => setHoveredMuscleId("muscle_quadriceps")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Quad - Vastus Lateralis (ngoài) */}
                <path
                  d="M320 365 Q278 410 286 495 Q302 540 316 545 Q310 460 324 365 Z"
                  style={getMuscleColorStyle("muscle_quadriceps")}
                />
                {/* Left Quad - Rectus Femoris (giữa) */}
                <path
                  d="M325 370 Q312 435 318 520 Q334 525 338 480 Q342 410 332 370 Z"
                  style={getMuscleColorStyle("muscle_quadriceps")}
                />
                {/* Left Quad - Vastus Medialis Cơ giọt nước (trong) */}
                <path
                  d="M336 445 Q348 480 344 532 Q328 542 322 525 Q328 475 336 445 Z"
                  style={getMuscleColorStyle("muscle_quadriceps")}
                />

                {/* Right Quad - Vastus Lateralis (ngoài) */}
                <path
                  d="M380 365 Q422 410 414 495 Q398 540 384 545 Q390 460 376 365 Z"
                  style={getMuscleColorStyle("muscle_quadriceps")}
                />
                {/* Right Quad - Rectus Femoris (giữa) */}
                <path
                  d="M375 370 Q388 435 382 520 Q366 525 362 480 Q358 410 368 370 Z"
                  style={getMuscleColorStyle("muscle_quadriceps")}
                />
                {/* Right Quad - Vastus Medialis Cơ giọt nước (trong) */}
                <path
                  d="M364 445 Q352 480 356 532 Q372 542 378 525 Q372 475 364 445 Z"
                  style={getMuscleColorStyle("muscle_quadriceps")}
                />
              </g>

              {/* Patella / Knee Joint Tendon Caps */}
              <ellipse cx="324" cy="552" rx="10" ry="12" fill="url(#tendonGrad)" stroke="#cbd5e1" strokeWidth="0.8" />
              <ellipse cx="376" cy="552" rx="10" ry="12" fill="url(#tendonGrad)" stroke="#cbd5e1" strokeWidth="0.8" />

              {/* 9. Tibialis Anterior & Calves Front (Cơ cẳng chân trước & cơ chày trước) */}
              <g
                id="muscle_calves"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_calves")}
                onMouseEnter={() => setHoveredMuscleId("muscle_calves")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Tibialis & Calf Lateral */}
                <path
                  d="M315 565 Q292 610 300 680 Q312 730 320 748 Q324 710 326 650 Q326 595 315 565 Z"
                  style={getMuscleColorStyle("muscle_calves")}
                />
                {/* Left Tibia Shin Bone Center Ridge */}
                <path d="M326 568 L328 748" stroke="#f1f5f9" strokeWidth="2.5" opacity="0.8" />

                {/* Right Tibialis & Calf Lateral */}
                <path
                  d="M385 565 Q408 610 400 680 Q388 730 380 748 Q376 710 374 650 Q374 595 385 565 Z"
                  style={getMuscleColorStyle("muscle_calves")}
                />
                {/* Right Tibia Shin Bone Center Ridge */}
                <path d="M374 568 L372 748" stroke="#f1f5f9" strokeWidth="2.5" opacity="0.8" />

                {/* Left Foot */}
                <path d="M318 750 Q310 775 295 780 Q325 785 332 770 L328 750 Z" fill="#c7927e" />
                {/* Right Foot */}
                <path d="M382 750 Q390 775 405 780 Q375 785 368 770 L372 750 Z" fill="#c7927e" />
              </g>

              {/* Medical Pointer Callouts & Labels for Front View */}
              {showLabels && (
                <g id="front-medical-labels" className="pointer-events-none transition-opacity duration-300">
                  {/* Trapezius */}
                  <line x1="210" y1="115" x2="310" y2="120" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="310" cy="120" r="3" fill="#38bdf8" />
                  <text x="205" y="118" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Trapezius (Cầu vai)</text>

                  {/* Biceps Brachii */}
                  <line x1="180" y1="240" x2="258" y2="240" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="258" cy="240" r="3" fill="#38bdf8" />
                  <text x="175" y="243" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Biceps Brachii (Tay trước)</text>

                  {/* Forearm Flexors */}
                  <line x1="160" y1="330" x2="246" y2="330" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="246" cy="330" r="3" fill="#38bdf8" />
                  <text x="155" y="333" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Forearm Flexors (Cẳng tay)</text>

                  {/* Quadriceps Femoris */}
                  <line x1="180" y1="460" x2="305" y2="460" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="305" cy="460" r="3" fill="#38bdf8" />
                  <text x="175" y="463" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Quadriceps Femoris (Đùi trước)</text>

                  {/* Tibialis Anterior */}
                  <line x1="180" y1="640" x2="310" y2="640" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="310" cy="640" r="3" fill="#38bdf8" />
                  <text x="175" y="643" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Tibialis Anterior (Cẳng chân)</text>

                  {/* Right side labels */}
                  {/* Sternocleidomastoid */}
                  <line x1="490" y1="105" x2="362" y2="105" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="362" cy="105" r="3" fill="#38bdf8" />
                  <text x="495" y="108" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Sternocleidomastoid (Cơ cổ)</text>

                  {/* Pectoralis Major */}
                  <line x1="490" y1="175" x2="385" y2="175" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="385" cy="175" r="3" fill="#38bdf8" />
                  <text x="495" y="178" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Pectoralis Major (Ngực lớn)</text>

                  {/* Rectus Abdominis */}
                  <line x1="490" y1="260" x2="365" y2="260" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="365" cy="260" r="3" fill="#38bdf8" />
                  <text x="495" y="263" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Cơ bụng thẳng 6 múi (Abs)</text>

                  {/* Obliques */}
                  <line x1="490" y1="335" x2="395" y2="335" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="395" cy="335" r="3" fill="#38bdf8" />
                  <text x="495" y="338" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Obliques (Cơ liên sườn)</text>
                </g>
              )}
            </g>
          )}

          {/* ========================================================================= */}
          {/* MẶT SAU (POSTERIOR VIEW)                                                  */}
          {/* ========================================================================= */}
          {viewSide === "back" && (
            <g id="posterior-anatomy">
              {/* Head & Back Neck */}
              <g id="head-neck-back">
                <ellipse cx="350" cy="75" rx="36" ry="46" fill="url(#skinBoneBase)" stroke="#8c3b36" strokeWidth="1" />
                {/* Occipital base */}
                <path d="M330 90 Q350 110 370 90 Z" fill="#802621" opacity="0.8" />
              </g>

              {/* 1. Trapezius Posterior (Cầu vai & Giữa lưng sau - Diamond shape) */}
              <g
                id="muscle_trapezius_back"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_trapezius")}
                onMouseEnter={() => setHoveredMuscleId("muscle_trapezius")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Diamond Trapezius shape extending down thoracic spine */}
                <path
                  d="M350 95 L310 135 L288 145 Q310 170 348 230 L352 230 Q390 170 412 145 L390 135 Z"
                  style={getMuscleColorStyle("muscle_trapezius")}
                />
                {/* White Fascia / Tendon center in upper back */}
                <path d="M350 100 L345 155 L350 190 L355 155 Z" fill="url(#tendonGrad)" opacity="0.9" />
              </g>

              {/* 2. Posterior Deltoid (Cơ vai sau) */}
              <g
                id="muscle_deltoid_posterior"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_deltoid_posterior")}
                onMouseEnter={() => setHoveredMuscleId("muscle_deltoid_posterior")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Rear Delt */}
                <path
                  d="M288 144 Q260 165 258 200 Q272 208 284 186 Q292 165 304 148 Z"
                  style={getMuscleColorStyle("muscle_deltoid_posterior")}
                />
                {/* Right Rear Delt */}
                <path
                  d="M412 144 Q440 165 442 200 Q428 208 416 186 Q408 165 396 148 Z"
                  style={getMuscleColorStyle("muscle_deltoid_posterior")}
                />
              </g>

              {/* 3. Infraspinatus & Teres Major (Cơ dưới gai & cơ tròn lớn vai) */}
              <path d="M288 152 Q320 165 338 185 L324 208 Q290 195 284 175 Z" fill="#b33f38" stroke="#802621" strokeWidth="0.8" />
              <path d="M412 152 Q380 165 362 185 L376 208 Q410 195 416 175 Z" fill="#b33f38" stroke="#802621" strokeWidth="0.8" />

              {/* 4. Triceps Brachii (Cơ tam đầu tay sau) */}
              <g
                id="muscle_triceps_brachii"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_triceps_brachii")}
                onMouseEnter={() => setHoveredMuscleId("muscle_triceps_brachii")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Tricep Lateral & Long Head */}
                <path
                  d="M260 200 Q246 240 252 278 Q268 280 274 245 Q278 210 270 200 Z"
                  style={getMuscleColorStyle("muscle_triceps_brachii")}
                />
                {/* Left Tricep Tendon Plate */}
                <path d="M256 250 L260 278 L268 278 L266 250 Z" fill="url(#tendonGrad)" opacity="0.85" />

                {/* Right Tricep Lateral & Long Head */}
                <path
                  d="M440 200 Q454 240 448 278 Q432 280 426 245 Q422 210 430 200 Z"
                  style={getMuscleColorStyle("muscle_triceps_brachii")}
                />
                {/* Right Tricep Tendon Plate */}
                <path d="M444 250 L440 278 L432 278 L434 250 Z" fill="url(#tendonGrad)" opacity="0.85" />
              </g>

              {/* Forearms Back (Cơ duỗi cẳng tay sau) */}
              <g
                id="muscle_forearms_back"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_forearms")}
                onMouseEnter={() => setHoveredMuscleId("muscle_forearms")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                <path
                  d="M252 280 Q236 318 232 375 Q244 380 252 370 Q266 325 264 280 Z"
                  style={getMuscleColorStyle("muscle_forearms")}
                />
                <path
                  d="M448 280 Q464 318 468 375 Q456 380 448 370 Q434 325 436 280 Z"
                  style={getMuscleColorStyle("muscle_forearms")}
                />
                <path d="M232 376 Q224 405 228 425 Q238 428 244 400 L248 375 Z" fill="#c7927e" />
                <path d="M468 376 Q476 405 472 425 Q462 428 456 400 L452 375 Z" fill="#c7927e" />
              </g>

              {/* 5. Latissimus Dorsi (Cơ xô lưng hình V-Taper) */}
              <g
                id="muscle_latissimus_dorsi"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_latissimus_dorsi")}
                onMouseEnter={() => setHoveredMuscleId("muscle_latissimus_dorsi")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Lats V-Wing */}
                <path
                  d="M280 200 Q288 270 318 350 L348 340 L348 235 Q308 190 280 200 Z"
                  style={getMuscleColorStyle("muscle_latissimus_dorsi")}
                />
                {/* Right Lats V-Wing */}
                <path
                  d="M420 200 Q412 270 382 350 L352 340 L352 235 Q392 190 420 200 Z"
                  style={getMuscleColorStyle("muscle_latissimus_dorsi")}
                />
              </g>

              {/* 6. Thoracolumbar Fascia & Erector Spinae (Cơ dựng gai thắt lưng & Mạc ngực thắt lưng) */}
              <g
                id="muscle_erector_spinae"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_erector_spinae")}
                onMouseEnter={() => setHoveredMuscleId("muscle_erector_spinae")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Lumbar Spine Column Fascia */}
                <path
                  d="M332 235 L322 348 L350 368 L378 348 L368 235 Z"
                  style={getMuscleColorStyle("muscle_erector_spinae")}
                />
                {/* White Diamond Fascia */}
                <path d="M350 240 L336 330 L350 362 L364 330 Z" fill="url(#tendonGrad)" opacity="0.9" />
              </g>

              {/* 7. Gluteus Maximus (Cơ mông lớn) */}
              <g
                id="muscle_gluteus_maximus"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_gluteus_maximus")}
                onMouseEnter={() => setHoveredMuscleId("muscle_gluteus_maximus")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Glute */}
                <path
                  d="M350 365 Q310 350 286 385 Q280 435 320 455 Q348 458 350 430 Z"
                  style={getMuscleColorStyle("muscle_gluteus_maximus")}
                />
                {/* Right Glute */}
                <path
                  d="M350 365 Q390 350 414 385 Q420 435 380 455 Q352 458 350 430 Z"
                  style={getMuscleColorStyle("muscle_gluteus_maximus")}
                />
                {/* Gluteal Cleft line */}
                <line x1="350" y1="365" x2="350" y2="445" stroke="#591916" strokeWidth="2" opacity="0.8" />
              </g>

              {/* 8. Hamstrings (Cơ đùi sau - Biceps Femoris, Semitendinosus, Semimembranosus) */}
              <g
                id="muscle_hamstrings"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_hamstrings")}
                onMouseEnter={() => setHoveredMuscleId("muscle_hamstrings")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Hamstring (Biceps Femoris Lateral + Semitendinosus Medial) */}
                <path
                  d="M305 450 Q286 490 292 542 Q314 548 322 542 Q346 490 344 450 Z"
                  style={getMuscleColorStyle("muscle_hamstrings")}
                />
                {/* Left Popliteal Tendons */}
                <line x1="300" y1="540" x2="304" y2="560" stroke="#f1f5f9" strokeWidth="2.5" />
                <line x1="338" y1="540" x2="334" y2="560" stroke="#f1f5f9" strokeWidth="2.5" />

                {/* Right Hamstring (Biceps Femoris Lateral + Semitendinosus Medial) */}
                <path
                  d="M395 450 Q414 490 408 542 Q386 548 378 542 Q354 490 356 450 Z"
                  style={getMuscleColorStyle("muscle_hamstrings")}
                />
                {/* Right Popliteal Tendons */}
                <line x1="400" y1="540" x2="396" y2="560" stroke="#f1f5f9" strokeWidth="2.5" />
                <line x1="362" y1="540" x2="366" y2="560" stroke="#f1f5f9" strokeWidth="2.5" />
              </g>

              {/* 9. Calves Back (Gastrocnemius & Soleus - Bắp chuối đôi & cơ dép) */}
              <g
                id="muscle_calves_back"
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMuscleClick("muscle_calves")}
                onMouseEnter={() => setHoveredMuscleId("muscle_calves")}
                onMouseLeave={() => setHoveredMuscleId(null)}
              >
                {/* Left Gastrocnemius (2 bắp hình trái tim) */}
                <path
                  d="M302 560 Q286 600 295 655 Q318 670 326 655 Q336 600 334 560 Z"
                  style={getMuscleColorStyle("muscle_calves")}
                />
                {/* Left Achilles Tendon */}
                <path d="M312 660 L310 748 L324 748 L322 660 Z" fill="url(#tendonGrad)" stroke="#cbd5e1" strokeWidth="0.8" />

                {/* Right Gastrocnemius (2 bắp hình trái tim) */}
                <path
                  d="M398 560 Q414 600 405 655 Q382 670 374 655 Q364 600 366 560 Z"
                  style={getMuscleColorStyle("muscle_calves")}
                />
                {/* Right Achilles Tendon */}
                <path d="M388 660 L390 748 L376 748 L378 660 Z" fill="url(#tendonGrad)" stroke="#cbd5e1" strokeWidth="0.8" />

                {/* Left Foot Heel */}
                <path d="M308 750 Q315 780 326 780 Q334 775 328 750 Z" fill="#c7927e" />
                {/* Right Foot Heel */}
                <path d="M392 750 Q385 780 374 780 Q366 775 372 750 Z" fill="#c7927e" />
              </g>

              {/* Medical Pointer Callouts & Labels for Back View */}
              {showLabels && (
                <g id="back-medical-labels" className="pointer-events-none transition-opacity duration-300">
                  {/* Left Side */}
                  <line x1="210" y1="135" x2="315" y2="135" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="315" cy="135" r="3" fill="#38bdf8" />
                  <text x="205" y="138" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Trapezius (Cầu vai sau)</text>

                  <line x1="180" y1="200" x2="265" y2="200" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="265" cy="200" r="3" fill="#38bdf8" />
                  <text x="175" y="203" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Deltoid Posterior (Vai sau)</text>

                  <line x1="160" y1="245" x2="260" y2="245" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="260" cy="245" r="3" fill="#38bdf8" />
                  <text x="155" y="248" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Triceps (Cơ tam đầu)</text>

                  <line x1="180" y1="290" x2="305" y2="290" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="305" cy="290" r="3" fill="#38bdf8" />
                  <text x="175" y="293" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Latissimus Dorsi (Cơ xô)</text>

                  <line x1="180" y1="340" x2="335" y2="340" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="335" cy="340" r="3" fill="#38bdf8" />
                  <text x="175" y="343" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="end">Erector Spinae (Thắt lưng)</text>

                  {/* Right Side */}
                  <line x1="490" y1="410" x2="395" y2="410" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="395" cy="410" r="3" fill="#38bdf8" />
                  <text x="495" y="413" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Gluteus Maximus (Cơ mông)</text>

                  <line x1="490" y1="490" x2="390" y2="490" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="390" cy="490" r="3" fill="#38bdf8" />
                  <text x="495" y="493" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Hamstrings (Cơ đùi sau)</text>

                  <line x1="490" y1="610" x2="395" y2="610" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="395" cy="610" r="3" fill="#38bdf8" />
                  <text x="495" y="613" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Gastrocnemius (Bắp chuối)</text>

                  <line x1="490" y1="700" x2="385" y2="700" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="385" cy="700" r="3" fill="#38bdf8" />
                  <text x="495" y="703" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="start">Soleus & Gân Achilles</text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Live Hover Tooltip Card */}
        {hoveredMuscle && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-2xl bg-slate-950/95 backdrop-blur-xl px-4 py-2 text-center text-white border border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.4)] pointer-events-none animate-in fade-in zoom-in-95 z-30">
            <div className="text-xs font-black text-rose-400 flex items-center justify-center gap-1.5">
              <Activity size={13} />
              <span>{hoveredMuscle.nameVi}</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono mt-0.5">
              {hoveredMuscle.name} • Vùng: {hoveredMuscle.region}
            </div>
            {!readOnly && (
              <div className="text-[9px] text-amber-400 font-bold mt-1 uppercase tracking-wider">
                👉 Nhấp chuột để gán vai trò & cường độ
              </div>
            )}
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* 4. Heatmap Color Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 w-full z-10">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
          <span className="font-bold text-white">Cơ phát lực chính (Primary)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          <span className="font-bold text-white">Cơ bổ trợ lực (Secondary)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <span className="font-bold text-white">Cơ ổn định khớp (Stabilizer)</span>
        </div>
      </div>
    </div>
  );
});
