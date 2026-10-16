import { AssessmentType } from '../types';

export interface AssessmentTypeConfig {
  type: AssessmentType;
  title: string;
  badge: string;
  description: string;
  iconName: string;
  suggestedDurationMinutes: number;
  isSystem?: boolean;
}

export const ASSESSMENT_TYPE_CONFIGS: AssessmentTypeConfig[] = [
  {
    type: 'INITIAL',
    title: 'Đánh giá thể lực ban đầu',
    badge: 'Initial Assessment',
    description: 'Bắt buộc với học viên mới để xác định nền tảng thể lực, phân loại cấp độ khởi điểm và tự động tạo lộ trình Calisthenics phù hợp.',
    iconName: 'Sparkles',
    suggestedDurationMinutes: 10,
  },
  {
    type: 'PERIODIC',
    title: 'Đánh giá lại định kỳ',
    badge: 'Periodic Reassessment',
    description: 'Được kích hoạt tự động theo chu kỳ tuần/tháng hoặc số buổi tập đã hoàn thành để theo dõi sự tiến bộ và điều chỉnh giáo án.',
    iconName: 'RefreshCw',
    suggestedDurationMinutes: 15,
  },
  {
    type: 'STRENGTH',
    title: 'Đánh giá sức mạnh tối đa',
    badge: 'Strength Assessment',
    description: 'Tập trung chuyên sâu vào sức mạnh cơ bắp phần thân trên (Upper Push/Pull), thân dưới (Legs) và lực tĩnh (Isometric Strength).',
    iconName: 'Dumbbell',
    suggestedDurationMinutes: 12,
  },
  {
    type: 'ENDURANCE',
    title: 'Đánh giá sức bền thể lực',
    badge: 'Endurance Assessment',
    description: 'Kiểm tra sức bền cơ bắp theo thời gian dài và khả năng duy trì form chuẩn Calisthenics dưới trạng thái mệt mỏi.',
    iconName: 'Flame',
    suggestedDurationMinutes: 15,
  },
  {
    type: 'MOBILITY',
    title: 'Đánh giá độ linh hoạt khớp',
    badge: 'Mobility & Flexibility',
    description: 'Đo lường biên độ chuyển động của khớp vai, hông, cổ tay và mắt cá chân để phòng tránh chấn thương hiệu quả.',
    iconName: 'Activity',
    suggestedDurationMinutes: 8,
  },
  {
    type: 'SKILL',
    title: 'Đánh giá kỹ năng Calisthenics',
    badge: 'Skill Benchmark',
    description: 'Kiểm tra trình độ các kỹ năng đặc thù như Muscle-up, Handstand, Front Lever, Planche và Pistol Squat.',
    iconName: 'Award',
    suggestedDurationMinutes: 12,
  },
  {
    type: 'CUSTOM',
    title: 'Bài đánh giá tùy chỉnh',
    badge: 'Custom Assessment',
    description: 'Tự do tùy biến câu hỏi, bài tập thể lực và quy tắc chấm điểm linh hoạt cho các mục đích đào tạo riêng biệt.',
    iconName: 'Sliders',
    suggestedDurationMinutes: 10,
  },
];
