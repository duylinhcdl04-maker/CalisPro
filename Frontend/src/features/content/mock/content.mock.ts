import { ContentItem, ContentKPIs } from "../types/content.types";

export const MOCK_CONTENT_KPIS: ContentKPIs = {
  totalPublished: 48,
  totalViewsMonthly: 184500,
  activeEventsAndChallenges: 6,
  totalRegistrations: 2840,
  viewsGrowth: 24.8,
  publishedGrowth: 15.2,
};

export const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    id: "cnt-001",
    type: "CHALLENGE",
    title: "CalisHealth Summer Challenge 2026: Bứt phá giới hạn Calisthenics",
    slug: "calishealth-summer-challenge-2026",
    shortDescription: "Thử thách tích lũy điểm thể lực, ghi nhận kỷ lục Push-up & Pull-up bằng AI Motion Tracking trong 30 ngày để giành phần thưởng đến 15,000,000đ.",
    content: `## Giới thiệu Thử thách

Chào mừng toàn thể cộng đồng **CalisHealth** đến với giải đấu thể chất mùa hè thường niên lớn nhất năm 2026!

### 🎯 Mục tiêu & Cách thức tham gia
1. **Thời gian**: Diễn ra xuyên suốt từ ngày **01/06/2026** đến hết ngày **30/06/2026**.
2. **Hình thức**: Sử dụng tính năng **AI Motion Analysis** trên ứng dụng CalisHealth để quay video thực hiện các bài tập chuẩn form (Pull-up, Push-up, Muscle-up, Dips).
3. **Chấm điểm tự động**: AI Vision sẽ tự động nhận diện form hợp lệ, đếm rep chuẩn và xếp hạng real-time trên Bảng xếp hạng Toàn quốc.

### 🏆 Cơ cấu Giải thưởng
- **Giải Nhất**: 1 Năm Gói Hội viên Calis Premium + Bộ Dụng cụ CalisPro Carbon + 5.000.000đ Tiền mặt.
- **Giải Nhì & Ba**: Gói Pro 6 tháng + Áo thể thao CalisHealth Limited Edition.
- **Top 50 Hoàn thành**: Huy hiệu độc quyền "Summer Warrior 2026" vĩnh viễn trên Profile.`,
    coverImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "HLV Đặng Tuấn Kiệt",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: "Head Coach & Content Lead",
    },
    category: "Thử thách & Giải đấu",
    tags: ["SummerChallenge", "PushUp", "AIMotion", "Leaderboard"],
    status: "PUBLISHED",
    audience: {
      targetPlan: "ALL",
      targetLevel: "ALL",
    },
    featured: true,
    pinnedToHome: true,
    challengeDetails: {
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      rulesSummary: "Mỗi video ghi nhận qua AI Motion đạt chuẩn tối thiểu 80% độ chuẩn form khớp.",
      targetGoal: "Tích lũy tối thiểu 500 điểm reps trong 30 ngày",
      rewardDescription: "Tổng giá trị giải thưởng 15.000.000đ + Huy hiệu độc quyền",
      leaderboardEnabled: true,
      maxParticipants: 5000,
      currentParticipants: 1842,
    },
    analytics: {
      views: 42800,
      uniqueViews: 31200,
      clicks: 8640,
      shares: 1240,
      likes: 3890,
      registrations: 1842,
      engagementRate: 24.6,
    },
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-28T14:30:00Z",
    publishedAt: "2026-06-01T00:00:00Z",
    createdBy: "admin_kiet",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-002",
    type: "EVENT",
    title: "Workshop Offline: Chinh phục Muscle-up & Front Lever chuẩn sinh cơ học",
    slug: "workshop-offline-muscle-up-front-lever-hanoi",
    shortDescription: "Gặp gỡ trực tiếp đội ngũ Master Coach CalisHealth tại Hà Nội, chỉnh sửa kỹ thuật 1-1 và trải nghiệm trực tiếp hệ thống AI Motion Camera 3D.",
    content: `## Thông tin Sự kiện Offline

Buổi Workshop kỹ thuật chuyên sâu dành cho các học viên muốn bứt phá từ trình độ Trung cấp lên Nâng cao, làm chủ 2 skill đỉnh cao của Calisthenics: **Muscle-up** và **Front Lever**.

### 📌 Nội dung chương trình:
- **08:30 - 09:00**: Check-in & Đo chỉ số thể chất InBody / AI Assessment.
- **09:00 - 10:30**: Phân tích giải phẫu học cơ bắp và chuyển động phát lực bùng nổ (Explosive Pull).
- **10:30 - 11:30**: Thực hành chỉnh form 1-1 trên xà đơn cùng Master Coach.
- **11:30 - 12:00**: Q&A, giao lưu cộng đồng và nhận quà tặng độc quyền.`,
    coverImage: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "Master Coach Hoàng Nam",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
      role: "Vận động viên Thể dục dụng cụ & Calisthenics",
    },
    category: "Sự kiện & Workshop",
    tags: ["Workshop", "MuscleUp", "FrontLever", "Offline"],
    status: "PUBLISHED",
    audience: {
      targetPlan: "PRO",
      targetLevel: "INTERMEDIATE",
    },
    featured: true,
    pinnedToHome: false,
    eventDetails: {
      startDate: "2026-07-15T08:30:00Z",
      endDate: "2026-07-15T12:00:00Z",
      location: "CalisHealth Training Center, 18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
      isOnline: false,
      registrationUrl: "https://calishealth.vn/events/workshop-hanoi-2026",
      maxParticipants: 80,
      currentParticipants: 76,
      organizer: "Ban Chuyên môn CalisHealth",
    },
    analytics: {
      views: 18500,
      uniqueViews: 14200,
      clicks: 4320,
      shares: 610,
      likes: 1540,
      registrations: 76,
      engagementRate: 28.2,
    },
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-06-25T11:00:00Z",
    publishedAt: "2026-06-26T08:00:00Z",
    createdBy: "admin_nam",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-003",
    type: "PRODUCT_UPDATE",
    title: "Cập nhật ứng dụng v2.4.0: Ra mắt AI Live Pose Tracker & Bản đồ Cơ bắp 3D",
    slug: "app-update-v2-4-0-ai-live-pose-tracker",
    shortDescription: "Nâng cấp thuật toán Computer Vision giảm độ trễ 40%, bổ sung biểu đồ phục hồi cơ bắp thông minh và đồng bộ dữ liệu Apple Health / Garmin.",
    content: `## Bản cập nhật CalisHealth v2.4.0

Chúng tôi hân hạnh giới thiệu bản cập nhật lớn nhất quý 3/2026 mang đến trải nghiệm tập luyện liền mạch và chính xác hơn bao giờ hết!

### 🚀 Có gì mới trong bản v2.4.0?
1. **AI Live Pose Estimation 2.0**:
   - Nhận diện khớp xương 33 điểm với độ trễ cực thấp (<25ms).
   - Cảnh báo âm thanh giọng nói real-time khi gập lưng sai tư thế hoặc không khóa khuỷu tay.
2. **Bản đồ Phục hồi Cơ bắp 3D**:
   - Thể hiện trực quan nhóm cơ nào đang quá tải (Ngực, Lưng xô, Vai, Core) để đề xuất ngày nghỉ (Rest Day) tối ưu.
3. **Tích hợp Đồng hồ thông minh**:
   - Tự động đồng bộ nhịp tim và calo đốt cháy từ Apple Watch, Garmin, và Samsung Galaxy Watch.`,
    coverImage: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "CalisHealth Tech Team",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
      role: "Product Engineering",
    },
    category: "Cập nhật Sản phẩm",
    tags: ["ProductUpdate", "AIVision", "Version24", "Changelog"],
    status: "PUBLISHED",
    audience: {
      targetPlan: "ALL",
      targetLevel: "ALL",
    },
    featured: false,
    pinnedToHome: false,
    productUpdateDetails: {
      version: "v2.4.0",
      releaseDate: "2026-08-15",
      highlightFeatures: [
        "AI Live Pose Tracker <25ms",
        "Bản đồ phục hồi cơ bắp 3D",
        "Đồng bộ Apple Watch & Garmin",
        "Sửa lỗi đăng nhập vân tay trên Android 15",
      ],
      changelog: "Chi tiết: Tối ưu 40% pin khi bật camera AI, nâng cao độ chính xác bài Pistol Squat và Handstand Push-up.",
    },
    analytics: {
      views: 31200,
      uniqueViews: 26800,
      clicks: 9100,
      shares: 420,
      likes: 2450,
      engagementRate: 19.8,
    },
    createdAt: "2026-08-10T14:00:00Z",
    updatedAt: "2026-08-14T16:00:00Z",
    publishedAt: "2026-08-15T07:00:00Z",
    createdBy: "tech_lead",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-004",
    type: "REWARD",
    title: "Voucher 500,000₫ Mua Dụng cụ CalisPro dành cho Hội viên đạt Chuỗi 30 Ngày",
    slug: "reward-voucher-500k-calispro-streak-30-days",
    shortDescription: "Phần thưởng ghi nhận nỗ lực rèn luyện kỷ luật thép. Đổi ngay mã giảm giá mua Dây kháng lực, Parallettes hoặc Vòng treo Gymnastic Rings.",
    content: `## Phần thưởng Chuỗi Kỷ luật 30 Ngày

Chúc mừng bạn đã duy trì chuỗi tập luyện không đứt đoạn trong suốt 30 ngày! Sự bền bỉ của bạn là minh chứng rõ nhất cho tinh thần Calisthenics.

### 🎁 Thông tin Voucher:
- **Giá trị**: Giảm trực tiếp 500,000đ cho đơn hàng phụ kiện từ 1,000,000đ tại CalisPro Store.
- **Áp dụng**: Tất cả các sản phẩm Vòng treo gỗ Birch, Xà đơn gắn cửa trợ lực, Phấn tập Gym không bụi.
- **Hạn sử dụng**: 45 ngày kể từ ngày nhận mã trong ứng dụng.`,
    coverImage: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "Ban Quản lý Hội viên",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop",
      role: "Member Engagement & Rewards",
    },
    category: "Giải thưởng & Ưu đãi",
    tags: ["Reward", "Streak30", "Voucher", "CalisPro"],
    status: "PUBLISHED",
    audience: {
      targetPlan: "ALL",
      targetLevel: "ALL",
      minStreakDays: 30,
    },
    featured: false,
    pinnedToHome: false,
    rewardDetails: {
      rewardType: "VOUCHER",
      rewardValue: "500,000 ₫",
      eligibilityRequirement: "Tập luyện tối thiểu 3 buổi/tuần và duy trì streak 30 ngày",
      totalQuantity: 500,
      claimedQuantity: 312,
      claimDeadline: "2026-12-31",
      voucherCode: "CALISSTREAK30X",
    },
    analytics: {
      views: 22400,
      uniqueViews: 18200,
      clicks: 7420,
      shares: 310,
      likes: 1890,
      registrations: 312,
      engagementRate: 34.5,
    },
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
    publishedAt: "2026-07-01T09:00:00Z",
    createdBy: "admin_rewards",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-005",
    type: "COMMUNITY",
    title: "Buổi Giao lưu Cộng đồng CalisHealth Sài Gòn tại Công viên Tao Đàn",
    slug: "cong-dong-calishealth-offline-sai-gon-tao-dan",
    shortDescription: "Hơn 120 anh em calisthenics Sài Gòn đã tụ họp giao lưu freestyle, thi đấu hít đất tiếp sức và trao đổi kinh nghiệm dinh dưỡng tăng cơ nạc.",
    content: `## Hoạt động Cộng đồng CalisHealth Saigon Meetup

Một ngày cuối tuần rực lửa cùng hơn 120 học viên và các HLV đại diện CalisHealth khu vực phía Nam!

### 📸 Điểm nhấn buổi offline:
- Cuộc thi Mini Game: Ai gập bụng và giữ Plank lâu nhất nhận ngay gói quà tặng CalisHealth.
- Hướng dẫn chỉnh tư thế Handstand từ các vận động viên Freestyle chuyên nghiệp.
- Cùng nhau thưởng thức Protein Smoothie và chia sẻ lộ trình tăng cơ giảm mỡ chuẩn khoa học.`,
    coverImage: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "Trần Minh Quang",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&auto=format&fit=crop",
      role: "Community Manager",
    },
    category: "Cộng đồng & Hoạt động",
    tags: ["Community", "Meetup", "SaiGon", "TaoDan"],
    status: "PUBLISHED",
    audience: {
      targetPlan: "ALL",
      targetLevel: "ALL",
    },
    featured: false,
    pinnedToHome: false,
    communityDetails: {
      activityName: "CalisHealth Saigon Community Meetup #04",
      location: "Khu xà đơn Công viên Tao Đàn, Quận 1, TP. Hồ Chí Minh",
      eventDate: "2026-08-20",
      galleryImages: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop",
      ],
      participantCount: 124,
    },
    analytics: {
      views: 14600,
      uniqueViews: 11800,
      clicks: 2940,
      shares: 880,
      likes: 2130,
      engagementRate: 21.4,
    },
    createdAt: "2026-08-21T10:00:00Z",
    updatedAt: "2026-08-21T10:00:00Z",
    publishedAt: "2026-08-21T11:00:00Z",
    createdBy: "admin_quang",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-006",
    type: "NEWS",
    title: "Chế độ dinh dưỡng Calisthenics: Tăng cơ nạc tối ưu không cần tạ",
    slug: "che-do-dinh-duong-calisthenics-tang-co-nac",
    shortDescription: "Phân tích khoa học lượng Protein, Carb và Fat cần thiết cho người tập Bodyweight Training để tối ưu tỷ lệ sức mạnh trên trọng lượng cơ thể (Strength-to-Weight Ratio).",
    content: `## Khoa học Dinh dưỡng cho Vận động viên Calisthenics

Khác với thể hình cử tạ truyền thống, Calisthenics đòi hỏi bạn phải di chuyển chính cơ thể của mình trong không gian. Do đó, mục tiêu dinh dưỡng là tối đa hóa sức mạnh tương đối (Relative Strength) thay vì tăng kích thước cơ bắp đồ sộ mà nặng nề.

### 🥗 3 Nguyên tắc Dinh dưỡng Vàng:
1. **Lượng Protein lý tưởng**: 1.8g - 2.2g Protein / kg trọng lượng cơ thể.
2. **Carbohydrate phức hợp**: Nguồn năng lượng glycogen cho các bài tập bùng nổ (Yến mạch, Khoai lang, Gạo lứt).
3. **Bổ sung Điện giải & Nước**: Đảm bảo khớp và cơ bắp luôn được bôi trơn và hồi phục nhanh.`,
    coverImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "Chuyên gia Dinh dưỡng Lê Thu Hà",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      role: "Clinical Nutritionist",
    },
    category: "Cẩm nang & Dinh dưỡng",
    tags: ["Nutrition", "Protein", "StrengthToWeight", "Science"],
    status: "PUBLISHED",
    audience: {
      targetPlan: "ALL",
      targetLevel: "ALL",
    },
    featured: false,
    pinnedToHome: false,
    analytics: {
      views: 39100,
      uniqueViews: 32400,
      clicks: 8120,
      shares: 1450,
      likes: 3120,
      engagementRate: 22.3,
    },
    createdAt: "2026-07-12T09:00:00Z",
    updatedAt: "2026-07-15T10:00:00Z",
    publishedAt: "2026-07-15T12:00:00Z",
    createdBy: "dr_ha",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-007",
    type: "EVENT",
    title: "Livestream Hỏi & Đáp: Lộ trình từ 0 lên 10 Muscle-up chuẩn form",
    slug: "livestream-qa-lo-trinh-muscle-up-chuan-form",
    shortDescription: "Gặp gỡ trực tuyến cùng Top 3 Vận động viên Calisthenics Vietnam, giải đáp mọi lỗi sai khuỷu tay và kỹ thuật False Grip.",
    content: `Buổi phát trực tiếp độc quyền trên ứng dụng CalisHealth với các chủ đề: kỹ thuật False grip, chuyển tiếp transition phase và các bài tập bổ trợ xà đơn.`,
    coverImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "HLV Đặng Tuấn Kiệt",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: "Head Coach",
    },
    category: "Livestream & Trực tuyến",
    tags: ["Livestream", "MuscleUp", "Online"],
    status: "SCHEDULED",
    scheduledAt: "2026-10-05T19:30:00Z",
    audience: {
      targetPlan: "PREMIUM",
      targetLevel: "INTERMEDIATE",
    },
    featured: false,
    pinnedToHome: false,
    eventDetails: {
      startDate: "2026-10-05T19:30:00Z",
      endDate: "2026-10-05T21:00:00Z",
      location: "CalisHealth Live Studio (In-App Stream)",
      isOnline: true,
      meetingUrl: "https://calishealth.vn/live/muscle-up-mastery",
      maxParticipants: 1000,
      currentParticipants: 420,
      organizer: "CalisHealth Academy",
    },
    analytics: {
      views: 8900,
      uniqueViews: 7100,
      clicks: 1940,
      shares: 210,
      likes: 640,
      registrations: 420,
      engagementRate: 24.1,
    },
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-22T15:00:00Z",
    createdBy: "admin_kiet",
    approvedBy: "super_admin",
  },
  {
    id: "cnt-008",
    type: "NEWS",
    title: "Bản thảo: Kỹ thuật Handstand Press và cách khắc phục đau cổ tay",
    slug: "ky-thuat-handstand-press-va-phong-tranh-chan-thuong-co-tay",
    shortDescription: "Hướng dẫn khởi động cổ tay nâng cao, sử dụng Parallettes đúng cách và các bước bổ trợ lên ép chuối tĩnh.",
    content: `Bản thảo đang trong quá trình biên tập và kiểm định y khoa bởi ban cố vấn phục hồi chức năng CalisHealth.`,
    coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop",
    author: {
      name: "HLV Đặng Tuấn Kiệt",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      role: "Head Coach",
    },
    category: "Kỹ thuật & Phục hồi",
    tags: ["Handstand", "WristHealth", "Recovery"],
    status: "REVIEW",
    audience: {
      targetPlan: "ALL",
      targetLevel: "ADVANCED",
    },
    featured: false,
    pinnedToHome: false,
    analytics: {
      views: 0,
      uniqueViews: 0,
      clicks: 0,
      shares: 0,
      likes: 0,
      engagementRate: 0,
    },
    createdAt: "2026-09-25T14:00:00Z",
    updatedAt: "2026-09-27T10:00:00Z",
    createdBy: "admin_kiet",
  },
];
