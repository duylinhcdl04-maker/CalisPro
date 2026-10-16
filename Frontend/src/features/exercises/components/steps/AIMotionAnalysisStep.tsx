import { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Zap,
  Activity,
  ShieldAlert,
  Volume2,
  Play,
  CheckCircle2,
  Camera,
  Cpu,
  Wand2,
  Layers,
  Compass,
  Info,
  ChevronRight,
  ShieldCheck,
  Check,
  ChevronDown,
  Copy,
  Sliders,
  Sparkle,
  Target,
  Lock,
  Flame,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ExerciseFormData,
  AIJointRule,
  AIROMRule,
  AIErrorRule,
  MediaPipeLandmarkConfig,
} from "../../types/exercise";
import { aiMotionApi } from "../../../ai-motion/api/aiMotionApi";
import { AiConfigNotice } from "../AiConfigNotice";
import { aiGeneratorApi } from "../../../ai-motion/api/aiGeneratorApi";

interface AIMotionAnalysisStepProps {
  formData: ExerciseFormData;
  onChange: (updated: Partial<ExerciseFormData>) => void;
}

// 33 Standard MediaPipe Landmarks list with Vietnamese anatomical names
const ALL_33_LANDMARKS: { id: number; name: string; nameVi: string; bodyPart: "upper_body" | "lower_body" | "core" | "face" }[] = [
  { id: 0, name: "NOSE", nameVi: "Mũi (Nose)", bodyPart: "face" },
  { id: 1, name: "LEFT_EYE_INNER", nameVi: "Khóe mắt trong trái", bodyPart: "face" },
  { id: 2, name: "LEFT_EYE", nameVi: "Mắt trái (Left Eye)", bodyPart: "face" },
  { id: 3, name: "LEFT_EYE_OUTER", nameVi: "Đuôi mắt trái", bodyPart: "face" },
  { id: 4, name: "RIGHT_EYE_INNER", nameVi: "Khóe mắt trong phải", bodyPart: "face" },
  { id: 5, name: "RIGHT_EYE", nameVi: "Mắt phải (Right Eye)", bodyPart: "face" },
  { id: 6, name: "RIGHT_EYE_OUTER", nameVi: "Đuôi mắt phải", bodyPart: "face" },
  { id: 7, name: "LEFT_EAR", nameVi: "Tai trái (Left Ear)", bodyPart: "face" },
  { id: 8, name: "RIGHT_EAR", nameVi: "Tai phải (Right Ear)", bodyPart: "face" },
  { id: 9, name: "MOUTH_LEFT", nameVi: "Mép miệng trái", bodyPart: "face" },
  { id: 10, name: "MOUTH_RIGHT", nameVi: "Mép miệng phải", bodyPart: "face" },
  { id: 11, name: "LEFT_SHOULDER", nameVi: "Khớp vai trái (L Shoulder)", bodyPart: "upper_body" },
  { id: 12, name: "RIGHT_SHOULDER", nameVi: "Khớp vai phải (R Shoulder)", bodyPart: "upper_body" },
  { id: 13, name: "LEFT_ELBOW", nameVi: "Khớp khuỷu trái (L Elbow)", bodyPart: "upper_body" },
  { id: 14, name: "RIGHT_ELBOW", nameVi: "Khớp khuỷu phải (R Elbow)", bodyPart: "upper_body" },
  { id: 15, name: "LEFT_WRIST", nameVi: "Khớp cổ tay trái (L Wrist)", bodyPart: "upper_body" },
  { id: 16, name: "RIGHT_WRIST", nameVi: "Khớp cổ tay phải (R Wrist)", bodyPart: "upper_body" },
  { id: 17, name: "LEFT_PINKY", nameVi: "Ngón út trái (L Pinky)", bodyPart: "upper_body" },
  { id: 18, name: "RIGHT_PINKY", nameVi: "Ngón út phải (R Pinky)", bodyPart: "upper_body" },
  { id: 19, name: "LEFT_INDEX", nameVi: "Ngón trỏ trái (L Index)", bodyPart: "upper_body" },
  { id: 20, name: "RIGHT_INDEX", nameVi: "Ngón trỏ phải (R Index)", bodyPart: "upper_body" },
  { id: 21, name: "LEFT_THUMB", nameVi: "Ngón cái trái (L Thumb)", bodyPart: "upper_body" },
  { id: 22, name: "RIGHT_THUMB", nameVi: "Ngón cái phải (R Thumb)", bodyPart: "upper_body" },
  { id: 23, name: "LEFT_HIP", nameVi: "Khớp háng trái (L Hip)", bodyPart: "core" },
  { id: 24, name: "RIGHT_HIP", nameVi: "Khớp háng phải (R Hip)", bodyPart: "core" },
  { id: 25, name: "LEFT_KNEE", nameVi: "Khớp đầu gối trái (L Knee)", bodyPart: "lower_body" },
  { id: 26, name: "RIGHT_KNEE", nameVi: "Khớp đầu gối phải (R Knee)", bodyPart: "lower_body" },
  { id: 27, name: "LEFT_ANKLE", nameVi: "Khớp cổ chân trái (L Ankle)", bodyPart: "lower_body" },
  { id: 28, name: "RIGHT_ANKLE", nameVi: "Khớp cổ chân phải (R Ankle)", bodyPart: "lower_body" },
  { id: 29, name: "LEFT_HEEL", nameVi: "Gót chân trái (L Heel)", bodyPart: "lower_body" },
  { id: 30, name: "RIGHT_HEEL", nameVi: "Gót chân phải (R Heel)", bodyPart: "lower_body" },
  { id: 31, name: "LEFT_FOOT_INDEX", nameVi: "Mũi chân trái (L Toe)", bodyPart: "lower_body" },
  { id: 32, name: "RIGHT_FOOT_INDEX", nameVi: "Mũi chân phải (R Toe)", bodyPart: "lower_body" },
];

const PRESET_JOINT_MEASUREMENTS = [
  { value: "Elbow Angle (Góc khuỷu tay)", label: "🦾 Góc khuỷu tay (#11-#13-#15 / #12-#14-#16)", code: "ELBOW_ANGLE" },
  { value: "Shoulder Angle (Góc khớp vai)", label: "📐 Góc nách / khớp vai (#13-#11-#23 / #14-#12-#24)", code: "SHOULDER_ANGLE" },
  { value: "Hip Spine Trunk Angle (Trục cột sống - hông)", label: "🦴 Trục thân người / Cột sống - Hông (#11-#23-#25)", code: "HIP_SPINE_ANGLE" },
  { value: "Knee Angle (Góc đầu gối)", label: "🦵 Góc đầu gối (#23-#25-#27 / #24-#26-#28)", code: "KNEE_ANGLE" },
  { value: "Ankle Angle (Góc cổ chân)", label: "👟 Góc cổ chân (#25-#27-#31 / #26-#28-#32)", code: "ANKLE_ANGLE" },
  { value: "Wrist Alignment (Trục cổ tay)", label: "✋ Trục cẳng tay - Cổ tay (#13-#15-#19)", code: "WRIST_ANGLE" },
];

interface SmartRuleTemplate {
  tag: string;
  name: string;
  icon: string;
  measurement: string;
  condition: "LESS_THAN" | "GREATER_THAN" | "BETWEEN" | "OUTSIDE_RANGE" | "STABLE";
  targetValue: number;
  secondaryValue?: number;
  tolerance: number;
  action: "REP_COUNT_TRIGGER" | "FORM_CUE" | "WARNING" | "CRITICAL_STOP";
  message: string;
}

