export interface CoachProfile {
  id: string;
  name: string;
  avatarUrl: string;
  title: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  specialties: string[];
  bio: string;
  hourlyRate: string;
  asyncReviewRate: string;
  availableNextSlot: string;
  isOnline: boolean;
  certifications: string[];
}

export interface AIFeedbackRule {
  id: string;
  checkpoint: string;
  idealAngle: string;
  commonError: string;
  aiVoiceCorrection: string;
  severity: "high" | "medium" | "low";
}

export interface TrainingTierPreset {
  level: "Beginner" | "Intermediate" | "Advanced";
  sets: number;
  reps: string;
  restSeconds: number;
  frequency: string;
  focus: string;
}

export interface ExerciseDetailExtra {
  videoUrl: string;
  videoDuration: string;
  caloriesBurn: string;
  equipment: string;
  type: string;
  steps: {
    title: string;
    description: string;
    keyTip: string;
  }[];
  startPositionImage: string;
  bottomPositionImage: string;
  aiDiagnosticRules: AIFeedbackRule[];
  presets: TrainingTierPreset[];
  coaches: CoachProfile[];
}

export const EXERCISE_DETAIL_EXTRAS: Record<string, ExerciseDetailExtra> = {
  "knee-push-up": {
    videoUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=80",
    videoDuration: "1:45",
    caloriesBurn: "45-65 kcal / 3 hiệp",
    equipment: "Không dụng cụ (Thảm tập)",
    type: "Push (Đẩy thân trên)",
    steps: [
      {
        title: "Tư thế chuẩn bị (Setup)",
        description: "Quỳ hai gối xuống thảm, hai tay chống rộng bằng vai, các ngón tay xòe tự nhiên bám chặt sàn.",
        keyTip: "Gồng chặt cơ core và cơ mông để giữ hông không bị võng.",
      },
      {
        title: "Hạ thân có kiểm soát (Eccentric)",
        description: "Hít sâu bằng mũi, gập khuỷu tay góc 45 độ so với thân người và từ từ hạ ngực xuống cách sàn 3-5 cm.",
        keyTip: "Không để khuỷu tay bẹt sang hai bên 90 độ gây áp lực lên khớp vai.",
      },
      {
        title: "Đẩy lên bùng nổ (Concentric)",
        description: "Thở mạnh ra bằng miệng, dùng lực cơ ngực và tay sau đẩy mạnh thân người trở về vị trí ban đầu.",
        keyTip: "Khóa chặt khớp vai nhưng không khóa cứng cùi chỏ ở đỉnh chuyển động.",
      },
    ],
    startPositionImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
    bottomPositionImage: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80",
    aiDiagnosticRules: [
      {
        id: "r1",
        checkpoint: "Góc khuỷu tay (Elbow Flare)",
        idealAngle: "45° - 60°",
        commonError: "Khuỷu tay xòe 90° gây đau khớp vai",
        aiVoiceCorrection: "Khép nhẹ khuỷu tay 45 độ về phía thân người",
        severity: "high",
      },
      {
        id: "r2",
        checkpoint: "Độ thẳng cột sống & hông (Spine Alignment)",
        idealAngle: "180° (Thẳng hàng)",
        commonError: "Võng lưng dưới hoặc nhô mông lên cao",
        aiVoiceCorrection: "Siết chặt cơ bụng và cơ mông, không võng lưng",
        severity: "high",
      },
      {
        id: "r3",
        checkpoint: "Độ sâu ngực (Chest Depth)",
        idealAngle: "Gần chạm sàn (< 5cm)",
        commonError: "Chỉ gật đầu hạ nửa chặng đường",
        aiVoiceCorrection: "Hạ ngực sâu thêm 5cm để kích hoạt tối đa cơ ngực",
        severity: "medium",
      },
    ],
    presets: [
      {
        level: "Beginner",
        sets: 3,
        reps: "8 - 10 reps",
        restSeconds: 60,
        frequency: "3 buổi / tuần",
        focus: "Làm quen chuyển động & cảm nhận cơ ngực",
      },
      {
        level: "Intermediate",
        sets: 4,
        reps: "12 - 15 reps",
        restSeconds: 45,
        frequency: "4 buổi / tuần",
        focus: "Xây dựng sức bền cơ bắp & chuẩn bị lên Standard Push Up",
      },
      {
        level: "Advanced",
        sets: 5,
        reps: "20+ reps",
        restSeconds: 30,
        frequency: "4 buổi / tuần",
        focus: "Chuyển giao tốc độ bùng nổ (Explosive Knee Push Up)",
      },
    ],
    coaches: [
      {
        id: "coach-1",
        name: "Hoàng Nam (Nam Calis)",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        title: "Master Calisthenics Trainer",
        rating: 4.9,
        reviewsCount: 128,
        experienceYears: 6,
        specialties: ["Push/Pull Foundation", "Plan & Nutrition", "Form Reconstruction"],
        bio: "Chuyên gia phục hồi form và phát triển sức mạnh nền tảng Calisthenics từ cơ bản đến nâng cao.",
        hourlyRate: "250.000đ / buổi 45p",
        asyncReviewRate: "50.000đ / video chấm form",
        availableNextSlot: "Hôm nay, 19:30",
        isOnline: true,
        certifications: ["WSWCF Certified Level 2", "NASM-CPT"],
      },
      {
        id: "coach-2",
        name: "Trần Bảo Long",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        title: "National Street Workout Athlete",
        rating: 5.0,
        reviewsCount: 94,
        experienceYears: 5,
        specialties: ["Muscle-Up Mastery", "Explosive Push", "Core Stability"],
        bio: "Top 3 Street Workout Vietnam 2023. Kèm 1-1 chuyên sâu sửa từng góc độ chuyển động.",
        hourlyRate: "300.000đ / buổi 45p",
        asyncReviewRate: "60.000đ / video chấm form",
        availableNextSlot: "Ngày mai, 08:00",
        isOnline: false,
        certifications: ["ACE Personal Trainer", "Street Workout Pro"],
      },
      {
        id: "coach-3",
        name: "Lê Minh Thảo",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        title: "Movement & Calisthenics Specialist",
        rating: 4.8,
        reviewsCount: 67,
        experienceYears: 4,
        specialties: ["Female Calisthenics", "Push Up Progression", "Posture Fix"],
        bio: "Đồng hành cùng hàng trăm học viên chinh phục các bài đẩy & kéo với giáo án cá nhân hóa.",
        hourlyRate: "220.000đ / buổi 45p",
        asyncReviewRate: "45.000đ / video chấm form",
        availableNextSlot: "Hôm nay, 21:00",
        isOnline: true,
        certifications: ["ISSA Fitness Coach"],
      },
    ],
  },
};

