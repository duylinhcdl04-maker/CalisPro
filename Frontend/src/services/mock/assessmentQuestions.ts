import type { AssessmentQuestion } from "../../types";

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Step 1 — Basic Information
  {
    id: "age",
    step: 1,
    stepTitle: "Thông tin cơ bản",
    type: "NUMBER",
    prompt: "Bạn bao nhiêu tuổi?",
    unit: "tuổi",
    min: 12,
    max: 90,
    required: true,
  },
  {
    id: "gender",
    step: 1,
    stepTitle: "Thông tin cơ bản",
    type: "SINGLE_CHOICE",
    prompt: "Giới tính của bạn?",
    options: [
      { value: "male", label: "Nam" },
      { value: "female", label: "Nữ" },
      { value: "other", label: "Khác" },
    ],
    required: true,
  },
  {
    id: "height",
    step: 1,
    stepTitle: "Thông tin cơ bản",
    type: "NUMBER",
    prompt: "Chiều cao của bạn?",
    unit: "cm",
    min: 120,
    max: 230,
    required: true,
  },
  {
    id: "weight",
    step: 1,
    stepTitle: "Thông tin cơ bản",
    type: "NUMBER",
    prompt: "Cân nặng hiện tại của bạn?",
    unit: "kg",
    min: 30,
    max: 200,
    required: true,
  },

  // Step 2 — Goals
  {
    id: "primaryGoal",
    step: 2,
    stepTitle: "Mục tiêu",
    type: "SINGLE_CHOICE",
    prompt: "Mục tiêu quan trọng nhất với bạn lúc này?",
    options: [
      { value: "STRENGTH", label: "Xây dựng sức mạnh" },
      { value: "MUSCLE", label: "Phát triển cơ bắp" },
      { value: "WEIGHT_LOSS", label: "Giảm mỡ" },
      { value: "ENDURANCE", label: "Cải thiện sức bền" },
      { value: "SKILLS", label: "Học kỹ năng calisthenics" },
      { value: "GENERAL", label: "Thể lực tổng quát" },
    ],
    required: true,
  },
  {
    id: "secondaryGoal",
    step: 2,
    stepTitle: "Mục tiêu",
    type: "SINGLE_CHOICE",
    prompt: "Mục tiêu phụ (nếu có)?",
    helperText: "Có thể bỏ qua nếu bạn chỉ tập trung vào một mục tiêu.",
    options: [
      { value: "STRENGTH", label: "Xây dựng sức mạnh" },
      { value: "MUSCLE", label: "Phát triển cơ bắp" },
      { value: "WEIGHT_LOSS", label: "Giảm mỡ" },
      { value: "ENDURANCE", label: "Cải thiện sức bền" },
      { value: "SKILLS", label: "Học kỹ năng calisthenics" },
      { value: "GENERAL", label: "Thể lực tổng quát" },
    ],
    required: false,
  },

  // Step 3 — Training Experience
  {
    id: "experienceLevel",
    step: 3,
    stepTitle: "Kinh nghiệm luyện tập",
    type: "SINGLE_CHOICE",
    prompt: "Bạn đánh giá trình độ hiện tại của mình ở đâu?",
    options: [
      { value: "BEGINNER", label: "Mới bắt đầu", description: "Chưa tập hoặc mới tập dưới 3 tháng" },
      { value: "INTERMEDIATE", label: "Trung bình", description: "Đã tập đều trong 3-12 tháng" },
      { value: "ADVANCED", label: "Nâng cao", description: "Đã tập trên 1 năm, quen các kỹ năng cơ bản" },
    ],
    required: true,
  },
  {
    id: "hasTrainedCalisthenics",
    step: 3,
    stepTitle: "Kinh nghiệm luyện tập",
    type: "BOOLEAN",
    prompt: "Bạn đã từng tập calisthenics có cấu trúc trước đây chưa?",
    required: true,
  },

  // Step 4 — Physical Performance
  {
    id: "maxPushUps",
    step: 4,
    stepTitle: "Khả năng thể chất",
    type: "NUMBER",
    prompt: "Số lần chống đẩy tối đa bạn thực hiện được (đúng kỹ thuật)?",
    unit: "reps",
    min: 0,
    max: 100,
    required: true,
  },
  {
    id: "maxPullUps",
    step: 4,
    stepTitle: "Khả năng thể chất",
    type: "NUMBER",
    prompt: "Số lần pull-up tối đa bạn thực hiện được?",
    unit: "reps",
    min: 0,
    max: 50,
    required: true,
  },
  {
    id: "maxSquats",
    step: 4,
    stepTitle: "Khả năng thể chất",
    type: "NUMBER",
    prompt: "Số lần squat tối đa bạn thực hiện được?",
    unit: "reps",
    min: 0,
    max: 150,
    required: true,
  },
  {
    id: "plankDuration",
    step: 4,
    stepTitle: "Khả năng thể chất",
    type: "NUMBER",
    prompt: "Thời gian giữ plank tối đa của bạn?",
    unit: "giây",
    min: 0,
    max: 600,
    required: true,
  },

  // Step 5 — Lifestyle / Availability
  {
    id: "trainingDaysPerWeek",
    step: 5,
    stepTitle: "Lối sống & thời gian",
    type: "SCALE",
    prompt: "Bạn có thể luyện tập bao nhiêu ngày mỗi tuần?",
    min: 1,
    max: 7,
    required: true,
  },
  {
    id: "sleepHours",
    step: 5,
    stepTitle: "Lối sống & thời gian",
    type: "NUMBER",
    prompt: "Bạn ngủ trung bình bao nhiêu giờ mỗi đêm?",
    unit: "giờ",
    min: 3,
    max: 12,
    required: true,
  },
  {
    id: "trainingPreference",
    step: 5,
    stepTitle: "Lối sống & thời gian",
    type: "MULTIPLE_CHOICE",
    prompt: "Bạn thường luyện tập ở đâu / khi nào?",
    helperText: "Chọn tất cả những gì phù hợp với bạn.",
    options: [
      { value: "MORNING", label: "Buổi sáng" },
      { value: "EVENING", label: "Buổi tối" },
      { value: "OUTDOOR", label: "Ngoài trời / công viên" },
      { value: "HOME", label: "Tại nhà" },
    ],
    required: true,
  },
];

export function getQuestionsByStep(step: number) {
  return ASSESSMENT_QUESTIONS.filter((q) => q.step === step);
}

export const TOTAL_ASSESSMENT_STEPS = Math.max(...ASSESSMENT_QUESTIONS.map((q) => q.step));
