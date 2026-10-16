export interface ExerciseGuideDetail {
  id: string;
  name: string;
  category: "Push" | "Pull" | "Core" | "Legs" | "Skills";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  equipment: "Bodyweight" | "Pull-up Bar" | "Parallettes" | "Rings";
  videoThumbnail: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  defaultSets: number;
  targetReps: string;
  restSeconds: number;
  rpe: number;
  instructions: string[];
  startPositionImage: string;
  bottomPositionImage: string;
  tips: string[];
  commonMistakes: string[];
  videoUrl?: string;
  notesPrompt: string;
  details?: import("../../features/exercises/mappers/exerciseDetailsMapper").BackendExerciseDetails | null;
}

export interface WorkoutSessionData {
  id: number;
  title: string;
  dayLabel: string;
  totalDays: number;
  description: string;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  categories: string[];
  exercises: ExerciseGuideDetail[];
}

export const CURRENT_WORKOUT_SESSION: WorkoutSessionData = {
  id: 12,
  title: "Upper Body Strength",
  dayLabel: "Day 1 of 4",
  totalDays: 4,
  description: "Xây dựng sức mạnh thân trên với các chuyển động Calisthenics nền tảng.",
  durationMinutes: 35,
  difficulty: "Intermediate",
  categories: ["Push", "Pull", "Core"],
  exercises: [
    {
      id: "push-up",
      name: "Push Up",
      category: "Push",
      difficulty: "Beginner",
      equipment: "Bodyweight",
      videoThumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&auto=format&fit=crop&q=80",
      primaryMuscles: ["Ngực (Chest)", "Tay sau (Triceps)", "Vai trước (Shoulders)"],
      secondaryMuscles: ["Cơ bụng (Core)", "Cơ răng cưa (Serratus Anterior)"],
      defaultSets: 3,
      targetReps: "8 - 12",
      restSeconds: 60,
      rpe: 7.5,
      instructions: [
        "Bắt đầu ở tư thế High Plank, hai bàn tay đặt rộng hơn vai một chút, các ngón tay bám chắc mặt sàn.",
        "Giữ toàn bộ cơ thể tạo thành một đường thẳng tắp từ đầu, gáy, lưng đến gót chân (siết chặt cơ bụng và mông).",
        "Hạ thấp thân người có kiểm soát cho đến khi ngực gần chạm sàn (cách sàn 2 - 3cm), giữ khuỷu tay mở góc ~45 độ so với thân.",
        "Dùng lực cơ ngực và tay sau đẩy mạnh mẽ người trở về vị trí bắt đầu, siết cơ ngực ở đỉnh chuyển động.",
      ],
      startPositionImage: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=500&auto=format&fit=crop&q=80",
      bottomPositionImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
      tips: [
        "Không để hõm lưng (võng lưng dưới) - luôn cuộn xương chậu nhẹ để kích hoạt cơ bụng (Hollow Body).",
        "Nhịp thở chuẩn: Hít sâu khi hạ người xuống, thở mạnh ra bằng miệng khi đẩy người lên.",
        "Khuỷu tay không xòe ngang 90 độ để bảo vệ khớp vai.",
      ],
      commonMistakes: [
        "Đẩy mông lên quá cao hoặc để hông xệ chạm đất trước ngực.",
        "Chỉ hạ nửa đường (half-reps) - cần chạm đủ tầm vận động (Full ROM).",
        "Gập cổ ngước lên quá cao làm căng cơ cổ.",
      ],
      notesPrompt: "Tập trung kiểm soát chuyển động và siết chặt cơ bụng trong suốt bài tập.",
    },
    {
      id: "inverted-row",
      name: "Inverted Row",
      category: "Pull",
      difficulty: "Beginner",
      equipment: "Pull-up Bar",
      videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80",
      primaryMuscles: ["Lưng xô (Lats)", "Lưng giữa (Rhomboids)", "Tay trước (Biceps)"],
      secondaryMuscles: ["Vai sau (Rear Deltoids)", "Cẳng tay"],
      defaultSets: 3,
      targetReps: "8 - 12",
      restSeconds: 60,
      rpe: 7.0,
      instructions: [
        "Nằm dưới thanh xà thấp, nắm xà với khoảng cách rộng hơn vai một chút, gót chân chống đất.",
        "Giữ cơ thể thẳng tắp như một tấm ván, siết mông và bụng.",
        "Kéo ngực chạm vào thanh xà bằng cách ép hai bả vai vào nhau.",
        "Hạ người từ từ trở lại vị trí tay duỗi thẳng hoàn toàn.",
      ],
      startPositionImage: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
      bottomPositionImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
      tips: [
        "Chủ động ép hai xương bả vai lại với nhau ở đỉnh điểm kéo.",
        "Càng hạ thấp thanh xà thì độ khó bài tập càng tăng.",
      ],
      commonMistakes: [
        "Ưỡn bụng đẩy hông lên trước khi ngực chạm xà.",
        "Không duỗi thẳng tay ở cuối mỗi lần kéo.",
      ],
      notesPrompt: "Cảm nhận lực kéo từ cơ lưng xô thay vì chỉ kéo bằng cơ tay trước.",
    },
    {
      id: "pike-push-up",
      name: "Pike Push Up",
      category: "Push",
      difficulty: "Intermediate",
      equipment: "Bodyweight",
      videoThumbnail: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=1000&auto=format&fit=crop&q=80",
      primaryMuscles: ["Cơ vai (Deltoids)", "Tay sau (Triceps)", "Lưng trên"],
      secondaryMuscles: ["Cơ bụng (Core)", "Cơ ngực trên"],
      defaultSets: 3,
      targetReps: "6 - 10",
      restSeconds: 60,
      rpe: 8.0,
      instructions: [
        "Bắt đầu ở tư thế chữ V ngược (Down Dog), mông đẩy lên cao, hai chân thẳng hoặc chùng nhẹ gối.",
        "Đầu nằm giữa hai cánh tay, mắt nhìn về phía ngón chân.",
        "Hạ đỉnh đầu hướng về phía trước theo quỹ đạo tam giác so với hai bàn tay.",
        "Dùng lực cơ vai đẩy mạnh người trở về tư thế chữ V ban đầu.",
      ],
      startPositionImage: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=500&auto=format&fit=crop&q=80",
      bottomPositionImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
      tips: [
        "Bài tập bổ trợ hàng đầu để lên Handstand Push-Up.",
        "Đưa đầu về phía trước tạo hình tam giác cân với hai tay khi hạ xuống.",
      ],
      commonMistakes: [
        "Hạ đầu thẳng xuống giữa hai tay thay vì hạ về phía trước.",
        "Lưng bị cong gù, không đẩy hông lên cao.",
      ],
      notesPrompt: "Giữ vững vai và kiểm soát nhịp thở đều đặn khi hạ xuống.",
    },
    {
      id: "australian-pull-up",
      name: "Australian Pull Up",
      category: "Pull",
      difficulty: "Beginner",
      equipment: "Pull-up Bar",
      videoThumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1000&auto=format&fit=crop&q=80",
      primaryMuscles: ["Lưng xô (Lats)", "Tay trước (Biceps)", "Cơ trám (Rhomboids)"],
      secondaryMuscles: ["Cơ vai sau", "Cổ tay"],
      defaultSets: 3,
      targetReps: "8 - 12",
      restSeconds: 60,
      rpe: 7.0,
      instructions: [
        "Nắm xà ở độ cao ngang ngực hoặc hông, ngả người ra sau với gót chân cố định.",
        "Kéo ngực chạm thẳng vào thanh xà, mở rộng lồng ngực.",
        "Giữ 1 giây ở đỉnh rồi hạ người chậm rãi có kiểm soát.",
      ],
      startPositionImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80",
      bottomPositionImage: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
      tips: [
        "Siết chặt bả vai về phía sau ở điểm cao nhất.",
      ],
      commonMistakes: [
        "Thả lỏng cơ mông khiến người bị cong võng.",
      ],
      notesPrompt: "Tập trung lực kéo vào cơ lưng, gồng chặt toàn thân.",
    },
    {
      id: "plank",
      name: "Plank",
      category: "Core",
      difficulty: "Beginner",
      equipment: "Bodyweight",
      videoThumbnail: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=1000&auto=format&fit=crop&q=80",
      primaryMuscles: ["Cơ bụng thẳng (Abs)", "Cơ ngang bụng (Transverse Abdominis)"],
      secondaryMuscles: ["Cơ mông", "Vai", "Lưng dưới"],
      defaultSets: 3,
      targetReps: "45 - 60s",
      restSeconds: 60,
      rpe: 6.5,
      instructions: [
        "Chống cẳng tay vuông góc với sàn, khuỷu tay nằm ngay dưới vai.",
        "Dựng mũi chân, nâng toàn bộ thân người tạo thành một đường thẳng.",
        "Siết chặt cơ bụng, cơ mông và đùi trong suốt thời gian giữ thế.",
        "Duy trì hít thở chậm và đều, không nín thở.",
      ],
      startPositionImage: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=500&auto=format&fit=crop&q=80",
      bottomPositionImage: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=500&auto=format&fit=crop&q=80",
      tips: [
        "Hơi gù lưng trên nhẹ (Protraction) để kích hoạt cơ răng cưa bảo vệ khớp vai.",
      ],
      commonMistakes: [
        "Võng lưng dưới gây đau cột sống.",
        "Đẩy mông lên quá cao như hình chữ V.",
      ],
      notesPrompt: "Siết cứng cơ bụng như thể chuẩn bị chịu một lực đấm.",
    },
  ],
};
