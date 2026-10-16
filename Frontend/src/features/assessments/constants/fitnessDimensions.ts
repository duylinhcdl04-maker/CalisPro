import { FitnessDimension } from '../types';

export interface FitnessDimensionConfig {
  key: FitnessDimension;
  label: string;
  shortLabel: string;
  category: 'STRENGTH' | 'ENDURANCE' | 'MOBILITY' | 'CONTROL' | 'HABIT';
  color: string;
  iconName: string;
  description: string;
}

export const FITNESS_DIMENSION_CONFIGS: Record<FitnessDimension, FitnessDimensionConfig> = {
  UPPER_BODY_STRENGTH: {
    key: 'UPPER_BODY_STRENGTH',
    label: 'Sức mạnh Thân trên (Upper Push / Pull)',
    shortLabel: 'Thân trên',
    category: 'STRENGTH',
    color: '#7C9B5B',
    iconName: 'Dumbbell',
    description: 'Khả năng sinh lực của cơ ngực, vai, tay sau, lưng xô và tay trước qua các bài đẩy/kéo Calisthenics.',
  },
  LOWER_BODY_STRENGTH: {
    key: 'LOWER_BODY_STRENGTH',
    label: 'Sức mạnh Thân dưới (Legs & Glutes)',
    shortLabel: 'Thân dưới',
    category: 'STRENGTH',
    color: '#557D9A',
    iconName: 'Footprints',
    description: 'Sức mạnh bộc phát và khả năng kiểm soát đùi trước, đùi sau, mông và bắp chân.',
  },
  CORE_STABILITY: {
    key: 'CORE_STABILITY',
    label: 'Độ ổn định Cơ trung tâm (Core & Hollow Body)',
    shortLabel: 'Cơ Core',
    category: 'CONTROL',
    color: '#4F8A65',
    iconName: 'Shield',
    description: 'Sức mạnh giữ trục cột sống thẳng, kiểm soát cơ bụng, cơ lưng dưới và khung chậu vững vàng.',
  },
  MUSCULAR_ENDURANCE: {
    key: 'MUSCULAR_ENDURANCE',
    label: 'Sức bền Cơ bắp (Muscular Endurance)',
    shortLabel: 'Sức bền cơ',
    category: 'ENDURANCE',
    color: '#C48A3A',
    iconName: 'Flame',
    description: 'Khả năng duy trì co duỗi cơ bắp lặp đi lặp lại nhiều lần trước khi chạm ngưỡng kiệt sức.',
  },
  CARDIO_ENDURANCE: {
    key: 'CARDIO_ENDURANCE',
    label: 'Sức bền Tim mạch (Cardiorespiratory)',
    shortLabel: 'Tim mạch',
    category: 'ENDURANCE',
    color: '#C45F5F',
    iconName: 'HeartPulse',
    description: 'Khả năng cung cấp oxy của hệ tuần hoàn trong suốt các chuỗi động tác cường độ cao.',
  },
  SHOULDER_MOBILITY: {
    key: 'SHOULDER_MOBILITY',
    label: 'Độ linh hoạt Khớp vai (Shoulder Mobility)',
    shortLabel: 'Khớp vai',
    category: 'MOBILITY',
    color: '#8A5FB2',
    iconName: 'RotateCw',
    description: 'Biên độ xoay mở khớp vai tối đa khi thực hiện Handstand, Pull-up và Dip an toàn.',
  },
  HIP_MOBILITY: {
    key: 'HIP_MOBILITY',
    label: 'Độ linh hoạt Khớp hông (Hip & Hamstring)',
    shortLabel: 'Khớp hông',
    category: 'MOBILITY',
    color: '#557D9A',
    iconName: 'Activity',
    description: 'Biên độ gập hông và dẻo dai cơ gân kheo hỗ trợ Pike, L-sit và Deep Squat.',
  },
  ANKLE_MOBILITY: {
    key: 'ANKLE_MOBILITY',
    label: 'Độ linh hoạt Cổ chân (Ankle Dorsiflexion)',
    shortLabel: 'Cổ chân',
    category: 'MOBILITY',
    color: '#4F6F3F',
    iconName: 'Compass',
    description: 'Góc gập cổ chân cho phép ngồi xổm sâu với lưng thẳng tự nhiên.',
  },
  BALANCE: {
    key: 'BALANCE',
    label: 'Khả năng Thăng bằng (Balance)',
    shortLabel: 'Thăng bằng',
    category: 'CONTROL',
    color: '#3B82F6',
    iconName: 'Scale',
    description: 'Khả năng giữ thăng bằng trên 1 chân hoặc trên 2 bàn tay trong không gian.',
  },
  BODY_CONTROL: {
    key: 'BODY_CONTROL',
    label: 'Kiểm soát Cơ thể & Proprioception',
    shortLabel: 'Kiểm soát cơ thể',
    category: 'CONTROL',
    color: '#10B981',
    iconName: 'Target',
    description: 'Cảm nhận vị trí không gian và điều phối nhịp nhàng các nhóm cơ trong chuỗi động tác phức tạp.',
  },
  CALISTHENICS_SKILL: {
    key: 'CALISTHENICS_SKILL',
    label: 'Kỹ năng Calisthenics chuyên sâu',
    shortLabel: 'Kỹ năng Skill',
    category: 'CONTROL',
    color: '#8B5CF6',
    iconName: 'Award',
    description: 'Mức độ làm chủ các kỹ năng đỉnh cao (Muscle Up, Handstand, Front Lever).',
  },
  RECOVERY: {
    key: 'RECOVERY',
    label: 'Chất lượng Phục hồi & Giấc ngủ',
    shortLabel: 'Phục hồi',
    category: 'HABIT',
    color: '#06B6D4',
    iconName: 'Moon',
    description: 'Mức độ tái tạo năng lượng và giảm mỏi cơ sau các buổi tập luyện căng thẳng.',
  },
  TRAINING_CONSISTENCY: {
    key: 'TRAINING_CONSISTENCY',
    label: 'Tính Kỷ luật & Tần suất Tập',
    shortLabel: 'Kỷ luật tập',
    category: 'HABIT',
    color: '#F59E0B',
    iconName: 'CalendarCheck',
    description: 'Thói quen duy trì lịch tập đều đặn hàng tuần không bị ngắt quãng.',
  },
  PERCEIVED_EFFORT: {
    key: 'PERCEIVED_EFFORT',
    label: 'Cảm nhận Mức độ Gắng sức (RPE)',
    shortLabel: 'Mức gắng sức',
    category: 'HABIT',
    color: '#EF4444',
    iconName: 'Gauge',
    description: 'Khả năng ước lượng chính xác mức độ nỗ lực so với giới hạn cực đại của bản thân.',
  },
};

