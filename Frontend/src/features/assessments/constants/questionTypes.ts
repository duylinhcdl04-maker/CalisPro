import { QuestionType } from '../types';

export interface QuestionTypeConfig {
  type: QuestionType;
  title: string;
  description: string;
  iconName: string;
  tag: string;
}

export const QUESTION_TYPE_CONFIGS: QuestionTypeConfig[] = [
  {
    type: 'PERFORMANCE_TEST',
    title: 'Kiểm tra Thể lực thực tế (Performance Test)',
    description: 'Yêu cầu người dùng thực hiện bài tập thực tế (Push-up, Plank, Squat, Pull-up) và ghi lại số lần lặp hoặc số giây tối đa.',
    iconName: 'Zap',
    tag: 'Quan trọng nhất',
  },
  {
    type: 'SINGLE_CHOICE',
    title: 'Trắc nghiệm Chọn một (Single Choice)',
    description: 'Người dùng chọn 1 đáp án duy nhất trong danh sách các mức độ hoặc kinh nghiệm đã định nghĩa sẵn.',
    iconName: 'CheckCircle2',
    tag: 'Trắc nghiệm',
  },
  {
    type: 'MULTIPLE_CHOICE',
    title: 'Trắc nghiệm Chọn nhiều (Multiple Choice)',
    description: 'Cho phép tích chọn nhiều đặc điểm hoặc mục tiêu luyện tập.',
    iconName: 'ListChecks',
    tag: 'Trắc nghiệm',
  },
  {
    type: 'NUMERIC_INPUT',
    title: 'Nhập số đo (Numeric Input)',
    description: 'Nhập giá trị số nguyên hoặc số thập phân tự do (ví dụ cân nặng, chiều cao, nhịp tim nghỉ ngơi).',
    iconName: 'Binary',
    tag: 'Số đo',
  },
  {
    type: 'RATING_SCALE',
    title: 'Thang đo Đánh giá (Rating Scale 1 - 5 / 1 - 10)',
    description: 'Thang điểm cảm nhận (RPE, chất lượng phục hồi, mức độ đau mỏi, cảm giác căng cơ).',
    iconName: 'SlidersHorizontal',
    tag: 'Cảm nhận',
  },
  {
    type: 'MEASUREMENT',
    title: 'Đo lường Khớp & Độ dẻo (Mobility Measurement)',
    description: 'Đo khoảng cách gập người, góc xoay vai, độ sâu Squat theo đơn vị cm hoặc góc độ.',
    iconName: 'Ruler',
    tag: 'Linh hoạt',
  },
  {
    type: 'YES_NO',
    title: 'Câu hỏi Đúng / Sai (Yes / No)',
    description: 'Khảo sát tình trạng y tế, chấn thương cũ hoặc tiền sử bệnh lý.',
    iconName: 'HelpCircle',
    tag: 'Sàng lọc',
  },
  {
    type: 'SELF_ASSESSMENT',
    title: 'Tự đánh giá Kỹ thuật (Self Assessment)',
    description: 'Học viên tự đánh giá form động tác và cảm giác vận động cơ bắp theo mô tả chuẩn.',
    iconName: 'UserCheck',
    tag: 'Tự đánh giá',
  },
];
