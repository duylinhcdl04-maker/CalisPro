import { withLatency } from "./latency";

export interface UserFitnessDimension {
  id: string;
  name: string;
  score: number; // 0-100
  trend: number; // +/- points
  level: "Cơ bản" | "Khá" | "Tốt" | "Xuất sắc";
  benchmarkScore: number; // Lớp cùng cấp độ
  keyExercises: { name: string; record: string; note: string }[];
  description: string;
  color: string;
}

export interface AiExerciseFormFeedback {
  exerciseName: string;
  overallFormScore: number;
  romPercentage: number; // Range of motion
  stabilityScore: number;
  symmetryPercentage: number; // Left vs Right
  keyMetrics: { label: string; value: string; status: "optimal" | "warning" | "good" }[];
  aiNotes: string;
  recommendation: string;
}

export interface UserFitnessProfileData {
  user: {
    id: string;
    code: string;
    name: string;
    avatarUrl?: string;
    gender: "male" | "female";
    age: number;
    heightCm: number;
    weightKg: number;
    bmi: number;
    bmiCategory: string;
    bodyFatEstimatePercent: number;
    bmrKcal: number;
    level: {
      tier: number;
      title: string;
      currentXp: number;
      nextLevelXp: number;
    };
  };
  overallScore: number;
  previousScore: number;
  scoreTrend: number;
  percentileRanking: number; // Top X%
  lastAssessmentDate: string;
  nextAssessmentDueDays: number;
  
  readiness: {
    score: number; // 0-100
    energy: number; // 0-10
    recoveryHours: number;
    sleepScore: number;
    muscleSoreness: number; // 0-10
    advice: string;
  };

  dimensions: {
    strength: UserFitnessDimension;
    endurance: UserFitnessDimension;
    mobility: UserFitnessDimension;
    core: UserFitnessDimension;
    balance: UserFitnessDimension;
    skill: UserFitnessDimension;
  };

  muscleBalance: {
    pushPullRatio: number; // e.g. 1.05
    ratioStatus: "Cân bằng vàng" | "Ưu thế đẩy" | "Ưu thế kéo" | "Mất cân bằng";
    bilateralSymmetryPercent: number; // 97%
    muscleDistribution: { name: string; percentage: number; strengthTier: string }[];
    weakPointRecommendations: string[];
  };

  aiMotionAnalysis: {
    overallMotionScore: number;
    analyzedWorkoutsCount: number;
    exercises: AiExerciseFormFeedback[];
    recentAlerts: {
      type: "info" | "warning" | "success";
      title: string;
      description: string;
    }[];
  };

  scoreHistory: {
    period: string;
    overall: number;
    strength: number;
    endurance: number;
    mobility: number;
    core: number;
    balance: number;
    skill: number;
  }[];

  milestones: {
    id: string;
    title: string;
    date: string;
    category: string;
    achieved: boolean;
  }[];

  coachDirective: {
    coachName: string;
    coachTitle: string;
    avatarUrl?: string;
    comment: string;
    weeklyFocus: string[];
    nutritionAdvice: string;
    recommendedSleepHours: number;
  };
}

