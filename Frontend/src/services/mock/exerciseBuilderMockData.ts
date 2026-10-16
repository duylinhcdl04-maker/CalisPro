import { ExerciseFormData, MediaPipeLandmark } from "../../types/exerciseBuilder";

export const MEDIAPIPE_33_LANDMARKS: MediaPipeLandmark[] = [
  { id: 0, name: "Nose", vietnameseName: "Mũi", bodyPart: "face", enabled: true },
  { id: 1, name: "Left Eye Inner", vietnameseName: "Mắt trái trong", bodyPart: "face", enabled: false },
  { id: 2, name: "Left Eye", vietnameseName: "Mắt trái", bodyPart: "face", enabled: false },
  { id: 3, name: "Left Eye Outer", vietnameseName: "Mắt trái ngoài", bodyPart: "face", enabled: false },
  { id: 4, name: "Right Eye Inner", vietnameseName: "Mắt phải trong", bodyPart: "face", enabled: false },
  { id: 5, name: "Right Eye", vietnameseName: "Mắt phải", bodyPart: "face", enabled: false },
  { id: 6, name: "Right Eye Outer", vietnameseName: "Mắt phải ngoài", bodyPart: "face", enabled: false },
  { id: 7, name: "Left Ear", vietnameseName: "Tai trái", bodyPart: "face", enabled: false },
  { id: 8, name: "Right Ear", vietnameseName: "Tai phải", bodyPart: "face", enabled: false },
  { id: 9, name: "Mouth Left", vietnameseName: "Miệng trái", bodyPart: "face", enabled: false },
  { id: 10, name: "Mouth Right", vietnameseName: "Miệng phải", bodyPart: "face", enabled: false },
  { id: 11, name: "Left Shoulder", vietnameseName: "Khớp vai trái", bodyPart: "upper_body", enabled: true },
  { id: 12, name: "Right Shoulder", vietnameseName: "Khớp vai phải", bodyPart: "upper_body", enabled: true },
  { id: 13, name: "Left Elbow", vietnameseName: "Khớp khuỷu tay trái", bodyPart: "upper_body", enabled: true },
  { id: 14, name: "Right Elbow", vietnameseName: "Khớp khuỷu tay phải", bodyPart: "upper_body", enabled: true },
  { id: 15, name: "Left Wrist", vietnameseName: "Khớp cổ tay trái", bodyPart: "upper_body", enabled: true },
  { id: 16, name: "Right Wrist", vietnameseName: "Khớp cổ tay phải", bodyPart: "upper_body", enabled: true },
  { id: 17, name: "Left Pinky", vietnameseName: "Ngón út trái", bodyPart: "upper_body", enabled: false },
  { id: 18, name: "Right Pinky", vietnameseName: "Ngón út phải", bodyPart: "upper_body", enabled: false },
  { id: 19, name: "Left Index", vietnameseName: "Ngón trỏ trái", bodyPart: "upper_body", enabled: false },
  { id: 20, name: "Right Index", vietnameseName: "Ngón trỏ phải", bodyPart: "upper_body", enabled: false },
  { id: 21, name: "Left Thumb", vietnameseName: "Ngón cái trái", bodyPart: "upper_body", enabled: false },
  { id: 22, name: "Right Thumb", vietnameseName: "Ngón cái phải", bodyPart: "upper_body", enabled: false },
  { id: 23, name: "Left Hip", vietnameseName: "Khớp hông trái", bodyPart: "core", enabled: true },
  { id: 24, name: "Right Hip", vietnameseName: "Khớp hông phải", bodyPart: "core", enabled: true },
  { id: 25, name: "Left Knee", vietnameseName: "Khớp gối trái", bodyPart: "lower_body", enabled: true },
  { id: 26, name: "Right Knee", vietnameseName: "Khớp gối phải", bodyPart: "lower_body", enabled: true },
  { id: 27, name: "Left Ankle", vietnameseName: "Khớp cổ chân trái", bodyPart: "lower_body", enabled: true },
  { id: 28, name: "Right Ankle", vietnameseName: "Khớp cổ chân phải", bodyPart: "lower_body", enabled: true },
  { id: 29, name: "Left Heel", vietnameseName: "Gót chân trái", bodyPart: "lower_body", enabled: false },
  { id: 30, name: "Right Heel", vietnameseName: "Gót chân phải", bodyPart: "lower_body", enabled: false },
  { id: 31, name: "Left Foot Index", vietnameseName: "Mũi chân trái", bodyPart: "lower_body", enabled: false },
  { id: 32, name: "Right Foot Index", vietnameseName: "Mũi chân phải", bodyPart: "lower_body", enabled: false },
];