const SMART_RULE_TEMPLATES: SmartRuleTemplate[] = [
  {
    tag: "DEPTH",
    name: "Độ sâu đáy Rep (Bottom Depth ≤ 90°)",
    icon: "🎯",
    measurement: "Elbow Angle (Góc khuỷu tay)",
    condition: "LESS_THAN",
    targetValue: 90,
    tolerance: 5,
    action: "REP_COUNT_TRIGGER",
    message: "Hạ đủ độ sâu tối thiểu (Khuỷu tay ≤ 90°).",
  },
  {
    tag: "LOCKOUT",
    name: "Khóa khớp đỉnh Rep (Lockout Top ≥ 160°)",
    icon: "🔒",
    measurement: "Elbow Angle (Góc khuỷu tay)",
    condition: "GREATER_THAN",
    targetValue: 160,
    tolerance: 5,
    action: "FORM_CUE",
    message: "Đẩy thẳng tay hoàn toàn khóa khớp trên đỉnh rep.",
  },
  {
    tag: "SPINE",
    name: "Trục thân người thẳng (Spine & Hip 175°-185°)",
    icon: "🦴",
    measurement: "Hip Spine Trunk Angle (Trục cột sống - hông)",
    condition: "BETWEEN",
    targetValue: 175,
    secondaryValue: 185,
    tolerance: 5,
    action: "WARNING",
    message: "Giữ thân người thẳng hàng, siết chặt cơ bụng và mông.",
  },
  {
    tag: "SHOULDER",
    name: "Góc mở nách / Vai (Shoulder Angle ≤ 60°)",
    icon: "📐",
    measurement: "Shoulder Angle (Góc khớp vai)",
    condition: "LESS_THAN",
    targetValue: 60,
    tolerance: 5,
    action: "WARNING",
    message: "Khép nhẹ nách góc 45 độ, không xòe khuỷu tay quá rộng.",
  },
  {
    tag: "KNEE_DEPTH",
    name: "Độ sâu đầu gối (Knee Depth ≤ 85°)",
    icon: "🦵",
    measurement: "Knee Angle (Góc đầu gối)",
    condition: "LESS_THAN",
    targetValue: 85,
    tolerance: 5,
    action: "REP_COUNT_TRIGGER",
    message: "Hạ sâu hông song song mặt sàn (Góc gối ≤ 85°).",
  },
  {
    tag: "ANKLE_STABILITY",
    name: "Độ bám gót chân (Ankle Stable ≥ 75°)",
    icon: "👟",
    measurement: "Ankle Angle (Góc cổ chân)",
    condition: "GREATER_THAN",
    targetValue: 75,
    tolerance: 5,
    action: "FORM_CUE",
    message: "Giữ gót chân bám chặt mặt sàn, không nhón gót.",
  },
];

interface BiomechanicalPreset {
  id: string;
  name: string;
  badge: string;
  icon: string;
  desc: string;
  activeLandmarks: number[];
  jointRules: AIJointRule[];
  errorRules: AIErrorRule[];
}