export const MOCK_USER_FITNESS_PROFILE: UserFitnessProfileData = {
  user: {
    id: "u-101",
    code: "HV-10294",
    name: "Nguyễn Minh",
    avatarUrl: undefined,
    gender: "male",
    age: 24,
    heightCm: 175,
    weightKg: 68,
    bmi: 22.2,
    bmiCategory: "Thể trạng chuẩn (Normal)",
    bodyFatEstimatePercent: 13.8,
    bmrKcal: 1690,
    level: {
      tier: 3,
      title: "Chiến binh (Warrior)",
      currentXp: 740,
      nextLevelXp: 1000,
    },
  },
  overallScore: 78,
  previousScore: 72,
  scoreTrend: 6.2,
  percentileRanking: 15, // Top 15%
  lastAssessmentDate: "20/09/2026",
  nextAssessmentDueDays: 14,

  readiness: {
    score: 88,
    energy: 8.5,
    recoveryHours: 24,
    sleepScore: 90,
    muscleSoreness: 2,
    advice: "Thể lực phục hồi xuất sắc! Thích hợp cho các bài tập bộc phát lực và rèn luyện kỹ năng mới hôm nay.",
  },

  dimensions: {
    strength: {
      id: "strength",
      name: "Sức mạnh (Strength)",
      score: 82,
      trend: 7.5,
      level: "Xuất sắc",
      benchmarkScore: 68,
      description: "Khả năng phát lực tối đa và kháng lực bản thân với trọng lượng cơ thể.",
      color: "#547EFF",
      keyExercises: [
        { name: "Pull-ups (Kéo xà đơn)", record: "14 reps", note: "Vượt 2 reps so với tháng trước" },
        { name: "Parallel Dips (Xà kép)", record: "22 reps", note: "Khóa khớp chuẩn ở đỉnh" },
        { name: "Weighted Push-ups", record: "+15kg x 8 reps", note: "Phát lực ngực bộc phát tốt" },
      ],
    },
    endurance: {
      id: "endurance",
      name: "Sức bền (Endurance)",
      score: 72,
      trend: 5.0,
      level: "Tốt",
      benchmarkScore: 65,
      description: "Dung lượng duy trì chuỗi chuyển động lặp lại và sức bền cơ bắp dưới áp lực.",
      color: "#34D399",
      keyExercises: [
        { name: "Max Push-ups in 2 min", record: "42 reps", note: "Nhịp thở đều đặn" },
        { name: "Dead Hang (Treo xà)", record: "95s", note: "Sức bám cẳng tay bền bỉ" },
        { name: "Bodyweight Squats", record: "65 reps", note: "Biên độ sâu ổn định" },
      ],
    },
    mobility: {
      id: "mobility",
      name: "Linh hoạt (Mobility)",
      score: 64,
      trend: 3.2,
      level: "Khá",
      benchmarkScore: 60,
      description: "Biên độ vận động khớp (ROM), độ mềm dẻo của vai, cổ tay và khớp háng.",
      color: "#F59E0B",
      keyExercises: [
        { name: "Shoulder Extension (Mở vai)", record: "58°", note: "Cần cải thiện để Handstand thẳng" },
        { name: "Wrist Extension (Cổ tay)", record: "85°", note: "Khá tốt cho Planche" },
        { name: "Pancake Stretch", record: "Cách sàn 12cm", note: "Đang tiến triển đều" },
      ],
    },
    core: {
      id: "core",
      name: "Cốt lõi (Core & Stability)",
      score: 80,
      trend: 8.0,
      level: "Xuất sắc",
      benchmarkScore: 70,
      description: "Độ vững chắc của cơ trọng tâm, khả năng kháng gập và truyền lực toàn thân.",
      color: "#8B5CF6",
      keyExercises: [
        { name: "Hollow Body Hold", record: "65s", note: "Lưng dưới áp chặt sàn 100%" },
        { name: "L-Sit on Floor", record: "16s", note: "Chân duỗi thẳng mũi chân đẹp" },
        { name: "Hanging Leg Raises", record: "15 reps", note: "Chân chạm xà kiểm soát" },
      ],
    },
    balance: {
      id: "balance",
      name: "Thăng bằng (Balance)",
      score: 62,
      trend: -1.0,
      level: "Khá",
      benchmarkScore: 58,
      description: "Khả năng kiểm soát trọng tâm cơ thể trong không gian đảo ngược và đơn chi.",
      color: "#EC4899",
      keyExercises: [
        { name: "Freestanding Handstand", record: "8s", note: "Cần siết mông và điều chỉnh ngón tay" },
        { name: "Crow Pose (Tư thế con quạ)", record: "35s", note: "Vững vàng" },
        { name: "Pistol Squat (Mỗi bên)", record: "8 reps", note: "Chân trái hơi rung lắc" },
      ],
    },
    skill: {
      id: "skill",
      name: "Kỹ năng (Calis Skills)",
      score: 58,
      trend: 9.5,
      level: "Khá",
      benchmarkScore: 50,
      description: "Làm chủ các động tác Calisthenics nâng cao (Muscle-up, Lever, Planche).",
      color: "#06B6D4",
      keyExercises: [
        { name: "Bar Muscle-up", record: "1 rep (Strict)", note: "Chuyển tiếp qua thanh xà mượt" },
        { name: "Tuck Front Lever", record: "12s", note: "Lưng song song mặt đất" },
        { name: "Planche Lean", record: "20s (Góc 65°)", note: "Khóa cùi chỏ chắc chắn" },
      ],
    },
  },

  muscleBalance: {
    pushPullRatio: 1.04,
    ratioStatus: "Cân bằng vàng",
    bilateralSymmetryPercent: 97,
    muscleDistribution: [
      { name: "Lưng xô (Lats & Upper Back)", percentage: 28, strengthTier: "Rất mạnh" },
      { name: "Ngực (Pectorals)", percentage: 24, strengthTier: "Mạnh" },
      { name: "Cơ trọng tâm (Core/Abs)", percentage: 20, strengthTier: "Mạnh" },
      { name: "Vai (Deltoids)", percentage: 16, strengthTier: "Cân bằng" },
      { name: "Tay sau (Triceps)", percentage: 12, strengthTier: "Cân bằng" },
    ],
    weakPointRecommendations: [
      "Khớp vai sau (Rear Deltoid) cần được kích hoạt thêm bằng Face Pulls hoặc Band Pull-aparts.",
      "Cẳng tay trái chịu lực kém hơn tay phải ~3% trong bài giữ Dead Hang.",
      "Độ dẻo bắp chuối và gân kheo chân trái cần thêm bài ép dẻo sau mỗi buổi Squat.",
    ],
  },

  aiMotionAnalysis: {
    overallMotionScore: 89,
    analyzedWorkoutsCount: 18,
    exercises: [
      {
        exerciseName: "Pull-up (Hít xà đơn)",
        overallFormScore: 92,
        romPercentage: 98,
        stabilityScore: 94,
        symmetryPercentage: 97,
        keyMetrics: [
          { label: "Cằm vượt xà", value: "Đạt 100%", status: "optimal" },
          { label: "Duỗi tay chân đáy", value: "172° (Rất chuẩn)", status: "optimal" },
          { label: "Độ lắc thân người", value: "< 2° (Không đung đưa)", status: "optimal" },
          { label: "Kích hoạt bả vai", value: "Chủ động tốt", status: "good" },
        ],
        aiNotes: "Chuyển động mượt mà, đường kéo vuông góc hoàn hảo với mặt phẳng trọng lực.",
        recommendation: "Có thể chuyển sang tập Pull-up đeo tạ (+5kg) để kích thích ngưỡng phát triển mới.",
      },
      {
        exerciseName: "Push-up (Hít đất)",
        overallFormScore: 95,
        romPercentage: 100,
        stabilityScore: 96,
        symmetryPercentage: 99,
        keyMetrics: [
          { label: "Góc cùi chỏ", value: "45° (Bảo vệ vai)", status: "optimal" },
          { label: "Độ thẳng cột sống", value: "180° (Chuẩn plank)", status: "optimal" },
          { label: "Độ sâu hạ ngực", value: "Cách sàn 2cm", status: "optimal" },
          { label: "Tốc độ kiểm soát (Eccentric)", value: "2.1s (Rất tốt)", status: "good" },
        ],
        aiNotes: "Kỹ thuật đạt chuẩn biểu mẫu Calisthenics thi đấu quốc tế.",
        recommendation: "Thử sức với Archer Push-up hoặc Decline Push-up để nâng độ khó.",
      },
      {
        exerciseName: "Parallel Bar Dips (Xà kép)",
        overallFormScore: 88,
        romPercentage: 94,
        stabilityScore: 88,
        symmetryPercentage: 95,
        keyMetrics: [
          { label: "Góc hạ cùi chỏ", value: "90° (Chuẩn an toàn)", status: "optimal" },
          { label: "Độ nghiêng thân trên", value: "15° (Ăn vào ngực dưới)", status: "good" },
          { label: "Vị trí bả vai", value: "Hơi nhô nhẹ ở rep cuối", status: "warning" },
        ],
        aiNotes: "Độ sâu rất tốt, cần chú ý ghì chặt bả vai (Depression) ở 2 rep cuối cùng của hiệp.",
        recommendation: "Thêm bài Scapular Dips 3 sets x 10 reps để củng cố sức mạnh bả vai dưới.",
      },
    ],
    recentAlerts: [
      {
        type: "success",
        title: "Kỹ thuật Kéo xà đạt chuẩn cấp độ Pro",
        description: "AI nhận diện độ ổn định thân người tăng 18% so với tuần trước, không còn hiện tượng giật hông.",
      },
      {
        type: "warning",
        title: "Cảnh báo áp lực cổ tay",
        description: "Góc gập cổ tay khi tập Handstand trên sàn phẳng đang ở mức 92°. Khuyên dùng Parallettes để giảm áp lực.",
      },
    ],
  },

  scoreHistory: [
    { period: "T4/2026", overall: 58, strength: 60, endurance: 54, mobility: 52, core: 62, balance: 50, skill: 42 },
    { period: "T5/2026", overall: 63, strength: 66, endurance: 58, mobility: 55, core: 68, balance: 52, skill: 45 },
    { period: "T6/2026", overall: 67, strength: 71, endurance: 63, mobility: 57, core: 72, balance: 55, skill: 48 },
    { period: "T7/2026", overall: 70, strength: 75, endurance: 66, mobility: 59, core: 75, balance: 56, skill: 50 },
    { period: "T8/2026", overall: 74, strength: 78, endurance: 69, mobility: 62, core: 78, balance: 60, skill: 54 },
    { period: "T9/2026", overall: 78, strength: 82, endurance: 72, mobility: 64, core: 80, balance: 62, skill: 58 },
  ],

  milestones: [
    { id: "m1", title: "Vượt mốc 10 Pull-ups chuẩn form", date: "15/07/2026", category: "Sức mạnh", achieved: true },
    { id: "m2", title: "Giữ L-Sit trên sàn > 15 giây", date: "02/08/2026", category: "Core", achieved: true },
    { id: "m3", title: "Chinh phục Level 3 - Chiến binh", date: "20/08/2026", category: "Cấp độ", achieved: true },
    { id: "m4", title: "Thực hiện thành công 1 Bar Muscle-up", date: "14/09/2026", category: "Kỹ năng", achieved: true },
    { id: "m5", title: "Handstand tự do giữ thăng bằng > 15s", date: "Đang thực hiện", category: "Thăng bằng", achieved: false },
    { id: "m6", title: "Tuck Planche giữ tĩnh 5 giây", date: "Mục tiêu Q4", category: "Kỹ năng cao cấp", achieved: false },
  ],

  coachDirective: {
    coachName: "Hoàng Tuấn",
    coachTitle: "Senior Calisthenics Master Coach",
    avatarUrl: undefined,
    comment:
      "Chào Minh! Thể chất của em trong tháng vừa qua tiến bộ cực kỳ ấn tượng, đặc biệt là sức mạnh kéo xà và sức bền cơ bụng. Kỹ thuật Pull-up đã rất mượt mà. Trong 3 tuần tới, thầy muốn em dồn thêm 15% thời lượng cho phần Mobility khớp vai và giữ thăng bằng Handstand để chuẩn bị bứt phá lên cấp độ Level 4!",
    weeklyFocus: [
      "Ưu tiên 2 buổi giãn cơ vai và mở háng sau buổi tập chính",
      "Tập Handstand với bục Parallettes 10 phút mỗi ngày",
      "Duy trì khối lượng hít đất và kéo xà hiện tại",
    ],
    nutritionAdvice:
      "Duy trì lượng đạm 1.8 - 2.0g/kg (~130g Protein/ngày). Uống đủ 2.5 lít nước và bổ sung thêm chuối hoặc khoáng sau các buổi tập kỹ năng nặng.",
    recommendedSleepHours: 8,
  },
};

export const userFitnessService = {
  async getUserFitnessProfile(): Promise<UserFitnessProfileData> {
    await withLatency(null, 400);
    return MOCK_USER_FITNESS_PROFILE;
  },
};
