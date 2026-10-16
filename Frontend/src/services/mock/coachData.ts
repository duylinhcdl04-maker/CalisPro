export interface CoachAchievement {
  id: string;
  title: string;
  category: "competition" | "certificate" | "skill_record" | "education";
  year: string;
  organization: string;
  isVerified: boolean;
  proofBadge: string;
}

export interface CoachRecord {
  skill: string;
  record: string;
  category: string;
}

export interface CoachReview {
  studentName: string;
  rating: number;
  comment: string;
  achievedGoal: string;
  date: string;
}

export interface Coach {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  coverImage: string;
  role: "Master Coach" | "Senior Coach" | "Elite Coach";
  experienceYears: number;
  rating: number;
  reviewCount: number;
  activeStudents: number;
  location: string;
  shortBio: string;
  about: string;
  specialties: string[];
  skills: string[];
  achievements: CoachAchievement[];
  personalRecords: CoachRecord[];
  reviews: CoachReview[];
  trainingOptions: {
    title: string;
    description: string;
    format: "1-on-1 Online" | "1-on-1 Offline" | "Kế hoạch tuần";
    duration: string;
    price: string;
  }[];
}

export const MOCK_COACHES: Coach[] = [
  {
    id: "coach-viet-anh",
    name: "Nguyễn Việt Anh",
    nickname: "Alex Calis",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80",
    role: "Master Coach",
    experienceYears: 8,
    rating: 4.98,
    reviewCount: 168,
    activeStudents: 42,
    location: "Hà Nội / Online Toàn Quốc",
    shortBio: "Vô địch Street Workout VN 2022, chuyên gia huấn luyện Static & Dynamic Calisthenics.",
    about:
      "Với hơn 8 năm đam mê và huấn luyện Calisthenics chuyên nghiệp, tôi đã hỗ trợ hơn 500+ học viên từ người mới bắt đầu đến các VĐV thi đấu chinh phục các kỹ năng khó như Full Planche, Front Lever và One Arm Pull Up một cách an toàn, chuẩn form và không chấn thương.",
    specialties: ["Static Skills (Planche, Front Lever)", "Tăng sức mạnh bộc phát", "Chỉnh sửa tư thế & Cổ tay"],
    skills: ["Full Planche (15s)", "Front Lever (25s)", "Maltese", "One Arm Pullup", "Victorian Cross"],
    achievements: [
      {
        id: "ach-1",
        title: "Quán Quân Vietnam Calisthenics Championship 2022",
        category: "competition",
        year: "2022",
        organization: "Vietnam Street Workout Federation",
        isVerified: true,
        proofBadge: "Huy chương Vàng Quốc Gia",
      },
      {
        id: "ach-2",
        title: "Chứng chỉ HLV Calisthenics Quốc Tế Cấp Độ 3 (WSWCF)",
        category: "certificate",
        year: "2021",
        organization: "World Street Workout & Calisthenics Federation",
        isVerified: true,
        proofBadge: "WSWCF Level 3 Certified",
      },
      {
        id: "ach-3",
        title: "Top 3 King of the Bar Đông Nam Á 2023",
        category: "competition",
        year: "2023",
        organization: "Southeast Asia Calisthenics League",
        isVerified: true,
        proofBadge: "Huy chương Đồng Khu Vực",
      },
      {
        id: "ach-4",
        title: "Cử nhân Giáo dục Thể chất & Y sinh Vận động",
        category: "education",
        year: "2019",
        organization: "Đại học Thể dục Thể thao",
        isVerified: true,
        proofBadge: "Bằng Cử Nhân Chính Quy",
      },
    ],
    personalRecords: [
      { skill: "Full Planche Hold", record: "18.5 giây", category: "Static" },
      { skill: "Front Lever Hold", record: "26.0 giây", category: "Static" },
      { skill: "Muscle Up liên tục", record: "24 lần", category: "Endurance" },
      { skill: "Hít xà đơn thêm tạ (Weighted Pull-up)", record: "+75kg (1RM)", category: "Strength" },
      { skill: "Handstand Push-up tự do", record: "18 lần", category: "Balance & Push" },
    ],
    reviews: [
      {
        studentName: "Trần Hoàng Long",
        rating: 5,
        comment: "Coach Việt Anh chỉ dẫn cực kỳ chi tiết từ góc đặt cổ tay, sau 4 tháng mình đã mở khóa được Straddle Planche chuẩn form!",
        achievedGoal: "Mở khóa Straddle Planche sau 4 tháng",
        date: "Tháng 8, 2026",
      },
      {
        studentName: "Lê Minh Tuấn",
        rating: 5,
        comment: "Giáo án cá nhân hóa rất sát với thể trạng, không bị đau khớp vai như lúc tự tập.",
        achievedGoal: "Front Lever 10s & Tăng 4kg cơ",
        date: "Tháng 7, 2026",
      },
    ],
    trainingOptions: [
      {
        title: "Coaching 1:1 Trực Tuyến Chuyên Sâu",
        description: "Phân tích video bài tập mỗi ngày, giáo án cập nhật hàng tuần, video call chỉnh form trực tiếp.",
        format: "1-on-1 Online",
        duration: "1 Tháng / 3 Tháng",
        price: "1.800.000 đ / tháng",
      },
      {
        title: "Chinh phục Kỹ Năng Mục Tiêu (Skills Bootcamp)",
        description: "Lộ trình 12 tuần tập trung tối đa vào 1 kỹ năng: Planche, Front Lever hoặc Handstand.",
        format: "Kế hoạch tuần",
        duration: "12 Tuần",
        price: "2.400.000 đ / khóa",
      },
    ],
  },
  {
    id: "coach-minh-duc",
    name: "Phạm Minh Đức",
    nickname: "Iron Duc",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&auto=format&fit=crop&q=80",
    role: "Elite Coach",
    experienceYears: 6,
    rating: 4.95,
    reviewCount: 132,
    activeStudents: 35,
    location: "TP. Hồ Chí Minh / Online",
    shortBio: "Chuyên gia Weighted Calisthenics & Thể hình thể trọng (Bodyweight Bodybuilding).",
    about:
      "Tập trung vào việc xây dựng cơ bắp dày dặn, thể hình thẩm mỹ và sức mạnh thực chiến thông qua các bài tập thể trọng mang thêm tải trọng (Weighted Calisthenics). Cam kết mang lại sự thay đổi rõ rệt về hình thể trong 90 ngày.",
    specialties: ["Weighted Calisthenics", "Tăng cơ giảm mỡ (Body Recomp)", "Sức bền Calisthenics (Sets & Reps)"],
    skills: ["Weighted Dip (+90kg)", "Weighted Pull-up (+70kg)", "Pistol Squat (+40kg)", "Ring Muscle Up"],
    achievements: [
      {
        id: "ach-5",
        title: "Huy chương Vàng Weighted Calisthenics Heavyweight 2023",
        category: "competition",
        year: "2023",
        organization: "Saigon Street Workout Cup",
        isVerified: true,
        proofBadge: "Nhà Vô Địch Hạng Nặng",
      },
      {
        id: "ach-6",
        title: "Chứng chỉ HLV Cá nhân Thể Hình Quốc Tế NASM-CPT",
        category: "certificate",
        year: "2020",
        organization: "National Academy of Sports Medicine (USA)",
        isVerified: true,
        proofBadge: "NASM Certified Trainer",
      },
      {
        id: "ach-7",
        title: "Top 1 Thử thách Max Reps Pull-up Vietnam 2021",
        category: "skill_record",
        year: "2021",
        organization: "CaliLife Vietnam",
        isVerified: true,
        proofBadge: "Kỷ lục 38 Pull-ups Chuẩn Form",
      },
    ],
    personalRecords: [
      { skill: "Weighted Dip", record: "+92.5kg (1RM)", category: "Strength" },
      { skill: "Weighted Pull-up", record: "+72.5kg (1RM)", category: "Strength" },
      { skill: "Chống đẩy liên tục trong 2 phút", record: "110 lần", category: "Endurance" },
      { skill: "Strict Ring Muscle Up", record: "16 lần", category: "Rings" },
    ],
    reviews: [
      {
        studentName: "Vũ Hải Đăng",
        rating: 5,
        comment: "Theo anh Đức 3 tháng giảm từ 22% body fat xuống 13%, cơ ngực và xô nổi khối rõ rệt!",
        achievedGoal: "Giảm 7kg mỡ, tăng 3kg cơ",
        date: "Tháng 8, 2026",
      },
    ],
    trainingOptions: [
      {
        title: "Lộ Trình Tăng Cơ Thể Trọng 1:1",
        description: "Kèm dinh dưỡng chi tiết macro, giáo án Weighted Calisthenics và theo dõi chỉ số bodyfat 2 tuần/lần.",
        format: "1-on-1 Online",
        duration: "3 Tháng",
        price: "2.100.000 đ / tháng",
      },
    ],
  },
  {
    id: "coach-thanh-huyen",
    name: "Đỗ Thanh Huyền",
    nickname: "Elena Balance",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1000&auto=format&fit=crop&q=80",
    role: "Senior Coach",
    experienceYears: 5,
    rating: 4.97,
    reviewCount: 95,
    activeStudents: 28,
    location: "Đà Nẵng / Online",
    shortBio: "Chuyên gia Handstand, Mobility & Phục hồi chức năng vận động khớp.",
    about:
      "Calisthenics không chỉ là sức mạnh mà còn là sự kiểm soát cơ thể và độ linh hoạt hoàn hảo. Tôi giúp học viên vượt qua nỗi sợ mất thăng bằng, làm chủ Handstand (trồng chuối), tăng tầm vận động của khớp vai, hông và cột sống.",
    specialties: ["Handstand & Thăng bằng tay", "Linh hoạt khớp (Mobility & Flexibility)", "Phục hồi cổ tay & vai"],
    skills: ["One Arm Handstand", "Press to Handstand", "Pancake Stretch", "Middle Split"],
    achievements: [
      {
        id: "ach-8",
        title: "Chứng chỉ HLV Vận Động Khớp Functional Range Conditioning (FRC)",
        category: "certificate",
        year: "2022",
        organization: "Functional Anatomy Seminars",
        isVerified: true,
        proofBadge: "FRC® Mobility Specialist",
      },
      {
        id: "ach-9",
        title: "Huy chương Bạc Thể Dục Dụng Cụ Nghệ Thuật Đại Học 2020",
        category: "competition",
        year: "2020",
        organization: "National University Sports",
        isVerified: true,
        proofBadge: "Huy chương Bạc Quốc Gia",
      },
    ],
    personalRecords: [
      { skill: "Freestanding Handstand Hold", record: "3 phút 45 giây", category: "Balance" },
      { skill: "Press to Handstand liên tục", record: "12 lần", category: "Balance & Core" },
      { skill: "Xoạc ngang (Middle Split)", record: "180 độ phẳng", category: "Flexibility" },
    ],
    reviews: [
      {
        studentName: "Bùi Phương Mai",
        rating: 5,
        comment: "Trước đây mình bị đau cổ tay khi chống đẩy, sau khóa Mobility của chị Huyền cổ tay khỏe hẳn và đã giữ được Handstand 30s!",
        achievedGoal: "Handstand 30s & Hết đau cổ tay",
        date: "Tháng 8, 2026",
      },
    ],
    trainingOptions: [
      {
        title: "Khóa Làm Chủ Handstand Từ Gốc (0 - 60s)",
        description: "Học kiểm soát vai, ngón tay, đường thẳng cơ thể và các biến thể thăng bằng tay.",
        format: "1-on-1 Online",
        duration: "8 Tuần",
        price: "1.600.000 đ / khóa",
      },
    ],
  },
  {
    id: "coach-hoang-nam",
    name: "Trịnh Hoàng Nam",
    nickname: "Nam Cali",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80",
    role: "Senior Coach",
    experienceYears: 5,
    rating: 4.92,
    reviewCount: 110,
    activeStudents: 30,
    location: "Hà Nội / Online",
    shortBio: "HLV chuyên sâu cho người mới bắt đầu (Beginner to Intermediate) và Calisthenics cơ bản.",
    about:
      "Tập trung xây dựng nền tảng hít xà, chống đẩy, xà kép chuẩn sinh cơ học cho người mới từ con số 0. Phương pháp đào tạo kiên nhẫn, dễ hiểu và truyền cảm hứng cao.",
    specialties: ["Nền tảng cho người mới", "Tăng số lần Pull-up / Push-up", "Kỷ luật luyện tập tại nhà"],
    skills: ["Strict Form Pull-ups (35 reps)", "Dips (+50kg)", "L-Sit (45s)", "Skin the Cat"],
    achievements: [
      {
        id: "ach-10",
        title: "Chứng nhận Huấn luyện viên Calisthenics Nền tảng ACE-CPT",
        category: "certificate",
        year: "2021",
        organization: "American Council on Exercise",
        isVerified: true,
        proofBadge: "ACE Certified Personal Trainer",
      },
      {
        id: "ach-11",
        title: "Sáng lập Cộng đồng Calisthenics 50,000+ Thành viên",
        category: "education",
        year: "2020",
        organization: "CaliVN Community",
        isVerified: true,
        proofBadge: "Cộng đồng tiêu biểu",
      },
    ],
    personalRecords: [
      { skill: "Hít đất chuẩn form không nghỉ", record: "85 lần", category: "Endurance" },
      { skill: "Hít xà đơn chuẩn form", record: "32 lần", category: "Endurance" },
      { skill: "L-Sit Hold trên xà đơn", record: "50 giây", category: "Core" },
    ],
    reviews: [
      {
        studentName: "Nguyễn Quốc Bảo",
        rating: 5,
        comment: "Từ một người không hít nổi 1 cái xà đơn, sau 2 tháng dưới sự kèm cặp của Coach Nam mình đã kéo được 8 cái chuẩn form!",
        achievedGoal: "Từ 0 lên 8 Pull-ups chuẩn",
        date: "Tháng 8, 2026",
      },
    ],
    trainingOptions: [
      {
        title: "Khóa Lột Xác Cho Người Mới (Zero to Hero)",
        description: "Xây dựng thói quen, sửa form từ bài cơ bản nhất, hướng dẫn dinh dưỡng bình dân hiệu quả.",
        format: "1-on-1 Online",
        duration: "8 Tuần",
        price: "1.400.000 đ / tháng",
      },
    ],
  },
];