export const DEFAULT_PUSH_UP_BUILDER_DATA: ExerciseFormData = {
  id: "ex-push-up",
  name: "Standard Push Up",
  vietnameseName: "Hít đất chuẩn Calisthenics",
  category: "Strength",
  difficulty: "Beginner",
  movementPattern: "Horizontal Push",
  equipment: ["No Equipment"],
  shortDescription: "Động tác nền tảng xây dựng sức mạnh thân trên toàn diện, kích hoạt ngực, tay sau và cơ lõi ổn định.",
  tags: ["Push", "Upper Body", "Chest", "Triceps", "Core", "Bodyweight"],
  
  videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-athlete-doing-push-ups-in-a-gym-42686-large.mp4",
  thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
  animationUrl: "",
  
  phases: [
    {
      id: "phase-1",
      order: 1,
      name: "01 Setup",
      vietnameseName: "Tư thế chuẩn bị (High Plank)",
      description: "Đặt 2 bàn tay rộng hơn vai một chút, các ngón tay bám chắc sàn. Thân người tạo thành một đường thẳng từ gót chân lên đến đỉnh đầu.",
      keyCue: "Gồng chắc cơ bụng (Hollow Body) và siết chặt mông.",
      breathing: "Hold / Braced",
      muscleFocus: "Core & Serratus Anterior"
    },
    {
      id: "phase-2",
      order: 2,
      name: "02 Eccentric",
      vietnameseName: "Pha hạ người kiểm soát",
      description: "Gập khuỷu tay góc 45 độ so với thân, từ từ hạ ngực xuống cách sàn khoảng 3-5cm trong vòng 2-3 giây.",
      keyCue: "Khuỷu tay khép 45 độ, không bẹt sang hai bên.",
      breathing: "Inhale",
      muscleFocus: "Pectoralis Major & Anterior Deltoids"
    },
    {
      id: "phase-3",
      order: 3,
      name: "03 Bottom Position",
      vietnameseName: "Điểm đáy biên độ",
      description: "Ngực chạm nhẹ sàn hoặc dừng cách mặt đất 3cm, duy trì độ căng cơ tối đa mà không để võng lưng.",
      keyCue: "Dừng 0.5s cảm nhận ngực căng dãn hoàn toàn.",
      breathing: "Hold / Braced",
      muscleFocus: "Pectoralis Major"
    },
    {
      id: "phase-4",
      order: 4,
      name: "04 Concentric",
      vietnameseName: "Pha đẩy người bùng nổ",
      description: "Dùng lực từ ngực và cơ tam đầu đẩy mạnh sàn ra xa, đưa cơ thể trở lại vị trí ban đầu.",
      keyCue: "Đẩy sàn ra xa, mở rộng khớp bả vai ở đỉnh động tác.",
      breathing: "Exhale",
      muscleFocus: "Triceps & Chest"
    },
    {
      id: "phase-5",
      order: 5,
      name: "05 Finish & Protraction",
      vietnameseName: "Khóa đỉnh và vươn bả vai (Scapular Protraction)",
      description: "Duỗi thẳng tay có kiểm soát, đẩy xương bả vai cong nhẹ ra ngoài để bảo vệ khớp vai.",
      keyCue: "Đẩy căng bả vai (Protraction), không khóa khớp cùi chỏ quá mạnh.",
      breathing: "Exhale",
      muscleFocus: "Serratus Anterior"
    }
  ],

  muscles: [
    { id: "m-chest", name: "Pectoralis Major", vietnameseName: "Cơ ngực lớn", role: "primary", activationLevel: "High", bodyRegion: "chest" },
    { id: "m-triceps", name: "Triceps Brachii", vietnameseName: "Cơ tam đầu (tay sau)", role: "secondary", activationLevel: "High", bodyRegion: "arms" },
    { id: "m-deltoids", name: "Anterior Deltoids", vietnameseName: "Cơ vai trước", role: "secondary", activationLevel: "Moderate", bodyRegion: "shoulders" },
    { id: "m-core", name: "Core & Rectus Abdominis", vietnameseName: "Cơ bụng & cơ lõi", role: "stabilizer", activationLevel: "Moderate", bodyRegion: "core" },
    { id: "m-serratus", name: "Serratus Anterior", vietnameseName: "Cơ răng cưa bả vai", role: "stabilizer", activationLevel: "Moderate", bodyRegion: "chest" },
  ],

  sensations: [
    {
      muscleName: "Cơ ngực (Chest)",
      expectedSensation: "Cảm giác căng dãn rõ rệt ở đáy và co rút ép chặt khi đẩy lên đỉnh.",
      intensity: "Strong",
      normalSensations: ["Căng dãn cơ ngực", "Bơm máu (Muscle Pump)", "Mỏi cơ lành mạnh"],
      unexpectedSensations: ["Đau nhói khớp vai trước", "Cổ tay bị chèn ép đau nhức"]
    },
    {
      muscleName: "Cơ tay sau (Triceps)",
      expectedSensation: "Cơ nóng rực và căng cứng ở 1/3 cuối hành trình đẩy khóa khớp.",
      intensity: "Moderate",
      normalSensations: ["Mỏi tay sau", "Cơ co thắt mạnh"],
      unexpectedSensations: ["Đau khớp cùi chỏ"]
    }
  ],

  setupInstruction: "Đặt 2 bàn tay mở rộng ngang ngực hoặc rộng hơn vai 1 gang tay. Mũi chân chống vững, gót chân hướng lên trần. Khóa chặt cơ bụng và xương chậu.",
  executionInstruction: "Hít sâu bằng mũi, hạ người có kiểm soát sao cho ngực chạm gần mặt sàn. Thở mạnh bằng miệng và đẩy dứt khoát đưa thân người lên thẳng.",
  inhaleTiming: "Hít vào từ từ trong quá trình hạ thân người xuống (Eccentric Phase).",
  exhaleTiming: "Thở mạnh ra khi bắt đầu dùng lực đẩy ngược người lên (Concentric Phase).",
  tempoFormat: "2 - 1 - 1 - 0",
  
  coachingCues: [
    { id: "cue-1", text: "Siết chặt cơ mông và cơ bụng như đang chuẩn bị chịu một cú đấm.", type: "alignment" },
    { id: "cue-2", text: "Kẹp khuỷu tay tạo thành hình mũi tên chữ A (45 độ), không bẹt chữ T.", type: "safety" },
    { id: "cue-3", text: "Tưởng tượng bạn đang đẩy cả quả đất ra xa khỏi ngực.", type: "positive" },
    { id: "cue-4", text: "Giữ đầu thẳng, mắt nhìn chếch phía trước sàn 20-30cm.", type: "alignment" },
  ],

  commonMistakes: [
    {
      id: "mistake-1",
      name: "Võng lưng & sụp hông (Hip Sagging)",
      problem: "Hông bị sà xuống thấp hơn đường thẳng trục cơ thể, gây áp lực lên đốt sống thắt lưng L4-L5.",
      whyItHappens: "Cơ lõi (Core) yếu hoặc mất tập trung khi thể lực suy giảm ở những rep cuối.",
      correction: "Gồng cứng cơ bụng, xoay nhẹ xương chậu ra sau (Posterior Pelvic Tilt) và siết mông liên tục.",
      severity: "High"
    },
    {
      id: "mistake-2",
      name: "Khuỷu tay xòe ngang 90 độ (Elbow Flaring)",
      problem: "Cùi chỏ bẹt vuông góc sang 2 bên tạo áp lực xé rách bao khớp vai.",
      whyItHappens: "Bàn tay đặt quá cao so với tầm ngực hoặc thói quen sai từ trước.",
      correction: "Kéo bàn tay lùi xuống ngang ngực dưới, hướng khuỷu tay chéo về phía sau góc 45 độ.",
      severity: "High"
    },
    {
      id: "mistake-3",
      name: "Chưa đủ biên độ (Half Reps / Dập đầu)",
      problem: "Chỉ gật đầu xuống sàn trong khi ngực vẫn ở trên cao cách mặt đất hơn 15cm.",
      whyItHappens: "Ham số lượng reps hoặc cơ ngực chưa đủ khỏe.",
      correction: "Hạ toàn bộ thân người phẳng xuống đến khi ngực cách sàn 3cm trước khi đẩy lên.",
      severity: "Medium"
    }
  ],

  safetyGuidance: {
    contraindications: "Người đang có chấn thương viêm gân chóp xoay vai cấp tính hoặc hội chứng ống cổ tay nặng cần chuyển sang biến thể chống tay lên tường (Incline Push Up).",
    safetyCues: [
      "Luôn khởi động khớp cổ tay và xoay khớp vai tối thiểu 5 phút trước khi tập.",
      "Thực hiện trong biên độ kiểm soát không gây đau nhức khớp."
    ],
    stopConditions: [
      "Dừng ngay lập tức nếu xuất hiện cơn đau nhói bất thường ở vai trước hoặc cùi chỏ.",
      "Dừng set tập khi form bị gãy hoàn toàn không thể duy trì đường thẳng cơ thể."
    ]
  },

  aiRules: {
    enabled: true,
    landmarks: MEDIAPIPE_33_LANDMARKS,
    jointRules: [],
    romRules: [],
    tempoRule: {
      eccentricSec: 2,
      pauseBottomSec: 0,
      concentricSec: 1,
      pauseTopSec: 0,
      toleranceSec: 0.5,
    },
    errorDetectionRules: [],
  },

  status: "PUBLISHED",
  version: "1.0",
  updatedAt: "Vừa cập nhật",
  createdAt: "2026-09-28"
};

