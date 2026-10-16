import { ViewSide, type BodyState } from "body-muscles";
import {
  CalisHealthMuscle,
  MuscleTarget,
  MuscleActivation,
  MuscleRole,
} from "../../types/exercise";

export const CALISHEALTH_MUSCLE_CATALOG: CalisHealthMuscle[] = [
  // CHEST
  {
    id: "muscle_pectoralis_major",
    code: "PECTORALIS_MAJOR",
    name: "Pectoralis Major",
    nameVi: "Cơ ngực lớn",
    region: "CHEST",
    side: "FRONT",
    bodyMusclesIds: ["chest-upper-left", "chest-upper-right", "chest-lower-left", "chest-lower-right"],
  },
  {
    id: "muscle_pectoralis_minor",
    code: "PECTORALIS_MINOR",
    name: "Pectoralis Minor",
    nameVi: "Cơ ngực bé",
    region: "CHEST",
    side: "FRONT",
    bodyMusclesIds: ["chest-upper-left", "chest-upper-right"],
  },
  {
    id: "muscle_serratus_anterior",
    code: "SERRATUS_ANTERIOR",
    name: "Serratus Anterior",
    nameVi: "Cơ răng cưa (Cơ đấm)",
    region: "CHEST",
    side: "FRONT",
    bodyMusclesIds: ["serratus-anterior-left", "serratus-anterior-right"],
  },

  // SHOULDERS
  {
    id: "muscle_deltoid_anterior",
    code: "DELTOID_ANTERIOR",
    name: "Anterior Deltoid",
    nameVi: "Cơ vai trước",
    region: "SHOULDERS",
    side: "FRONT",
    bodyMusclesIds: ["shoulder-front-left", "shoulder-front-right"],
  },
  {
    id: "muscle_deltoid_lateral",
    code: "DELTOID_LATERAL",
    name: "Lateral Deltoid",
    nameVi: "Cơ vai giữa",
    region: "SHOULDERS",
    side: "BOTH",
    bodyMusclesIds: ["shoulder-side-left", "shoulder-side-right"],
  },
  {
    id: "muscle_deltoid_posterior",
    code: "DELTOID_POSTERIOR",
    name: "Posterior Deltoid",
    nameVi: "Cơ vai sau",
    region: "SHOULDERS",
    side: "BACK",
    bodyMusclesIds: ["deltoid-rear-left", "deltoid-rear-right"],
  },
  {
    id: "muscle_rotator_cuff",
    code: "ROTATOR_CUFF",
    name: "Rotator Cuff (Infraspinatus/Teres)",
    nameVi: "Nhóm cơ chóp xoay vai",
    region: "SHOULDERS",
    side: "BACK",
    bodyMusclesIds: [],
  },

  // ARMS
  {
    id: "muscle_triceps_brachii",
    code: "TRICEPS_BRACHII",
    name: "Triceps Brachii",
    nameVi: "Cơ tam đầu (Tay sau)",
    region: "ARMS",
    side: "BACK",
    bodyMusclesIds: ["triceps-long-left", "triceps-long-right", "triceps-lateral-left", "triceps-lateral-right"],
  },
  {
    id: "muscle_biceps_brachii",
    code: "BICEPS_BRACHII",
    name: "Biceps Brachii",
    nameVi: "Cơ nhị đầu (Tay trước)",
    region: "ARMS",
    side: "FRONT",
    bodyMusclesIds: ["biceps-left", "biceps-right"],
  },
  {
    id: "muscle_forearms",
    code: "FOREARMS",
    name: "Forearms (Brachioradialis / Flexors)",
    nameVi: "Cơ cẳng tay & Cổ tay",
    region: "ARMS",
    side: "BOTH",
    bodyMusclesIds: ["forearm-flexors-left", "forearm-flexors-right", "forearm-extensors-left", "forearm-extensors-right", "forearm-left", "forearm-right"],
  },

  // BACK
  {
    id: "muscle_latissimus_dorsi",
    code: "LATISSIMUS_DORSI",
    name: "Latissimus Dorsi",
    nameVi: "Cơ xô lưng (Lats)",
    region: "BACK",
    side: "BACK",
    bodyMusclesIds: ["lats-upper-left", "lats-upper-right", "lats-mid-left", "lats-mid-right", "lats-lower-left", "lats-lower-right"],
  },
  {
    id: "muscle_trapezius",
    code: "TRAPEZIUS",
    name: "Trapezius (Upper / Mid / Lower)",
    nameVi: "Cơ cầu vai & Giữa lưng",
    region: "BACK",
    side: "BACK",
    bodyMusclesIds: ["traps-upper-left", "traps-upper-right", "traps-mid-left", "traps-mid-right", "traps-lower-left", "traps-lower-right"],
  },
  {
    id: "muscle_rhomboids",
    code: "RHOMBOIDS",
    name: "Rhomboids",
    nameVi: "Cơ quả trám bả vai",
    region: "BACK",
    side: "BACK",
    bodyMusclesIds: ["traps-mid-left", "traps-mid-right"],
  },
  {
    id: "muscle_erector_spinae",
    code: "ERECTOR_SPINAE",
    name: "Erector Spinae",
    nameVi: "Cơ dựng gai cột sống (Lưng dưới)",
    region: "BACK",
    side: "BACK",
    bodyMusclesIds: ["lower-back-erectors-left", "lower-back-erectors-right"],
  },

  // ABDOMINALS / CORE
  {
    id: "muscle_rectus_abdominis",
    code: "RECTUS_ABDOMINIS",
    name: "Rectus Abdominis",
    nameVi: "Cơ thẳng bụng (6 múi)",
    region: "ABDOMINALS",
    side: "FRONT",
    bodyMusclesIds: ["abs-upper-left", "abs-upper-right", "abs-lower-left", "abs-lower-right"],
  },
  {
    id: "muscle_obliques",
    code: "OBLIQUES",
    name: "External / Internal Obliques",
    nameVi: "Cơ liên sườn (Bụng ngoài)",
    region: "ABDOMINALS",
    side: "FRONT",
    bodyMusclesIds: ["obliques-left", "obliques-right"],
  },

  // GLUTES & LEGS
  {
    id: "muscle_gluteus_maximus",
    code: "GLUTEUS_MAXIMUS",
    name: "Gluteus Maximus",
    nameVi: "Cơ mông lớn",
    region: "GLUTES",
    side: "BACK",
    bodyMusclesIds: ["gluteus-maximus-left", "gluteus-maximus-right"],
  },
  {
    id: "muscle_quadriceps",
    code: "QUADRICEPS",
    name: "Quadriceps Femoris",
    nameVi: "Cơ đùi trước (Quads)",
    region: "LEGS",
    side: "FRONT",
    bodyMusclesIds: ["quads-left", "quads-right"],
  },
  {
    id: "muscle_hamstrings",
    code: "HAMSTRINGS",
    name: "Hamstrings (Biceps Femoris)",
    nameVi: "Cơ đùi sau",
    region: "LEGS",
    side: "BACK",
    bodyMusclesIds: ["hamstrings-lateral-left", "hamstrings-lateral-right", "hamstrings-medial-left", "hamstrings-medial-right"],
  },
  {
    id: "muscle_calves",
    code: "CALVES",
    name: "Gastrocnemius & Soleus",
    nameVi: "Cơ bắp chuối & Gót chân",
    region: "LEGS",
    side: "BOTH",
    bodyMusclesIds: ["calves-gastroc-lateral-left", "calves-gastroc-lateral-right", "calves-gastroc-medial-left", "calves-gastroc-medial-right", "calves-soleus-left", "calves-soleus-right"],
  },
];

