import type {
  ExerciseFormData,
  MovementPhase,
  MuscleTarget,
  CoachingCue,
  CommonMistake,
  MuscleImpactImage,
} from "../types/exercise";
import { findCatalogMuscle } from "../components/anatomy/bodyMusclesAdapter";
import { BLANK_EXERCISE_FORM_DATA_V2 } from "../mock/exerciseMock";

// ===== Cấu trúc `details` của API /exercises (khớp ExerciseDtos.ExerciseDetailsDto ở backend) =====

export interface BackendPhase {
  order?: number;
  name: string;
  vietnameseName?: string | null;
  description?: string | null;
  coachingCue?: string | null;
  breathing?: string | null;
  muscleFocus?: string | null;
  mediaUrl?: string | null;
}

export interface BackendMuscleTarget {
  muscleCode: string;
  muscleName?: string | null;
  muscleNameVi?: string | null;
  bodyRegion?: string | null;
  side?: string | null;
  role: string;
  activationLevel?: string | null;
  laterality?: string | null;
  expectedSensations?: string[];
  unexpectedSensations?: string[];
  userGuidance?: string | null;
}

export interface BackendExerciseDetails {
  version?: string | null;
  displayName?: string | null;
  trainingCategory?: string | null;
  sessionRoles?: string[];
  animationUrl?: string | null;
  tags?: string[];
  equipment?: string[];
  setup?: string | null;
  execution?: string | null;
  inhaleTiming?: string | null;
  exhaleTiming?: string | null;
  tempo?: string | null;
  safety?: {
    contraindications?: string | null;
    generalConsiderations?: string | null;
    safetyCues?: string[];
    stopConditions?: string[];
  } | null;
  phases?: BackendPhase[];
  muscleTargets?: BackendMuscleTarget[];
  coachingCues?: { text: string; priority?: string | null; category?: string | null }[];
  commonMistakes?: {
    name: string;
    problem?: string | null;
    whyItHappens?: string | null;
    correction?: string | null;
    severity?: string | null;
    mediaUrl?: string | null;
  }[];
  anatomyImages?: { url: string; caption?: string | null; primary?: boolean | null }[];
  aiAnalysisData?: string | null;
  /** Coach bật "tích hợp AI": chỉ khi bật học viên mới thấy AI Coach của bài. */
  aiEnabled?: boolean;
}

/** Form Builder -> payload `details` gửi lên backend. */
export function formDataToDetails(form: ExerciseFormData): BackendExerciseDetails {
  const anatomyImages: MuscleImpactImage[] = form.muscles.anatomyImages?.length
    ? form.muscles.anatomyImages
    : form.muscles.anatomyImageUrl
      ? [{ id: "legacy", url: form.muscles.anatomyImageUrl, caption: form.muscles.anatomyImageCaption, isPrimary: true }]
      : [];

  return {
    version: form.version || "1.0",
    displayName: form.basicInformation.displayName,
    trainingCategory: form.basicInformation.category,
    sessionRoles: form.basicInformation.sessionRoles ?? [],
    animationUrl: form.media.animationUrl,
    tags: form.basicInformation.tags,
    equipment: form.basicInformation.equipment,
    setup: form.technique.setup,
    execution: form.technique.execution,
    inhaleTiming: form.technique.inhaleTiming,
    exhaleTiming: form.technique.exhaleTiming,
    tempo: form.technique.tempo,
    safety: {
      contraindications: form.technique.safety.contraindications,
      generalConsiderations: form.technique.safety.generalConsiderations,
      safetyCues: form.technique.safety.safetyCues,
      stopConditions: form.technique.safety.stopConditions,
    },
    phases: form.media.phases.map((p, i) => ({
      order: i + 1,
      name: p.name,
      vietnameseName: p.vietnameseName,
      description: p.description,
      coachingCue: p.coachingCue,
      breathing: p.breathing,
      muscleFocus: p.muscleFocus,
      mediaUrl: p.mediaUrl,
    })),
    muscleTargets: form.muscles.targets.map((t) => {
      const muscle = findCatalogMuscle(t.muscleId);
      return {
        muscleCode: muscle?.code ?? t.muscleId.replace(/^muscle_/, "").toUpperCase(),
        muscleName: muscle?.name,
        muscleNameVi: muscle?.nameVi,
        bodyRegion: muscle?.region,
        side: muscle?.side,
        role: t.role,
        activationLevel: t.activationLevel,
        laterality: t.laterality,
        expectedSensations: t.expectedSensations,
        unexpectedSensations: t.unexpectedSensations,
        userGuidance: t.userGuidance,
      };
    }),
    coachingCues: form.technique.coachingCues.map((c) => ({ text: c.text, priority: c.priority, category: c.category })),
    commonMistakes: form.technique.commonMistakes.map((m) => ({
      name: m.name,
      problem: m.problem,
      whyItHappens: m.whyItHappens,
      correction: m.correction,
      severity: m.severity,
      mediaUrl: m.mediaUrl,
    })),
    anatomyImages: anatomyImages.map((img) => ({ url: img.url, caption: img.caption, primary: !!img.isPrimary })),
    aiAnalysisData: JSON.stringify(form.aiAnalysis),
    aiEnabled: !!form.aiAnalysis.enabled,
  };
}

interface DetailsBaseColumns {
  id: string | number;
  name: string;
  description?: string;
  difficultyLevel?: string;
  movementPattern?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  active: boolean;
}

