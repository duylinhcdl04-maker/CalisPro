import { useRef, useEffect, useState, memo } from "react";
import { BodyChart, ViewSide, type MuscleId } from "body-muscles";
import {
  CALISHEALTH_MUSCLE_CATALOG,
  buildBodyStateFromTargets,
  findMuscleByBodyMusclesId,
} from "./bodyMusclesAdapter";
import { MuscleTarget, CalisHealthMuscle } from "../../types/exercise";
import { Search, Activity } from "lucide-react";

interface AnatomySelectorProps {
  targets: MuscleTarget[];
  onSelectMuscle: (muscle: CalisHealthMuscle) => void;
  onRemoveMuscle?: (muscleId: string) => void;
  readOnly?: boolean;
}

export const AnatomySelector = memo(function AnatomySelector({
  targets,
  onSelectMuscle,
  readOnly = false,
}: AnatomySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);

  const [viewSide, setViewSide] = useState<ViewSide>(ViewSide.FRONT);
  const [hoveredMuscle, setHoveredMuscle] = useState<CalisHealthMuscle | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // BodyChart chỉ khởi tạo 1 lần nên callback truyền vào nó bị "đóng băng" ở lần render đầu
  // (giữ danh sách cơ cũ -> chọn cơ mới sẽ ghi đè cơ đã chọn). Luôn gọi bản callback mới nhất qua ref.
  const onSelectMuscleRef = useRef(onSelectMuscle);
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    onSelectMuscleRef.current = onSelectMuscle;
    readOnlyRef.current = readOnly;
  }, [onSelectMuscle, readOnly]);

  // Initialize BodyChart
  useEffect(() => {
    if (!containerRef.current) return;

    const bodyState = buildBodyStateFromTargets(targets);

    chartRef.current = new BodyChart(containerRef.current, {
      view: viewSide,
      bodyState,
      showViewLabel: false,
      enableTransitions: true,
      onMuscleClick: (id: MuscleId, _name: string) => {
        if (readOnlyRef.current) return;
        const matched = findMuscleByBodyMusclesId(id);
        if (matched) {
          onSelectMuscleRef.current(matched);
        }
      },
      onMuscleHover: (id: MuscleId | null) => {
        if (!id) {
          setHoveredMuscle(null);
          return;
        }
        const matched = findMuscleByBodyMusclesId(id);
        setHoveredMuscle(matched || null);
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // Update BodyChart when targets or view changes
  useEffect(() => {
    if (!chartRef.current) return;
    const bodyState = buildBodyStateFromTargets(targets);
    chartRef.current.update({
      view: viewSide,
      bodyState,
    });
  }, [targets, viewSide]);

  // Search filter
  const searchResults = searchQuery.trim()
    ? CALISHEALTH_MUSCLE_CATALOG.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col items-center rounded-3xl border border-border bg-background/50 p-4 sm:p-6 space-y-5 shadow-xs w-full">
      {/* 1. Header Toolbar with Anterior / Posterior Switcher */}
      <div className="flex flex-wrap items-center justify-between w-full border-b border-border/60 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Activity size={15} />
          </div>
          <div>
            <span className="text-xs font-black text-text-primary uppercase tracking-wider block">
              {readOnly ? "Sơ đồ Giải phẫu Học viên" : "Bộ chọn Giải phẫu Cơ bắp"}
            </span>
            <span className="text-[10px] text-text-secondary font-medium">
              Tương tác nhấp chọn trực tiếp • Toàn thân
            </span>
          </div>
        </div>

        {/* Anterior / Posterior Switcher */}
        <div className="flex rounded-2xl border border-border bg-surface p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewSide(ViewSide.FRONT)}
            className={`rounded-xl px-3.5 py-1.5 font-bold transition-all cursor-pointer ${
              viewSide === ViewSide.FRONT
                ? "bg-accent text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Mặt trước (Anterior)
          </button>
          <button
            type="button"
            onClick={() => setViewSide(ViewSide.BACK)}
            className={`rounded-xl px-3.5 py-1.5 font-bold transition-all cursor-pointer ${
              viewSide === ViewSide.BACK
                ? "bg-accent text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Mặt sau (Posterior)
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Map Viewport (Full height, centered, no clipping) */}
      <div className="relative flex justify-center items-center w-full min-h-[480px] sm:min-h-[540px] py-4 bg-surface/30 rounded-2xl border border-border/40">
        <div
          ref={containerRef}
          className="w-full flex justify-center items-center [&_svg]:h-[460px] sm:[&_svg]:h-[520px] [&_svg]:w-auto [&_svg]:max-w-full drop-shadow-md cursor-pointer transition-transform duration-200"
        />

        {/* Live Hover Tooltip */}
        {hoveredMuscle && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-2xl bg-zinc-950/90 backdrop-blur-md px-4 py-2 text-center text-white border border-accent/40 shadow-xl pointer-events-none animate-in fade-in zoom-in-95 z-20">
            <div className="text-xs font-black text-emerald-400">{hoveredMuscle.nameVi}</div>
            <div className="text-[10px] text-zinc-300 font-mono">{hoveredMuscle.name}</div>
          </div>
        )}
      </div>

      {/* 3. Muscle Quick Search Bar (If interactive) */}
      {!readOnly && (
        <div className="w-full space-y-2 border-t border-border/60 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh nhóm cơ (e.g. ngực, tay sau, xô lưng, quads...)"
              className="w-full rounded-2xl border border-border bg-surface py-2.5 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {searchResults.map((muscle) => (
                <button
                  key={muscle.id}
                  type="button"
                  onClick={() => {
                    onSelectMuscle(muscle);
                    setSearchQuery("");
                  }}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5 text-left text-xs hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-text-primary block">{muscle.nameVi}</span>
                    <span className="text-[10px] text-text-secondary">{muscle.name}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-accent uppercase">
                    {muscle.region}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Color / Intensity Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-text-secondary pt-2 border-t border-border/50 w-full">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shadow-xs" />
          <span className="font-bold text-text-primary">Very High (10)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" />
          <span className="font-bold text-text-primary">High (8)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
          <span className="font-bold text-text-primary">Moderate (5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shadow-xs" />
          <span className="font-bold text-text-primary">Low (2)</span>
        </div>
      </div>
    </div>
  );
});