/**
 * Tìm cơ trong catalog theo id chuẩn ("muscle_pectoralis_major") hoặc mã cơ
 * ("PECTORALIS_MAJOR" / "pectoralis_major" - định dạng AI generator & backend trả về).
 */
export function findCatalogMuscle(idOrCode: string | undefined | null): CalisHealthMuscle | undefined {
  if (!idOrCode) return undefined;
  const key = idOrCode.trim().toLowerCase();
  const code = key.replace(/^muscle_/, "");
  return CALISHEALTH_MUSCLE_CATALOG.find((m) => m.id === key || m.code.toLowerCase() === code);
}

/**
 * Chuẩn hóa muscleId của danh sách nhóm cơ về id catalog và gộp trùng (giữ cấu hình xuất hiện trước).
 * Cơ không có trong catalog được giữ nguyên id để không mất dữ liệu.
 */
export function normalizeMuscleTargets(targets: MuscleTarget[]): MuscleTarget[] {
  const seen = new Set<string>();
  const result: MuscleTarget[] = [];
  for (const t of targets) {
    const muscleId = findCatalogMuscle(t.muscleId)?.id ?? t.muscleId;
    if (seen.has(muscleId)) continue;
    seen.add(muscleId);
    result.push(muscleId === t.muscleId ? t : { ...t, muscleId });
  }
  return result;
}

/**
 * Maps CalisHealth activation level to a numerical intensity for body-muscles (0-10)
 */
export function mapActivationToIntensity(level: MuscleActivation): number {
  switch (level) {
    case "VERY_HIGH":
      return 10;
    case "HIGH":
      return 8;
    case "MODERATE":
      return 5;
    case "LOW":
      return 2;
    default:
      return 5;
  }
}

/**
 * Converts CalisHealth MuscleTargets array into body-muscles BodyState format
 */
export function buildBodyStateFromTargets(targets: MuscleTarget[]): BodyState {
  const bodyState: BodyState = {};

  targets.forEach((target) => {
    const muscle = findCatalogMuscle(target.muscleId);
    if (!muscle) return;

    const intensity = mapActivationToIntensity(target.activationLevel);

    muscle.bodyMusclesIds.forEach((svgId) => {
      // Filter by laterality if specified
      if (target.laterality === "LEFT" && svgId.includes("-right")) return;
      if (target.laterality === "RIGHT" && svgId.includes("-left")) return;

      bodyState[svgId] = {
        intensity,
        selected: true,
      };
    });
  });

  return bodyState;
}

/**
 * Finds the CalisHealth muscle matching a clicked body-muscles SVG ID
 */
export function findMuscleByBodyMusclesId(svgId: string): CalisHealthMuscle | undefined {
  // So khớp chính xác: mã vùng đã khớp 1-1 với thư viện; so tiền tố dễ chọn nhầm cơ.
  // Vùng dùng chung (vd. chest-upper cho ngực lớn & ngực bé) -> cơ khai báo trước trong catalog được chọn.
  return CALISHEALTH_MUSCLE_CATALOG.find((m) => m.bodyMusclesIds.includes(svgId));
}