export const BLANK_EXERCISE_BUILDER_TEMPLATE: ExerciseFormData = {
  name: "",
  vietnameseName: "",
  category: "Strength",
  difficulty: "Beginner",
  movementPattern: "Horizontal Push",
  equipment: ["No Equipment"],
  shortDescription: "",
  tags: [],
  
  videoUrl: "",
  thumbnailUrl: "",
  animationUrl: "",
  phases: [
    {
      id: "phase-init-1",
      order: 1,
      name: "01 Setup",
      vietnameseName: "Tư thế chuẩn bị",
      description: "",
      keyCue: "",
      breathing: "Natural",
      muscleFocus: ""
    },
    {
      id: "phase-init-2",
      order: 2,
      name: "02 Execution",
      vietnameseName: "Pha thực hiện chính",
      description: "",
      keyCue: "",
      breathing: "Inhale",
      muscleFocus: ""
    },
    {
      id: "phase-init-3",
      order: 3,
      name: "03 Finish",
      vietnameseName: "Kết thúc rep & Khóa vị trí",
      description: "",
      keyCue: "",
      breathing: "Exhale",
      muscleFocus: ""
    }
  ],

  muscles: [],
  sensations: [],

  setupInstruction: "",
  executionInstruction: "",
  inhaleTiming: "",
  exhaleTiming: "",
  tempoFormat: "2 - 0 - 1 - 0",
  
  coachingCues: [],
  commonMistakes: [],

  safetyGuidance: {
    contraindications: "",
    safetyCues: [],
    stopConditions: []
  },

  aiRules: {
    enabled: true,
    landmarks: MEDIAPIPE_33_LANDMARKS,
    jointRules: [],
    romRules: [],
    tempoRule: {
      eccentricSec: 2,
      pauseBottomSec: 0,
      concentricSec: 1,
      pauseTopSec: 0,
      toleranceSec: 0.5
    },
    errorDetectionRules: []
  },

  status: "DRAFT",
  version: "1.0",
  updatedAt: "Chưa lưu",
  createdAt: "2026-09-28"
};
