import { Assessment, FitnessLevel, AssessmentSchedule } from '../types';

export const DEFAULT_FITNESS_LEVELS: FitnessLevel[] = [
  {
    id: 'lvl-beginner',
    code: 'BEGINNER',
    name: 'Beginner (Người mới bắt đầu)',
    minScore: 0,
    maxScore: 39,
    description: 'Nền tảng thể lực ở mức cơ bản, cần tập trung củng cố chuyển động nguyên bản (Movement Fundamentals) và xây dựng sức bền cơ sở.',
    recommendation: 'Ưu tiên giáo án Calisthenics Foundation (Incline Push-ups, Australian Pull-ups, Knee Planks, Air Squats), tập trung vào độ chuẩn của form và biên độ chuyển động an toàn.',
    colorScheme: 'emerald',
    badgeLabel: 'Cấp độ 1 • Khởi động',
  },
  {
    id: 'lvl-intermediate',
    code: 'INTERMEDIATE',
    name: 'Intermediate (Trung cấp)',
    minScore: 40,
    maxScore: 69,
    description: 'Đã có nền tảng thể lực ổn định, làm chủ tốt các bài tập thể trọng chuẩn (Standard Push-ups, Strict Pull-ups, Dips, Leg Raises).',
    recommendation: 'Tập trung tăng thể tích bài tập (Volume), rèn luyện sức bền tốc độ và bắt đầu làm quen với các kỹ thuật Progression cho kỹ năng nâng cao (L-sit, Handstand against wall, Muscle-up transition).',
    colorScheme: 'green',
    badgeLabel: 'Cấp độ 2 • Phát triển',
  },
  {
    id: 'lvl-advanced',
    code: 'ADVANCED',
    name: 'Advanced (Nâng cao)',
    minScore: 70,
    maxScore: 84,
    description: 'Sức mạnh và độ kiểm soát cơ thể xuất sắc, thực hiện thành thạo các biến thể nặng và có khả năng chịu tải tốt.',
    recommendation: 'Chuyển trọng tâm sang chinh phục các bài tập tĩnh (Isometric Holds: Front Lever, Planche, Back Lever) kết hợp tập tạ trọng lượng bổ sung (Weighted Calisthenics).',
    colorScheme: 'purple',
    badgeLabel: 'Cấp độ 3 • Đột phá',
  },
  {
    id: 'lvl-elite',
    code: 'ELITE',
    name: 'Elite (Bậc thầy / Vận động viên)',
    minScore: 85,
    maxScore: 100,
    description: 'Trình độ thể lực đỉnh cao, hoàn thiện trọn vẹn cả 6 chiều đo thể chất: Sức mạnh, Sức bền, Linh hoạt, Core, Kỹ năng và Kiểm soát không gian.',
    recommendation: 'Giáo án cá nhân hóa chuyên sâu, tập trung vào tối ưu hóa hiệu suất thi đấu, tổ hợp Combo nâng cao và duy trì thể trạng không chấn thương.',
    colorScheme: 'amber',
    badgeLabel: 'Cấp độ 4 • Tinh hoa',
  },
];

export const DEFAULT_SCHEDULE: AssessmentSchedule = {
  enabled: true,
  triggerTypes: ['TIME_BASED', 'DYNAMIC_LEVEL', 'WORKOUT_BASED'],
  triggerLogic: 'OR',
  timeFrequency: {
    value: 4,
    unit: 'WEEKS',
  },
  dynamicRules: [
    { levelCode: 'BEGINNER', levelName: 'Beginner', intervalValue: 4, intervalUnit: 'WEEKS' },
    { levelCode: 'INTERMEDIATE', levelName: 'Intermediate', intervalValue: 6, intervalUnit: 'WEEKS' },
    { levelCode: 'ADVANCED', levelName: 'Advanced', intervalValue: 8, intervalUnit: 'WEEKS' },
    { levelCode: 'ELITE', levelName: 'Elite', intervalValue: 12, intervalUnit: 'WEEKS' },
  ],
  workoutTrigger: {
    enabled: true,
    requiredWorkoutsCount: 20,
  },
  gracePeriodDays: 7,
  reminders: [
    {
      id: 'rem-1',
      timing: '7_DAYS_BEFORE',
      timingLabel: '7 ngày trước ngày đánh giá lại',
      enabled: true,
      channels: ['IN_APP', 'EMAIL'],
      customMessage: 'Đã gần đến thời điểm kiểm tra thể lực định kỳ 4 tuần của bạn trên CalisHealth!',
    },
    {
      id: 'rem-2',
      timing: '3_DAYS_BEFORE',
      timingLabel: '3 ngày trước ngày đánh giá lại',
      enabled: true,
      channels: ['IN_APP', 'PUSH'],
      customMessage: 'Chỉ còn 3 ngày nữa đến buổi Test Thể Lực. Hãy ngủ đủ giấc và sẵn sàng nhé!',
    },
    {
      id: 'rem-3',
      timing: 'ON_DUE_DATE',
      timingLabel: 'Vào đúng ngày đến hạn',
      enabled: true,
      channels: ['IN_APP', 'EMAIL', 'PUSH'],
      customMessage: 'Bài test Đánh giá Thể lực định kỳ đã sẵn sàng! Hãy bắt đầu ngay để cập nhật lộ trình mới.',
    },
    {
      id: 'rem-4',
      timing: '3_DAYS_AFTER',
      timingLabel: '3 ngày sau khi đến hạn (nếu chưa làm)',
      enabled: true,
      channels: ['IN_APP', 'PUSH'],
      customMessage: 'Bạn có bài test thể lực chưa hoàn thành trong thời gian gia hạn (Grace Period).',
    },
  ],
};

export const INITIAL_ASSESSMENT_FORM_VALUES: Partial<Assessment> = {
  name: 'Initial Fitness Assessment',
  displayName: 'Đánh giá Thể lực & Sức khỏe Toàn diện Ban đầu',
  description: 'Bộ 12 câu hỏi chuẩn khoa học thể thao kiểm tra 6 chiều đo thể chất: Sức mạnh thân trên, thân dưới, độ ổn định Core, sức bền cơ bắp, độ linh hoạt khớp và kỹ năng Calisthenics ban đầu.',
  type: 'INITIAL',
  estimatedDuration: 10,
  tags: ['Onboarding', 'Scientific Fitness', 'Benchmark', 'Calisthenics Level'],
  status: 'DRAFT',
  targetAudience: {
    fitnessLevels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    goals: ['GENERAL_FITNESS', 'STRENGTH', 'MUSCLE_BUILDING', 'SKILL', 'MOBILITY'],
  },
  fitnessLevels: DEFAULT_FITNESS_LEVELS,
  schedule: DEFAULT_SCHEDULE,
  questions: [],
  scoringConfig: {
    maxTotalScore: 100,
    questionScoring: [],
  },
};