export const RADAR_DIMENSION_KEYS: FitnessDimension[] = [
  'UPPER_BODY_STRENGTH',
  'MUSCULAR_ENDURANCE',
  'SHOULDER_MOBILITY',
  'CORE_STABILITY',
  'CALISTHENICS_SKILL',
  'BODY_CONTROL',
];

/**
 * Câu hỏi của bộ đánh giá V2 dùng "vai trò bằng chứng" (category) KHÁC với chiều đo thể chất của v1:
 * hồ sơ, bối cảnh, thang tiến triển theo chuyển động... Các câu này không tự cộng điểm theo trọng số %,
 * điểm do bộ quy tắc V2 quyết định. Tra ở đây thay vì rơi về mặc định "Sức mạnh Thân trên".
 */
export const V2_ROLE_LABELS: Record<string, string> = {
  PROFILE: 'Hồ sơ (tuổi, chiều cao, cân nặng...)',
  EXPERIENCE: 'Kinh nghiệm tập luyện',
  MOBILITY: 'Tự đánh giá độ linh hoạt',
  GOALS: 'Mục tiêu',
  CONSTRAINTS: 'Ràng buộc / chấn thương / dụng cụ',
  PUSH: 'Thang tiến triển: Đẩy',
  PULL: 'Thang tiến triển: Kéo',
  LEGS: 'Thang tiến triển: Chân',
  CORE: 'Thang tiến triển: Core',
  SKILL: 'Thang tiến triển: Kỹ năng',
};

export const isV2Category = (category?: string | null): boolean =>
  !!category && !(category in FITNESS_DIMENSION_CONFIGS);

export const v2RoleLabel = (category?: string | null): string =>
  (category && V2_ROLE_LABELS[category]) || category || 'Thu thập thông tin';