const BIOMECHANICAL_PRESETS: BiomechanicalPreset[] = [
  {
    id: "push_up",
    name: "Push-Up",
    badge: "Hít đất chuẩn",
    icon: "🏋️",
    desc: "Khuỷu tay ≤ 90° chạm đáy, thân người thẳng 180°, khóa khớp 160°.",
    activeLandmarks: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28],
    jointRules: [
      {
        id: "jr-push-1",
        measurement: "Elbow Angle (Góc khuỷu tay)",
        condition: "LESS_THAN",
        targetValue: 90,
        tolerance: 5,
        action: "REP_COUNT_TRIGGER",
        message: "Hạ đủ độ sâu tối thiểu (Khuỷu tay ≤ 90°)",
      },
      {
        id: "jr-push-2",
        measurement: "Elbow Angle (Góc khuỷu tay)",
        condition: "GREATER_THAN",
        targetValue: 160,
        tolerance: 5,
        action: "FORM_CUE",
        message: "Khóa thẳng khớp tay trên đỉnh rep (≥ 160°)",
      },
      {
        id: "jr-push-3",
        measurement: "Hip Spine Trunk Angle (Trục cột sống - hông)",
        condition: "BETWEEN",
        targetValue: 175,
        secondaryValue: 185,
        tolerance: 5,
        action: "WARNING",
        message: "Giữ thân người thẳng trục tự nhiên (175° - 185°)",
      },
    ],
    errorRules: [
      {
        id: "er-push-1",
        ruleName: "Võng lưng / Sụp hông (Sagging Hips)",
        category: "Alignment",
        conditionDescription: "Góc trục cột sống - hông < 160° trong pha Eccentric hoặc Bottom",
        severity: "CRITICAL",
        aiFeedback: "Lưng bị võng sâu, hông sụp xuống.",
        correctionCue: "Siết chặt cơ bụng và gồng cơ mông để nâng hông thẳng hàng.",
      },
      {
        id: "er-push-2",
        ruleName: "Khuỷu tay xòe ngang (Flared Elbows > 75°)",
        category: "Joint Position",
        conditionDescription: "Góc vai-khuỷu tay so với thân người vượt quá 75 độ",
        severity: "WARNING",
        aiFeedback: "Khuỷu tay xòe quá rộng gây áp lực lên khớp vai.",
        correctionCue: "Khép nhẹ nách lại thành hình mũi tên góc 45 độ so với thân.",
      },
      {
        id: "er-push-3",
        ruleName: "Nửa Rep / Không đủ độ sâu (Half Rep)",
        category: "Range of Motion",
        conditionDescription: "Góc khuỷu tay chưa đạt ngưỡng ≤ 90° trước khi đẩy lên",
        severity: "WARNING",
        aiFeedback: "Chưa hạ đủ độ sâu yêu cầu.",
        correctionCue: "Hạ thấp thêm 5-10cm để ngực gần chạm mặt sàn.",
      },
    ],
  },
  {
    id: "pull_up",
    name: "Pull-Up",
    badge: "Hít xà đơn",
    icon: "🧗",
    desc: "Dead-hang duỗi hết tay, kéo cằm vượt xà ngang (Khuỷu tay ≤ 60°).",
    activeLandmarks: [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26],
    jointRules: [
      {
        id: "jr-pull-1",
        measurement: "Elbow Angle (Góc khuỷu tay)",
        condition: "LESS_THAN",
        targetValue: 60,
        tolerance: 5,
        action: "REP_COUNT_TRIGGER",
        message: "Cằm vượt thanh xà hoàn chỉnh (Góc khuỷu tay ≤ 60°)",
      },
      {
        id: "jr-pull-2",
        measurement: "Elbow Angle (Góc khuỷu tay)",
        condition: "GREATER_THAN",
        targetValue: 165,
        tolerance: 5,
        action: "FORM_CUE",
        message: "Thả lỏng duỗi tay hoàn toàn (Dead Hang ≥ 165°)",
      },
    ],
    errorRules: [
      {
        id: "er-pull-1",
        ruleName: "Đung đưa chân / Kipping",
        category: "Stability",
        conditionDescription: "Khớp háng dao động biên độ > 25° tạo đà",
        severity: "WARNING",
        aiFeedback: "Phát hiện đà đung đưa từ chân.",
        correctionCue: "Khép chặt 2 chân, gồng bụng và dùng 100% lực cơ lưng xô.",
      },
      {
        id: "er-pull-2",
        ruleName: "Chưa qua cằm (Incomplete ROM)",
        category: "Range of Motion",
        conditionDescription: "Tọa độ Mũi/Cằm chưa vượt qua đường thẳng giữa 2 cổ tay",
        severity: "CRITICAL",
        aiFeedback: "Cằm chưa vượt thanh xà.",
        correctionCue: "Kéo mạnh cùi chỏ về phía sau hông để đưa cằm vượt thanh xà.",
      },
    ],
  },
  {
    id: "squat",
    name: "Squat",
    badge: "Ngồi xổm chuẩn",
    icon: "🦵",
    desc: "Hông sâu hơn gối (Góc gối ≤ 85°), lưng giữ thẳng, đầu gối mở tự nhiên.",
    activeLandmarks: [11, 12, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
    jointRules: [
      {
        id: "jr-squat-1",
        measurement: "Knee Angle (Góc đầu gối)",
        condition: "LESS_THAN",
        targetValue: 85,
        tolerance: 5,
        action: "REP_COUNT_TRIGGER",
        message: "Đạt chuẩn độ sâu Squat (Góc gối ≤ 85°)",
      },
      {
        id: "jr-squat-2",
        measurement: "Knee Angle (Góc đầu gối)",
        condition: "GREATER_THAN",
        targetValue: 165,
        tolerance: 5,
        action: "FORM_CUE",
        message: "Đứng thẳng hoàn toàn khóa hông (≥ 165°)",
      },
    ],
    errorRules: [
      {
        id: "er-squat-1",
        ruleName: "Gối chụm vào trong (Knee Valgus)",
        category: "Joint Position",
        conditionDescription: "Khoảng cách giữa 2 đầu gối hẹp hơn khoảng cách 2 mắt cá chân",
        severity: "CRITICAL",
        aiFeedback: "Đầu gối đang bị chụm vào trong.",
        correctionCue: "Chủ động đẩy 2 đầu gối mở ra hướng theo mũi chân.",
      },
      {
        id: "er-squat-2",
        ruleName: "Nhón gót chân (Heels Lifting)",
        category: "Stability",
        conditionDescription: "Tọa độ gót chân nâng lên so với mũi chân > 3cm",
        severity: "WARNING",
        aiFeedback: "Gót chân bị nhấc khỏi mặt đất.",
        correctionCue: "Dồn trọng tâm đều vào giữa lòng bàn chân và gót chân.",
      },
    ],
  },
  {
    id: "dips",
    name: "Dips",
    badge: "Xà kép ngực/tay sau",
    icon: "🤸",
    desc: "Hạ vuông góc 90° khuỷu tay, đẩy thẳng khóa tay, ngực mở tự nhiên.",
    activeLandmarks: [11, 12, 13, 14, 15, 16, 23, 24],
    jointRules: [
      {
        id: "jr-dips-1",
        measurement: "Elbow Angle (Góc khuỷu tay)",
        condition: "LESS_THAN",
        targetValue: 90,
        tolerance: 5,
        action: "REP_COUNT_TRIGGER",
        message: "Hạ đủ góc 90 độ khuỷu tay",
      },
      {
        id: "jr-dips-2",
        measurement: "Elbow Angle (Góc khuỷu tay)",
        condition: "GREATER_THAN",
        targetValue: 165,
        tolerance: 5,
        action: "FORM_CUE",
        message: "Đẩy thẳng tay khóa khớp",
      },
    ],
    errorRules: [
      {
        id: "er-dips-1",
        ruleName: "Hạ quá sâu gây tổn thương vai",
        category: "Joint Position",
        conditionDescription: "Góc khuỷu tay < 70° vượt quá khả năng linh hoạt khớp vai",
        severity: "CRITICAL",
        aiFeedback: "Hạ quá sâu nguy hiểm cho khớp vai.",
        correctionCue: "Dừng lại khi bắp tay song song mặt đất (góc 90 độ).",
      },
    ],
  },
  {
    id: "plank",
    name: "Plank",
    badge: "Giữ tĩnh Core",
    icon: "🧘",
    desc: "Duy trì trục thân người 180° thẳng tắp, không võng lưng, không chổng mông.",
    activeLandmarks: [11, 12, 13, 14, 23, 24, 25, 26, 27, 28],
    jointRules: [
      {
        id: "jr-plank-1",
        measurement: "Hip Spine Trunk Angle (Trục cột sống - hông)",
        condition: "BETWEEN",
        targetValue: 175,
        secondaryValue: 185,
        tolerance: 5,
        action: "FORM_CUE",
        message: "Duy trì trục cơ thể thẳng chuẩn",
      },
    ],
    errorRules: [
      {
        id: "er-plank-1",
        ruleName: "Võng lưng sụp xương chậu",
        category: "Alignment",
        conditionDescription: "Góc hông < 165° sụp xuống mặt sàn",
        severity: "CRITICAL",
        aiFeedback: "Lưng đang bị võng.",
        correctionCue: "Cuộn xương chậu ra sau (Posterior Pelvic Tilt) và gồng cơ bụng.",
      },
      {
        id: "er-plank-2",
        ruleName: "Chổng mông lên quá cao",
        category: "Alignment",
        conditionDescription: "Góc hông > 195° nhô lên cao",
        severity: "WARNING",
        aiFeedback: "Mông đang nhô lên quá cao làm giảm tải cơ bụng.",
        correctionCue: "Hạ hông xuống thẳng hàng với vai và gót chân.",
      },
    ],
  },
];