/**
 * Response backend -> form Builder đầy đủ. Trả về undefined với động tác cũ chưa từng lưu bằng Builder
 * (details.version == null) để trang Edit dựng lại từ các cột cơ bản.
 */
export function detailsToFormData(b: DetailsBaseColumns, d?: BackendExerciseDetails | null): ExerciseFormData | undefined {
  if (!d?.version) return undefined;
  const blank = BLANK_EXERCISE_FORM_DATA_V2;
  const key = String(b.id);

  let aiAnalysis = blank.aiAnalysis;
  if (d.aiAnalysisData) {
    try {
      aiAnalysis = { ...blank.aiAnalysis, ...JSON.parse(d.aiAnalysisData) };
    } catch {
      aiAnalysis = blank.aiAnalysis;
    }
  }
  // Cờ lưu ở cột riêng của bài là nguồn đúng; bản JSON cũ có thể lệch
  if (typeof d.aiEnabled === "boolean") aiAnalysis = { ...aiAnalysis, enabled: d.aiEnabled };

  const images: MuscleImpactImage[] = (d.anatomyImages ?? []).map((img, i) => ({
    id: `img-${key}-${i}`,
    url: img.url,
    caption: img.caption ?? undefined,
    isPrimary: !!img.primary,
  }));

  return {
    id: key,
    basicInformation: {
      ...blank.basicInformation,
      name: b.name,
      displayName: d.displayName ?? b.name,
      category: (d.trainingCategory as ExerciseFormData["basicInformation"]["category"]) || blank.basicInformation.category,
      difficulty: ((b.difficultyLevel === "Elite" ? "Expert" : b.difficultyLevel) as ExerciseFormData["basicInformation"]["difficulty"]) || "Beginner",
      movementPattern: (b.movementPattern as ExerciseFormData["basicInformation"]["movementPattern"]) || blank.basicInformation.movementPattern,
      equipment: (d.equipment as ExerciseFormData["basicInformation"]["equipment"]) ?? [],
      description: b.description ?? "",
      tags: d.tags ?? [],
      sessionRoles: (d.sessionRoles ?? []) as NonNullable<ExerciseFormData["basicInformation"]["sessionRoles"]>,
    },
    media: {
      videoUrl: b.videoUrl ?? "",
      thumbnailUrl: b.thumbnailUrl ?? "",
      animationUrl: d.animationUrl ?? "",
      phases: (d.phases ?? []).map(
        (p, i): MovementPhase => ({
          id: `phase-${key}-${i}`,
          order: p.order ?? i + 1,
          name: p.name,
          vietnameseName: p.vietnameseName ?? "",
          description: p.description ?? "",
          coachingCue: p.coachingCue ?? "",
          breathing: (p.breathing as MovementPhase["breathing"]) || "Natural",
          muscleFocus: p.muscleFocus ?? "",
          mediaUrl: p.mediaUrl ?? undefined,
        })
      ),
    },
    muscles: {
      targets: (d.muscleTargets ?? []).map(
        (t): MuscleTarget => ({
          muscleId:
            findCatalogMuscle(t.muscleCode)?.id ?? `muscle_${t.muscleCode.toLowerCase()}`,
          role: t.role as MuscleTarget["role"],
          activationLevel: (t.activationLevel as MuscleTarget["activationLevel"]) || "MODERATE",
          laterality: (t.laterality as MuscleTarget["laterality"]) || "BILATERAL",
          expectedSensations: (t.expectedSensations ?? []) as MuscleTarget["expectedSensations"],
          unexpectedSensations: (t.unexpectedSensations ?? []) as MuscleTarget["unexpectedSensations"],
          userGuidance: t.userGuidance ?? "",
        })
      ),
      anatomyImages: images,
      anatomyImageUrl: images.find((img) => img.isPrimary)?.url ?? images[0]?.url ?? "",
      anatomyImageCaption: images.find((img) => img.isPrimary)?.caption ?? images[0]?.caption ?? "",
    },
    technique: {
      setup: d.setup ?? "",
      execution: d.execution ?? "",
      inhaleTiming: d.inhaleTiming ?? "",
      exhaleTiming: d.exhaleTiming ?? "",
      tempo: d.tempo ?? blank.technique.tempo,
      coachingCues: (d.coachingCues ?? []).map(
        (c, i): CoachingCue => ({
          id: `cue-${key}-${i}`,
          text: c.text,
          priority: (c.priority as CoachingCue["priority"]) || "MEDIUM",
          category: (c.category as CoachingCue["category"]) || "ALIGNMENT",
        })
      ),
      commonMistakes: (d.commonMistakes ?? []).map(
        (m, i): CommonMistake => ({
          id: `mistake-${key}-${i}`,
          name: m.name,
          problem: m.problem ?? "",
          whyItHappens: m.whyItHappens ?? "",
          correction: m.correction ?? "",
          severity: (m.severity as CommonMistake["severity"]) || "MEDIUM",
          mediaUrl: m.mediaUrl ?? undefined,
        })
      ),
      safety: {
        contraindications: d.safety?.contraindications ?? "",
        generalConsiderations: d.safety?.generalConsiderations ?? "",
        safetyCues: d.safety?.safetyCues ?? [],
        stopConditions: d.safety?.stopConditions ?? [],
      },
    },
    aiAnalysis,
    status: b.active ? "PUBLISHED" : "DRAFT",
    version: d.version,
  };
}