export function getExerciseExtra(exerciseId: string): ExerciseDetailExtra {
  if (EXERCISE_DETAIL_EXTRAS[exerciseId]) {
    return EXERCISE_DETAIL_EXTRAS[exerciseId];
  }

  // Fallback defaults for any exercise
  return {
    videoUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
    videoDuration: "2:10",
    caloriesBurn: "50-80 kcal / session",
    equipment: "Bodyweight",
    type: "Calisthenics Movement",
    steps: [
      {
        title: "Tư thế chuẩn bị (Setup)",
        description: "Kích hoạt nhóm cơ mục tiêu, siết core và đặt tay/chân đúng vị trí chuẩn kỹ thuật.",
        keyTip: "Giữ tinh thần tập trung và hít thở đều đặn.",
      },
      {
        title: "Thực hiện chuyển động (Execution)",
        description: "Hạ người hoặc kéo có kiểm soát với biên độ đầy đủ (Full Range of Motion).",
        keyTip: "Không dùng đà quán tính, tập trung vào cơ bắp hoạt động.",
      },
      {
        title: "Hoàn tất hiệp tập (Lockout & Hold)",
        description: "Trở về vị trí đỉnh điểm an toàn, giữ 1 giây rồi hạ xuống nghỉ ngơi.",
        keyTip: "Thở ra dứt khoát khi dùng lực đẩy/kéo mạnh.",
      },
    ],
    startPositionImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
    bottomPositionImage: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80",
    aiDiagnosticRules: [
      {
        id: "r1",
        checkpoint: "Góc chuyển động khớp (Joint Angles)",
        idealAngle: "Chuẩn form sinh học",
        commonError: "Chuyển động lệch biên độ",
        aiVoiceCorrection: "Giữ chuyển động mượt mà và kiểm soát nhịp thở",
        severity: "high",
      },
      {
        id: "r2",
        checkpoint: "Khóa cơ lõi (Core Engagement)",
        idealAngle: "Trục thẳng",
        commonError: "Lỏng cơ bụng",
        aiVoiceCorrection: "Siết chặt cơ bụng và cơ lưng dưới",
        severity: "medium",
      },
    ],
    presets: [
      {
        level: "Beginner",
        sets: 3,
        reps: "8-10 reps",
        restSeconds: 60,
        frequency: "3 buổi/tuần",
        focus: "Làm quen động tác & chuẩn form",
      },
      {
        level: "Intermediate",
        sets: 4,
        reps: "12-15 reps",
        restSeconds: 45,
        frequency: "4 buổi/tuần",
        focus: "Tăng thể tích tập luyện & sức mạnh",
      },
      {
        level: "Advanced",
        sets: 5,
        reps: "20+ reps",
        restSeconds: 30,
        frequency: "4 buổi/tuần",
        focus: "Bứt phá giới hạn thể lực",
      },
    ],
    coaches: [
      {
        id: "coach-1",
        name: "Hoàng Nam (Nam Calis)",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        title: "Master Calisthenics Trainer",
        rating: 4.9,
        reviewsCount: 128,
        experienceYears: 6,
        specialties: ["Push/Pull Foundation", "Plan & Nutrition", "Form Reconstruction"],
        bio: "Chuyên gia phục hồi form và phát triển sức mạnh nền tảng Calisthenics từ cơ bản đến nâng cao.",
        hourlyRate: "250.000đ / buổi 45p",
        asyncReviewRate: "50.000đ / video chấm form",
        availableNextSlot: "Hôm nay, 19:30",
        isOnline: true,
        certifications: ["WSWCF Certified Level 2", "NASM-CPT"],
      },
      {
        id: "coach-2",
        name: "Trần Bảo Long",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        title: "National Street Workout Athlete",
        rating: 5.0,
        reviewsCount: 94,
        experienceYears: 5,
        specialties: ["Muscle-Up Mastery", "Explosive Push", "Core Stability"],
        bio: "Top 3 Street Workout Vietnam 2023. Kèm 1-1 chuyên sâu sửa từng góc độ chuyển động.",
        hourlyRate: "300.000đ / buổi 45p",
        asyncReviewRate: "60.000đ / video chấm form",
        availableNextSlot: "Ngày mai, 08:00",
        isOnline: false,
        certifications: ["ACE Personal Trainer", "Street Workout Pro"],
      },
    ],
  };
}