export function AIMotionAnalysisStep({ formData, onChange }: AIMotionAnalysisStepProps) {
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "upper_body" | "lower_body" | "core" | "face">("ALL");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [isGeneratingRules, setIsGeneratingRules] = useState<boolean>(false);

  const ai = formData.aiAnalysis;

  function updateAI(updated: Partial<typeof ai>) {
    onChange({
      aiAnalysis: {
        ...ai,
        ...updated,
      },
    });
  }

  // Deterministic rule signature deduplication
  function getJointRuleSignature(r: { measurement: string; condition: string; targetValue?: number }): string {
    return `${(r.measurement || "").toLowerCase().replace(/[^a-z0-9]/g, "")}_${r.condition}_${r.targetValue || 0}`;
  }

  function getErrorRuleSignature(r: { ruleName: string }): string {
    return (r.ruleName || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  // 🚀 AI AUTO-GENERATE BIOMECHANICAL MOTION RULES
  async function handleAutoGenerateRulesWithAi() {
    const exName = formData.basicInformation.name?.trim();
    if (!exName) {
      toast.warning("Vui lòng nhập tên động tác ở Bước 01 trước khi AI sinh quy tắc.");
      return;
    }

    setIsGeneratingRules(true);
    const toastId = toast.loading(`Gemini AI đang phân tích cơ sinh học & sinh quy tắc cho "${exName}"...`);

    try {
      const res = await aiGeneratorApi.generateMotionRules({
        exerciseName: exName,
        movementPattern: formData.basicInformation.movementPattern,
        difficulty: formData.basicInformation.difficulty,
        existingJointRules: ai.jointRules.map((r) => r.measurement),
        existingErrorRules: ai.errorRules.map((r) => r.ruleName),
      });

      if (!res || !res.success) {
        toast.error("Không thể sinh quy tắc từ AI", { id: toastId });
        return;
      }

      // 1. Landmarks: enable recommended MediaPipe landmarks
      const currentLandmarks = (ai.landmarks && ai.landmarks.length > 0)
        ? ai.landmarks
        : ALL_33_LANDMARKS.map((l) => ({ ...l, enabled: false }));

      const recommendedLandmarkIds = res.recommendedLandmarkIds || [];
      const updatedLandmarks = currentLandmarks.map((lm) => ({
        ...lm,
        enabled: recommendedLandmarkIds.includes(lm.id) || lm.enabled,
      }));

      // 2. Joint rules deduplication
      const existingJointSignatures = new Set(ai.jointRules.map(getJointRuleSignature));
      const newJointRules: AIJointRule[] = [];

      for (const jr of res.jointRules || []) {
        const sig = getJointRuleSignature(jr);
        if (!existingJointSignatures.has(sig)) {
          existingJointSignatures.add(sig);
          newJointRules.push({
            id: `jr-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            measurement: jr.measurement,
            condition: jr.condition,
            targetValue: jr.targetValue,
            secondaryValue: jr.secondaryValue,
            tolerance: jr.tolerance || 5,
            action: jr.action,
            message: jr.voicePromptVi || jr.ruleRoleName || "",
          });
        }
      }

      // 3. Error rules deduplication
      const existingErrorSignatures = new Set(ai.errorRules.map(getErrorRuleSignature));
      const newErrorRules: AIErrorRule[] = [];

      for (const er of res.errorRules || []) {
        const sig = getErrorRuleSignature(er);
        if (!existingErrorSignatures.has(sig)) {
          existingErrorSignatures.add(sig);
          newErrorRules.push({
            id: `er-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            ruleName: er.ruleName,
            category: er.category || "Alignment",
            conditionDescription: er.conditionDescription,
            severity: er.severity,
            aiFeedback: er.aiFeedbackVi,
            correctionCue: er.correctionCueVi,
          });
        }
      }

      // 4. ROM: thêm các biên độ chưa có (theo tên chuyển động)
      const existingRomNames = new Set(ai.romRules.map((r) => r.movementName.trim().toLowerCase()));
      const newRomRules: AIROMRule[] = (res.romRules || [])
        .filter((r) => !existingRomNames.has(r.movementName.trim().toLowerCase()))
        .map((r) => ({
          id: `rom-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          movementName: r.movementName,
          metricType: r.metricType,
          minROM: r.minROM,
          maxROM: r.maxROM,
          tolerance: r.tolerance,
          unit: r.unit,
          description: r.description,
        }));

      const totalNewRules = newJointRules.length + newErrorRules.length + newRomRules.length;
      updateAI({
        enabled: true,
        landmarks: updatedLandmarks,
        jointRules: [...ai.jointRules, ...newJointRules],
        errorRules: [...ai.errorRules, ...newErrorRules],
        romRules: [...ai.romRules, ...newRomRules],
        // 5. Tempo: dùng nhịp độ Gemini phân tích riêng cho động tác (dữ liệu mẫu không có tempo -> giữ nguyên)
        ...(res.tempoRule ? { tempoRule: res.tempoRule } : {}),
      });

      const summary = `+${newJointRules.length} quy tắc góc, +${newRomRules.length} ROM, +${newErrorRules.length} lỗi sai, bật ${recommendedLandmarkIds.length} điểm mốc`;
      if (res.source === "FALLBACK") {
        toast.warning(`Gemini đang không phản hồi - đã thêm QUY TẮC MẪU (${summary})`, {
          id: toastId,
          description: "Đây là bộ quy tắc chung theo loại chuyển động, chưa phân tích riêng cho động tác. Hãy kiểm tra lại góc khớp hoặc thử sinh lại sau.",
          duration: 10000,
        });
      } else {
        toast.success(`Gemini đã phân tích: ${summary}${res.tempoRule ? ", cập nhật tempo" : ""}`, {
          id: toastId,
          description: res.warnings?.length
            ? `Đã tự điều chỉnh: ${res.warnings.slice(0, 3).join("; ")}`
            : res.deduplicationReport || (totalNewRules === 0 ? "Tất cả quy tắc AI đề xuất đã tồn tại (chống trùng lặp)." : undefined),
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi khi gọi AI sinh quy tắc", { id: toastId });
    } finally {
      setIsGeneratingRules(false);
    }
  }

  function handleClearAllRules() {
    if (ai.jointRules.length === 0 && ai.errorRules.length === 0) return;
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ quy tắc góc và quy tắc bắt lỗi trong form này?")) return;
    updateAI({
      jointRules: [],
      errorRules: [],
    });
    toast.info("Đã xóa toàn bộ bộ quy tắc trong form");
  }

  function handleToggleAiEnabled(enabled: boolean) {
    updateAI({ enabled });
    if (enabled && (!ai.landmarks || ai.landmarks.length === 0)) {
      const defaultLandmarks: MediaPipeLandmarkConfig[] = ALL_33_LANDMARKS.map((lm) => ({
        id: lm.id,
        name: lm.name,
        nameVi: lm.nameVi,
        bodyPart: lm.bodyPart,
        enabled: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(lm.id),
      }));
      updateAI({ landmarks: defaultLandmarks });
    }
  }

  // Handle Preset Apply
  function handleApplyPreset(preset: BiomechanicalPreset) {
    setSelectedPresetId(preset.id);
    
    const updatedLandmarks: MediaPipeLandmarkConfig[] = ALL_33_LANDMARKS.map((lm) => ({
      id: lm.id,
      name: lm.name,
      nameVi: lm.nameVi,
      bodyPart: lm.bodyPart,
      enabled: preset.activeLandmarks.includes(lm.id),
    }));

    updateAI({
      enabled: true,
      landmarks: updatedLandmarks,
      jointRules: preset.jointRules,
      errorRules: preset.errorRules,
    });

    toast.success(`Đã áp dụng mẫu: ${preset.name} (${preset.badge})`, {
      description: `Đã cấu hình ${preset.activeLandmarks.length} điểm mốc và ${preset.jointRules.length} quy tắc góc sinh cơ học.`,
    });
  }

  // Landmark batch selectors
  function handleSelectAllLandmarks(select: boolean) {
    const currentBase = (ai.landmarks && ai.landmarks.length > 0) ? ai.landmarks : ALL_33_LANDMARKS.map(l => ({ ...l, enabled: false }));
    const updated = currentBase.map((l) => ({
      ...l,
      enabled: select,
    }));
    updateAI({ landmarks: updated });
    toast.info(select ? "Đã chọn toàn bộ 33 điểm mốc MediaPipe" : "Đã bỏ chọn toàn bộ điểm mốc");
  }

  function handleToggleLandmark(id: number) {
    const currentList = (ai.landmarks && ai.landmarks.length > 0) ? ai.landmarks : ALL_33_LANDMARKS.map(l => ({ ...l, enabled: false }));
    const updated = currentList.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l));
    updateAI({ landmarks: updated });
  }

  // 🚀 SMART ADD JOINT RULE
  function handleAddSpecificJointRule(template?: SmartRuleTemplate) {
    setIsAddMenuOpen(false);

    let chosenTemplate: SmartRuleTemplate;

    if (template) {
      chosenTemplate = template;
    } else {
      const existingMeasurements = ai.jointRules.map((r) => r.measurement);
      const unused = SMART_RULE_TEMPLATES.find((t) => !existingMeasurements.includes(t.measurement));
      
      if (unused) {
        chosenTemplate = unused;
      } else {
        const nextIndex = ai.jointRules.length % SMART_RULE_TEMPLATES.length;
        chosenTemplate = SMART_RULE_TEMPLATES[nextIndex];
      }
    }

    const newRule: AIJointRule = {
      id: `jr-${Date.now()}`,
      measurement: chosenTemplate.measurement,
      condition: chosenTemplate.condition,
      targetValue: chosenTemplate.targetValue,
      secondaryValue: chosenTemplate.secondaryValue,
      tolerance: chosenTemplate.tolerance,
      action: chosenTemplate.action,
      message: chosenTemplate.message,
    };

    updateAI({ jointRules: [...ai.jointRules, newRule] });
    toast.success(`Đã thêm quy tắc: ${chosenTemplate.name}`);
  }

  // Clone a rule
  function handleCloneJointRule(rule: AIJointRule) {
    const cloned: AIJointRule = {
      ...rule,
      id: `jr-${Date.now()}`,
      message: `${rule.message} (Bản sao)`,
    };
    updateAI({ jointRules: [...ai.jointRules, cloned] });
    toast.success("Đã nhân bản quy tắc góc khớp");
  }

  // Auto-generate Vietnamese coaching cue from parameters
  function handleAutoSuggestVoicePrompt(rule: AIJointRule) {
    let suggested = "";
    const condText = rule.condition === "LESS_THAN" ? "nhỏ hơn hoặc bằng" : rule.condition === "GREATER_THAN" ? "lớn hơn hoặc bằng" : "trong khoảng";
    
    if (rule.measurement.includes("Elbow")) {
      if (rule.condition === "LESS_THAN") {
        suggested = `Hạ sâu xuống, gập khuỷu tay đạt ${rule.targetValue} độ để tính rep chuẩn!`;
      } else {
        suggested = `Đẩy thẳng tay hoàn toàn ${rule.targetValue} độ trước khi bắt đầu rep mới.`;
      }
    } else if (rule.measurement.includes("Knee")) {
      if (rule.condition === "LESS_THAN") {
        suggested = `Hạ thấp hông xuống sâu, đầu gối gập ${rule.targetValue} độ.`;
      } else {
        suggested = `Đứng thẳng người hoàn toàn ${rule.targetValue} độ khóa hông.`;
      }
    } else if (rule.measurement.includes("Spine") || rule.measurement.includes("Hip")) {
      suggested = `Giữ trục thân người thẳng tắp ${rule.targetValue} độ, gồng chặt cơ bụng.`;
    } else if (rule.measurement.includes("Shoulder")) {
      suggested = `Khép nhẹ nách lại, giữ góc vai trong tầm an toàn ${rule.targetValue} độ.`;
    } else {
      suggested = `Duy trì ${rule.measurement} ${condText} ${rule.targetValue} độ.`;
    }

    handleUpdateJointRule(rule.id, { message: suggested });
    toast.success("Đã tạo câu khẩu lệnh AI gợi ý!", { description: suggested });
  }

  function handleUpdateJointRule(id: string, updated: Partial<AIJointRule>) {
    updateAI({
      jointRules: ai.jointRules.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    });
  }

  function handleDeleteJointRule(id: string) {
    updateAI({ jointRules: ai.jointRules.filter((r) => r.id !== id) });
    toast.info("Đã xóa quy tắc góc khớp");
  }

  // 🚀 SMART ADD ERROR RULE
  function handleAddErrorRule() {
    const errorTemplates = [
      {
        ruleName: "Võng lưng / Sụp hông (Sagging Hips)",
        category: "Alignment" as const,
        conditionDescription: "Góc trục cột sống - hông < 160°",
        severity: "CRITICAL" as const,
        aiFeedback: "Lưng đang bị võng, hông sụp xuống sàn.",
        correctionCue: "Siết chặt cơ bụng và gồng cơ mông để nâng hông thẳng hàng.",
      },
      {
        ruleName: "Khuỷu tay xòe ngang (Flared Elbows > 75°)",
        category: "Joint Position" as const,
        conditionDescription: "Góc vai-khuỷu tay so với thân > 75°",
        severity: "WARNING" as const,
        aiFeedback: "Khuỷu tay xòe quá rộng gây áp lực khớp vai.",
        correctionCue: "Khép nhẹ nách lại góc 45 độ so với thân.",
      },
      {
        ruleName: "Nửa Rep / Chưa đủ độ sâu (Half Rep)",
        category: "Range of Motion" as const,
        conditionDescription: "Chưa đạt biên độ sâu tối thiểu",
        severity: "WARNING" as const,
        aiFeedback: "Chưa hạ đủ độ sâu yêu cầu.",
        correctionCue: "Hạ thấp thêm 5cm để ngực gần chạm sàn.",
      },
      {
        ruleName: "Gối chụm vào trong (Knee Valgus)",
        category: "Joint Position" as const,
        conditionDescription: "Đầu gối chụm hẹp hơn mắt cá chân",
        severity: "CRITICAL" as const,
        aiFeedback: "Đầu gối đang bị chụm vào trong.",
        correctionCue: "Chủ động mở 2 đầu gối hướng theo mũi chân.",
      },
    ];

    const nextIndex = ai.errorRules.length % errorTemplates.length;
    const chosen = errorTemplates[nextIndex];

    const newError: AIErrorRule = {
      id: `er-${Date.now()}`,
      ...chosen,
    };

    updateAI({ errorRules: [...ai.errorRules, newError] });
    toast.success(`Đã thêm quy tắc bắt lỗi: ${chosen.ruleName}`);
  }

  function handleUpdateErrorRule(id: string, updated: Partial<AIErrorRule>) {
    updateAI({
      errorRules: ai.errorRules.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    });
  }

  function handleDeleteErrorRule(id: string) {
    updateAI({ errorRules: ai.errorRules.filter((r) => r.id !== id) });
    toast.info("Đã xóa quy tắc bắt lỗi");
  }

  // Voice Test Function
  async function handleTestVoicePrompt(id: string, text: string) {
    if (!text || !text.trim()) {
      toast.warning("Vui lòng nhập nội dung câu lệnh giọng nói trước khi nghe thử.");
      return;
    }

    setPlayingVoiceId(id);
    try {
      await aiMotionApi.speakVoicePrompt(text);
    } catch (e: any) {
      toast.error(e?.message || "Không thể phát âm thanh voice prompt.");
    } finally {
      setPlayingVoiceId(null);
    }
  }

  const landmarksSource = (ai.landmarks && ai.landmarks.length > 0)
    ? ai.landmarks 
    : ALL_33_LANDMARKS.map(l => ({ ...l, enabled: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26].includes(l.id) }));

  const activeLandmarksCount = landmarksSource.filter((l) => l.enabled).length;

  const countByPart = {
    ALL: landmarksSource.length,
    upper_body: landmarksSource.filter((l) => l.bodyPart === "upper_body").length,
    lower_body: landmarksSource.filter((l) => l.bodyPart === "lower_body").length,
    core: landmarksSource.filter((l) => l.bodyPart === "core").length,
    face: landmarksSource.filter((l) => l.bodyPart === "face").length,
  };

  const activeCountByPart = {
    upper_body: landmarksSource.filter((l) => l.bodyPart === "upper_body" && l.enabled).length,
    lower_body: landmarksSource.filter((l) => l.bodyPart === "lower_body" && l.enabled).length,
    core: landmarksSource.filter((l) => l.bodyPart === "core" && l.enabled).length,
    face: landmarksSource.filter((l) => l.bodyPart === "face" && l.enabled).length,
  };

  const filteredLandmarks = landmarksSource.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(landmarkSearch.toLowerCase()) ||
      l.nameVi.toLowerCase().includes(landmarkSearch.toLowerCase()) ||
      l.id.toString() === landmarkSearch.trim();
    const matchesPart = activeTab === "ALL" || l.bodyPart === activeTab;
    return matchesSearch && matchesPart;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 🌟 STEP HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface/80 p-6 md:p-8 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-32 w-64 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent text-white shadow-sm shadow-accent/40">
                <Sparkles size={15} />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-accent">
                Bước 05 / 06 • AI Motion & Biomechanics
              </span>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-400">
                MediaPipe 33D + Viettel TTS
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Cấu hình AI Motion Analysis & Quy tắc Góc khớp
            </h2>
            <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
              Thiết lập bộ não thị giác máy tính: Điểm mốc khung xương (MediaPipe Landmarks), công thức toán học góc khớp, ngưỡng đếm Rep, bắt lỗi sai tư thế và khẩu lệnh giọng nói AI Coaching thời gian thực.
            </p>
          </div>

          {/* Tích hợp AI: học viên chỉ thấy "Tập với AI Coach" của bài này khi chọn Có */}
          <fieldset className={`rounded-2xl border p-4 transition-all duration-300 md:max-w-sm shrink-0 ${
            ai.enabled ? "border-accent/40 bg-accent/10 shadow-md shadow-accent/10" : "border-border bg-surface shadow-xs"
          }`}>
            <legend className="px-1 text-xs font-black tracking-wide text-text-primary">Tích hợp AI cho bài tập này</legend>
            <div className="mt-1 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tích hợp AI">
              {[
                { value: false, label: "Không", hint: "Chỉ video hướng dẫn" },
                { value: true, label: "Có", hint: "Học viên tập với AI Coach" },
              ].map((o) => (
                <label
                  key={o.label}
                  className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-2 text-left transition ${
                    !!ai.enabled === o.value ? "border-accent bg-accent/15" : "border-border bg-background hover:border-accent/40"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-black text-text-primary">
                    <input
                      type="radio"
                      name="ai-integration"
                      checked={!!ai.enabled === o.value}
                      onChange={() => handleToggleAiEnabled(o.value)}
                      className="accent-[var(--accent,#10b981)]"
                    />
                    {o.label}
                  </span>
                  <span className="pl-6 text-[11px] text-text-secondary">{o.hint}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
              {ai.enabled
                ? "Phần \"Tập với AI Coach\" sẽ hiện ở trang chi tiết bài và ở trang luyện tập của học viên. Bài cần đủ cấu hình đo bên dưới (loại chuyển động, ngưỡng đỉnh/đáy, 3 điểm khớp chính) thì AI mới chạy."
                : "Học viên sẽ không thấy phần tập với AI Coach của bài này và tự nhập kết quả khi tập."}
            </p>
          </fieldset>
        </div>

        {ai.enabled && (
          <div className="mt-5">
            <AiConfigNotice exerciseId={/^\d+$/.test(String(formData.id ?? "")) ? Number(formData.id) : undefined} />
          </div>
        )}

        {/* 🌟 AI BIOMECHANICAL GENERATOR CALLOUT BANNER */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-accent/10 via-sky-500/10 to-indigo-500/10 border border-accent/30 p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/30">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-text-primary uppercase tracking-wide">
                    Gemini Biomechanical AI Generator
                  </span>
                  <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-bold text-accent">
                    Chống trùng lặp & Cache Redis &lt;15ms
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Tự động sinh 33 mốc xương MediaPipe, công thức góc khớp toán học và câu lệnh giọng nói AI Coaching cho bài "{formData.basicInformation.name || "bài tập hiện tại"}".
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingRules}
              onClick={handleAutoGenerateRulesWithAi}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-strong px-4 py-2.5 text-xs font-black text-white shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isGeneratingRules ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>AI đang tính toán...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>✨ AI Tự Động Sinh Quy Tắc</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 🚀 QUICK BIOMECHANICAL PRESETS BAR */}
        {ai.enabled && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Wand2 size={14} className="text-accent" />
                <span className="text-xs font-black text-text-primary uppercase tracking-wide">
                  Mẫu sinh cơ học thông minh (1-Click Biomechanical Presets):
                </span>
              </div>
              <span className="text-[11px] text-text-secondary">
                Chọn mẫu để tự động áp dụng công thức chuẩn
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {BIOMECHANICAL_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`group relative flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/15 ring-2 ring-accent/30 shadow-md"
                        : "border-border bg-background hover:border-accent/40 hover:bg-surface-elevated"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{preset.icon}</span>
                      {isSelected ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-text-secondary opacity-60">
                          {preset.activeLandmarks.length} pts
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-text-primary group-hover:text-accent transition-colors block">
                        {preset.name}
                      </span>
                      <span className="text-[11px] font-bold text-accent block">
                        {preset.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-secondary line-clamp-2 mt-1 leading-relaxed opacity-80">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {ai.enabled ? (
        <div className="space-y-8">
          {/* ========================================================================= */}
          {/* SECTION 1: MEDIAPIPE 33 LANDMARKS SELECTION (REDESIGNED & SPACIOUS) */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-7 shadow-xs space-y-5">
            {/* Header with Counter Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent text-xs font-black">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">
                    Điểm mốc MediaPipe Pose (33 Landmarks Matrix)
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Chọn các khớp xương mà AI Camera cần bám đuôi (Tracking) trong suốt buổi tập.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  activeLandmarksCount > 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}>
                  <div className={`h-2 w-2 rounded-full ${activeLandmarksCount > 0 ? "bg-emerald-400" : "bg-rose-400"}`} />
                  <span>Đã chọn: {activeLandmarksCount} / 33 điểm</span>
                </span>
              </div>
            </div>

            {/* Segmented Body-Part Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-background border border-border/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "ALL"
                      ? "bg-accent text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  Tất cả ({countByPart.ALL})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upper_body")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "upper_body"
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <span>Thân trên (Tay/Vai)</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "upper_body" ? "bg-white/20" : "bg-sky-500/10 text-sky-400"}`}>
                    {activeCountByPart.upper_body}/{countByPart.upper_body}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("core")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "core"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <span>Cơ lõi & Hông</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "core" ? "bg-white/20" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {activeCountByPart.core}/{countByPart.core}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("lower_body")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "lower_body"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <span>Thân dưới (Chân/Gối)</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "lower_body" ? "bg-white/20" : "bg-amber-500/10 text-amber-400"}`}>
                    {activeCountByPart.lower_body}/{countByPart.lower_body}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("face")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "face"
                      ? "bg-purple-500 text-white shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <span>Đầu & Mặt</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${activeTab === "face" ? "bg-white/20" : "bg-purple-500/10 text-purple-400"}`}>
                    {activeCountByPart.face}/{countByPart.face}
                  </span>
                </button>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllLandmarks(true)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer transition-colors"
                >
                  ✓ Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllLandmarks(false)}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                >
                  ✗ Bỏ chọn hết
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={landmarkSearch}
                onChange={(e) => setLandmarkSearch(e.target.value)}
                placeholder="Tìm kiếm điểm mốc (Nhập #13, vai, khuỷu tay, gối, gót chân...)"
                className="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-10 text-xs text-text-primary focus:border-accent focus:outline-none"
              />
              {landmarkSearch && (
                <button
                  type="button"
                  onClick={() => setLandmarkSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Landmarks Matrix Grid - Spacious and Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1.5 p-2 bg-background/50 rounded-2xl border border-border/60">
              {filteredLandmarks.map((lm) => {
                const isChecked = lm.enabled;
                const regionColor =
                  lm.bodyPart === "upper_body"
                    ? "text-sky-400 border-sky-500/30 bg-sky-500/10"
                    : lm.bodyPart === "core"
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : lm.bodyPart === "lower_body"
                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    : "text-purple-400 border-purple-500/30 bg-purple-500/10";

                return (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => handleToggleLandmark(lm.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer select-none ${
                      isChecked
                        ? "border-accent/60 bg-accent/15 text-text-primary shadow-sm ring-1 ring-accent/40"
                        : "border-border/70 bg-surface/60 text-text-secondary opacity-70 hover:opacity-100 hover:border-border"
                    }`}
                  >
                    {/* Custom Styled Checkbox Box */}
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      isChecked
                        ? "border-accent bg-accent text-white shadow-sm"
                        : "border-border bg-background"
                    }`}>
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-black border ${regionColor}`}>
                          #{lm.id}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono truncate uppercase opacity-60">
                          {lm.name}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-text-primary leading-tight">
                        {lm.nameVi}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: BIOMECHANICAL JOINT ANGLE RULES (SMART BUILDER) */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent text-xs font-black">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">
                    Bộ quy tắc góc khớp (Joint Angle Biomechanics Builder)
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Xây dựng logic điều kiện dạng <code>WHEN [Khớp] [Điều kiện] [Góc độ] THEN [Hành động]</code> để tính Rep và hướng dẫn form.
                  </p>
                </div>
              </div>

              {/* Action Buttons with Dropdown Menu */}
              <div className="relative flex items-center gap-2">
                {(ai.jointRules.length > 0 || ai.errorRules.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearAllRules}
                    className="flex items-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                    title="Xóa toàn bộ quy tắc góc & lỗi sai trong form"
                  >
                    <Trash2 size={13} />
                    <span>Xóa hết quy tắc</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleAddSpecificJointRule()}
                  className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-md shadow-accent/20 transition-all"
                >
                  <Plus size={15} />
                  <span>Thêm quy tắc góc</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="flex items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 p-2 text-accent hover:bg-accent/20 cursor-pointer transition-colors"
                  title="Chọn loại quy tắc mẫu"
                >
                  <ChevronDown size={15} className={`transition-transform ${isAddMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu of Smart Rule Templates */}
                {isAddMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-surface p-2 shadow-2xl z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-text-secondary border-b border-border/60">
                      Chọn nhanh loại quy tắc sinh cơ học:
                    </div>
                    {SMART_RULE_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.tag}
                        type="button"
                        onClick={() => handleAddSpecificJointRule(tmpl)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-surface-elevated text-xs font-bold text-text-primary cursor-pointer transition-colors"
                      >
                        <span className="text-base">{tmpl.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{tmpl.name}</div>
                          <span className="text-[10px] text-text-secondary font-normal block truncate">
                            {tmpl.measurement} ({tmpl.condition === "LESS_THAN" ? "≤" : tmpl.condition === "GREATER_THAN" ? "≥" : "Trong khoảng"} {tmpl.targetValue}°)
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {ai.jointRules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center space-y-3">
                <Activity size={28} className="mx-auto text-accent/60" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-text-primary">Chưa có quy tắc góc khớp nào</h4>
                  <p className="text-[11px] text-text-secondary max-w-sm mx-auto">
                    Hãy bấm nút "Thêm quy tắc góc" hoặc chọn một Mẫu sinh cơ học ở đầu trang để bắt đầu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {ai.jointRules.map((rule, idx) => {
                  const isElbow = rule.measurement.includes("Elbow");
                  const isKnee = rule.measurement.includes("Knee");
                  const isSpine = rule.measurement.includes("Spine") || rule.measurement.includes("Hip");
                  const isShoulder = rule.measurement.includes("Shoulder");
                  const ruleIcon = isElbow ? "🦾" : isKnee ? "🦵" : isSpine ? "🦴" : isShoulder ? "📐" : "⚙️";

                  let ruleTypeName = "QUY TẮC TÙY CHỈNH";
                  if (rule.action === "REP_COUNT_TRIGGER") {
                    ruleTypeName = isKnee ? "ĐỘ SÂU ĐÁY REP (SQUAT DEPTH)" : "ĐỘ SÂU ĐÁY REP (BOTTOM DEPTH)";
                  } else if (rule.condition === "GREATER_THAN" && rule.targetValue >= 150) {
                    ruleTypeName = "KHÓA KHỚP ĐỈNH REP (LOCKOUT TOP)";
                  } else if (isSpine) {
                    ruleTypeName = "TRỤC THẲNG THÂN NGƯỜI (SPINE ALIGNMENT)";
                  } else if (isShoulder) {
                    ruleTypeName = "GÓC MỞ NÁCH & VAI (SHOULDER POSITION)";
                  }

                  return (
                    <div
                      key={rule.id}
                      className="group relative rounded-2xl border border-border/80 bg-background/80 p-4 md:p-5 space-y-4 hover:border-accent/40 transition-all shadow-xs"
                    >
                      {/* Card Top Banner with Smart Identification */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{ruleIcon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-accent/20 text-accent font-mono text-[10px] font-black">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                                {ruleTypeName}
                              </span>
                            </div>
                            <span className="text-[11px] text-text-secondary font-medium">
                              Đo lường: <strong className="text-text-primary">{rule.measurement}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Quick Presets within Card + Action Tools */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            rule.action === "REP_COUNT_TRIGGER"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : rule.action === "WARNING"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : rule.action === "CRITICAL_STOP"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                          }`}>
                            {rule.action === "REP_COUNT_TRIGGER" ? "🎯 TÍNH 1 REP" : rule.action === "FORM_CUE" ? "💡 NHẮC FORM" : rule.action === "WARNING" ? "⚠️ CẢNH BÁO" : "🛑 DỪNG"}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCloneJointRule(rule)}
                            className="rounded-lg p-1.5 text-text-secondary hover:text-accent hover:bg-accent/10 cursor-pointer transition-colors"
                            title="Nhân bản quy tắc này"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteJointRule(rule.id)}
                            className="rounded-lg p-1.5 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                            title="Xóa quy tắc này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Formula Visual Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-1 flex items-center">
                          <span className="rounded-lg bg-accent/15 px-2.5 py-1.5 font-mono text-[11px] font-black text-accent">
                            WHEN
                          </span>
                        </div>

                        {/* Measurement Joint */}
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">
                            Khớp đo lường (Joint)
                          </label>
                          <select
                            value={rule.measurement}
                            onChange={(e) => handleUpdateJointRule(rule.id, { measurement: e.target.value })}
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                          >
                            {PRESET_JOINT_MEASUREMENTS.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Condition Operator */}
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">
                            Điều kiện toán học
                          </label>
                          <select
                            value={rule.condition}
                            onChange={(e) => handleUpdateJointRule(rule.id, { condition: e.target.value as any })}
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                          >
                            <option value="LESS_THAN">Nhỏ hơn hoặc bằng (≤)</option>
                            <option value="GREATER_THAN">Lớn hơn hoặc bằng (≥)</option>
                            <option value="BETWEEN">Trong khoảng [Min - Max]</option>
                            <option value="OUTSIDE_RANGE">Ngoài khoảng (Lệch)</option>
                            <option value="STABLE">Ổn định cố định (Hold)</option>
                          </select>
                        </div>

                        {/* Target Degree */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">
                            Góc mục tiêu
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={rule.targetValue}
                              onChange={(e) => handleUpdateJointRule(rule.id, { targetValue: Number(e.target.value) })}
                              className="w-full rounded-xl border border-border bg-surface py-2 pl-3 pr-7 text-xs font-black text-accent text-center focus:border-accent focus:outline-none"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">
                              °
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-text-secondary uppercase mb-1 block">
                            Hành động AI
                          </label>
                          <select
                            value={rule.action}
                            onChange={(e) => handleUpdateJointRule(rule.id, { action: e.target.value as any })}
                            className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 text-xs font-bold text-text-primary focus:border-accent focus:outline-none"
                          >
                            <option value="REP_COUNT_TRIGGER">🎯 Tính 1 Rep</option>
                            <option value="FORM_CUE">💡 Nhắc form</option>
                            <option value="WARNING">⚠️ Cảnh báo</option>
                            <option value="CRITICAL_STOP">🛑 Dừng khẩn cấp</option>
                          </select>
                        </div>
                      </div>

                      {/* Vietnamese Voice Prompt Text + Auto Generate + Instant Audio Test */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                            <Volume2 size={13} className="text-accent" />
                            <span>Khẩu lệnh giọng nói AI phát ra tới học viên (TTS Prompt):</span>
                          </label>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleAutoSuggestVoicePrompt(rule)}
                              className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer transition-colors"
                              title="Tự động tạo câu khẩu lệnh dựa trên góc khớp"
                            >
                              <Sparkle size={11} />
                              <span>Gợi ý khẩu lệnh</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTestVoicePrompt(rule.id, rule.message)}
                              disabled={playingVoiceId === rule.id}
                              className="flex items-center gap-1 text-[11px] font-bold text-accent hover:text-accent-strong cursor-pointer disabled:opacity-50"
                            >
                              {playingVoiceId === rule.id ? (
                                <span className="animate-pulse">Đang phát...</span>
                              ) : (
                                <>
                                  <Play size={11} fill="currentColor" />
                                  <span>Nghe thử</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={rule.message}
                          onChange={(e) => handleUpdateJointRule(rule.id, { message: e.target.value })}
                          placeholder="e.g. Đạt chuẩn độ sâu tối thiểu! Đẩy lên dứt khoát."
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none font-medium"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: AI ERROR DETECTION RULES & LIVE PREVIEW */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 3A: ERROR RULES BUILDER */}
            <div className="lg:col-span-7 rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent text-xs font-black">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">
                      Quy tắc bắt lỗi form (AI Error Rules)
                    </h3>
                    <p className="text-[11px] text-text-secondary">
                      Nhận diện lỗi sai, phát âm thanh nhắc nhở hoặc phạt Không tính rep (No-Rep).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddErrorRule}
                  className="flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-surface-elevated cursor-pointer transition-colors"
                >
                  <Plus size={13} />
                  <span>Thêm lỗi AI</span>
                </button>
              </div>

              {ai.errorRules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-xs text-text-secondary">
                  Chưa có quy tắc bắt lỗi nào. Bấm "Thêm lỗi AI" để cấu hình.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {ai.errorRules.map((err) => (
                    <div
                      key={err.id}
                      className="rounded-2xl border border-border/80 bg-background p-4 space-y-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={err.severity}
                            onChange={(e) => handleUpdateErrorRule(err.id, { severity: e.target.value as any })}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border focus:outline-none ${
                              err.severity === "CRITICAL"
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                : err.severity === "WARNING"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                            }`}
                          >
                            <option value="CRITICAL">CRITICAL (Nghiêm trọng)</option>
                            <option value="WARNING">WARNING (Cảnh báo)</option>
                            <option value="INFO">INFO (Gợi ý)</option>
                          </select>

                          <input
                            type="text"
                            value={err.ruleName}
                            onChange={(e) => handleUpdateErrorRule(err.id, { ruleName: e.target.value })}
                            placeholder="Tên lỗi sai (e.g. Võng lưng, xòe khuỷu...)"
                            className="font-black text-xs text-text-primary bg-transparent focus:outline-none flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTestVoicePrompt(err.id, err.aiFeedback)}
                            disabled={playingVoiceId === err.id}
                            className="rounded-lg p-1 text-accent hover:bg-accent/10 cursor-pointer disabled:opacity-50"
                            title="Nghe thử giọng đọc lỗi"
                          >
                            <Volume2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteErrorRule(err.id)}
                            className="rounded-lg p-1 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-text-secondary block mb-0.5">
                            Câu AI thông báo tới học viên:
                          </label>
                          <input
                            type="text"
                            value={err.aiFeedback}
                            onChange={(e) => handleUpdateErrorRule(err.id, { aiFeedback: e.target.value })}
                            placeholder="e.g. Khuỷu tay xòe quá rộng! Hãy khép nách lại."
                            className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-text-secondary block mb-0.5">
                            Khẩu lệnh sửa lỗi tức thì (Correction Cue):
                          </label>
                          <input
                            type="text"
                            value={err.correctionCue}
                            onChange={(e) => handleUpdateErrorRule(err.id, { correctionCue: e.target.value })}
                            placeholder="e.g. Gồng chặt bụng và siết cơ mông liên tục."
                            className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3B: LIVE PREVIEW & AI COACHING SIMULATOR */}
            <div className="lg:col-span-5 rounded-3xl border border-border bg-surface p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent/15 text-accent text-xs font-black">
                  4
                </span>
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">
                    Mô phỏng Phản hồi AI (Live Preview)
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Giao diện hiển thị trực tiếp trên App Học viên khi tập.
                  </p>
                </div>
              </div>

              {/* Simulated Mobile Overlay Card */}
              <div className="rounded-3xl border border-border bg-gradient-to-b from-zinc-900 to-black p-5 text-white space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400">
                      AI VISION 99.8% ONLINE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">
                    30 FPS • 16ms
                  </span>
                </div>

                {/* Real-time Angle Meter Simulation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300">Elbow Angle (Góc khuỷu tay)</span>
                    <span className="font-mono font-black text-accent text-sm">88.5° (Chuẩn)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-accent w-[72%] transition-all" />
                  </div>
                </div>

                {/* Simulated AI Coach Cue Card */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>Cảnh báo Real-time</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                      Độ tin cậy: 95.4%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-100 font-bold">
                    "Khuỷu tay xòe quá rộng! Hãy khép nách góc 45 độ để bảo vệ khớp vai."
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    💡 Khẩu lệnh: Gồng chặt cơ bụng và siết cơ mông liên tục.
                  </p>
                </div>

                {/* Voice Speaker Waveform bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={13} className="text-accent" />
                    <span>Giọng đọc Viettel AI:</span>
                  </span>
                  <span className="font-bold text-white">Quỳnh Anh (Bắc - Nữ)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Disabled State */
        <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10 text-accent mx-auto">
            <Cpu size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-text-primary">Tính năng AI Motion Analysis đang tắt</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              Bật tính năng AI để cấu hình 33 MediaPipe keypoints, công thức toán học góc khớp, nhận diện lỗi sai và phát âm thanh hướng dẫn học viên theo thời gian thực.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleAiEnabled(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-xs font-black text-white hover:bg-accent-strong cursor-pointer shadow-md shadow-accent/20 transition-all"
          >
            <Sparkles size={14} />
            <span>Kích hoạt AI Motion Analysis ngay</span>
          </button>
        </div>
      )}
    </div>
  );
}
