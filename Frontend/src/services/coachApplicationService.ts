import { apiClient } from "../lib/api/client";

export type CoachApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export interface CertificateItem {
  id?: number;
  certificateName: string;
  issuingOrganization: string;
  issueYear?: number;
  certificateUrl: string;
}

export interface ActivityItem {
  id?: number;
  activityName: string;
  roleOrAchievement: string;
  organizer?: string;
  eventYear?: number;
  proofImageUrl?: string;
  proofLinkUrl?: string;
}

export interface CoachApplicationRequest {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber: string;
  email: string;
  location?: string;
  idCardNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  experienceYears: number;
  primarySpecialty: string;
  skillsDescription?: string;
  personalRecords?: string;
  skillDemoVideoUrl?: string;
  bio?: string;
  expectedRate?: string;
  certificates: CertificateItem[];
  activities: ActivityItem[];
}

export interface CoachApplicationResponse {
  id: number;
  userId: number;
  userEmail: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber: string;
  email: string;
  location?: string;
  idCardNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  experienceYears: number;
  primarySpecialty: string;
  skillsDescription?: string;
  personalRecords?: string;
  skillDemoVideoUrl?: string;
  bio?: string;
  expectedRate?: string;
  status: CoachApplicationStatus;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedById?: number;
  reviewedByEmail?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  certificates: CertificateItem[];
  activities: ActivityItem[];
}

export const INITIAL_MOCK_APPLICATIONS: CoachApplicationResponse[] = [
  {
    id: 101,
    userId: 2,
    userEmail: "hoangviet.calis@gmail.com",
    fullName: "Lê Hoàng Việt",
    dateOfBirth: "1998-05-14",
    gender: "Nam",
    phoneNumber: "0987654321",
    email: "hoangviet.calis@gmail.com",
    location: "Hà Nội / Online",
    idCardNumber: "001098012345",
    idCardFrontUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    idCardBackUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    experienceYears: 6,
    primarySpecialty: "Static Strength (Planche, Front Lever)",
    skillsDescription: "Full Planche (12s), Front Lever (20s), One Arm Chin-up, Victorian Cross trên Ring.",
    personalRecords: "Weighted Pull-up +65kg (1RM), Weighted Dip +80kg (1RM), 30 Strict Pull-ups.",
    skillDemoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    bio: "Hơn 6 năm tập luyện Calisthenics & Street Workout. Từng đoạt giải Nhì giải đấu Calisthenics miền Bắc 2023. Đam mê chia sẻ kỹ thuật khóa khớp vai an toàn và xây dựng nền tảng vững chắc.",
    expectedRate: "1.500.000 đ / tháng",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    certificates: [
      {
        id: 1,
        certificateName: "WSWCF Level 2 Calisthenics Trainer",
        issuingOrganization: "World Street Workout & Calisthenics Federation",
        issueYear: 2022,
        certificateUrl: "https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: 2,
        certificateName: "Huy chương Bạc Street Workout Hanoi Open 2023",
        issuingOrganization: "Hanoi Street Workout Federation",
        issueYear: 2023,
        certificateUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
      },
    ],
    activities: [
      {
        id: 1,
        activityName: "Vietnam Calisthenics Championship 2023",
        roleOrAchievement: "Huy chương Bạc Hạng cân -68kg (Static & Weighted)",
        organizer: "Liên đoàn Calisthenics Việt Nam",
        eventYear: 2023,
        proofImageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
        proofLinkUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: 2,
        activityName: "Workshop Calisthenics Khóa Khớp An Toàn & Chinh Phục Planche",
        roleOrAchievement: "Diễn giả & HLV Thị phạm chính",
        organizer: "CLB Street Workout Bách Khoa",
        eventYear: 2024,
        proofImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
        proofLinkUrl: "https://www.facebook.com",
      },
    ],
  },
  {
    id: 102,
    userId: 3,
    userEmail: "thuydung.yoga@gmail.com",
    fullName: "Phạm Thùy Dung",
    dateOfBirth: "2000-09-22",
    gender: "Nữ",
    phoneNumber: "0912345678",
    email: "thuydung.yoga@gmail.com",
    location: "TP. Hồ Chí Minh",
    idCardNumber: "079200019283",
    idCardFrontUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    idCardBackUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    experienceYears: 4,
    primarySpecialty: "Handstand & Mobility, Phục hồi vận động khớp",
    skillsDescription: "Freestanding Handstand (2 phút), Press to Handstand, Xoạc chân 180 độ, Hollow Body Hold.",
    personalRecords: "Handstand Push-up 10 reps, L-Sit 40s.",
    skillDemoVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    bio: "Chuyên gia thăng bằng tay và dẻo dai cơ khớp. Giúp người tập vượt qua nỗi sợ ngã và tăng tính linh hoạt cho vai, cột sống.",
    expectedRate: "1.200.000 đ / tháng",
    status: "UNDER_REVIEW",
    adminNotes: "Đã kiểm tra sơ bộ video Handstand form rất thẳng và kiểm soát tốt, đang đợi đối chiếu ảnh CCCD mặt sau.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    certificates: [
      {
        id: 3,
        certificateName: "FRC (Functional Range Conditioning) Mobility Specialist",
        issuingOrganization: "Functional Anatomy Seminars",
        issueYear: 2023,
        certificateUrl: "https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?w=800&auto=format&fit=crop&q=80",
      },
    ],
    activities: [
      {
        id: 3,
        activityName: "Giải Thể Dục Dụng Cụ Sinh Viên Toàn Quốc 2022",
        roleOrAchievement: "Huy chương Đồng Cầu Thăng Bằng & Thể dục tự do",
        organizer: "Bộ Giáo Dục & Đào Tạo",
        eventYear: 2022,
        proofImageUrl: "https://images.unsplash.com/photo-1589330694653-dad6d3240a2b?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
];

export async function submitCoachApplication(
  data: CoachApplicationRequest
): Promise<CoachApplicationResponse> {
  try {
    const res = await apiClient.post<CoachApplicationResponse>("/coach-applications", data);
    return res.data;
  } catch (err) {
    console.warn("Backend API error or offline, fallback to mock storage", err);
    const newApp: CoachApplicationResponse = {
      id: Date.now(),
      userId: 999,
      userEmail: data.email,
      ...data,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    INITIAL_MOCK_APPLICATIONS.unshift(newApp);
    return newApp;
  }
}

export async function getMyCoachApplication(): Promise<CoachApplicationResponse | null> {
  try {
    const res = await apiClient.get<CoachApplicationResponse>("/coach-applications/my-application");
    return res.data || null;
  } catch {
    return INITIAL_MOCK_APPLICATIONS[0] || null;
  }
}

export async function adminGetCoachApplications(params?: {
  status?: CoachApplicationStatus;
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<{ content: CoachApplicationResponse[]; totalElements: number }> {
  try {
    const res = await apiClient.get("/admin/coach-applications", { params });
    if (res.data?.content) {
      return {
        content: res.data.content,
        totalElements: res.data.totalElements ?? res.data.content.length,
      };
    }
  } catch {
    // fallback
  }

  let list = [...INITIAL_MOCK_APPLICATIONS];
  if (params?.status) {
    list = list.filter((a) => a.status === params.status);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (a) =>
        a.fullName.toLowerCase().includes(kw) ||
        a.email.toLowerCase().includes(kw) ||
        a.phoneNumber.includes(kw) ||
        a.primarySpecialty.toLowerCase().includes(kw)
    );
  }
  return { content: list, totalElements: list.length };
}

export async function adminReviewCoachApplication(
  id: number,
  reviewData: {
    status: CoachApplicationStatus;
    adminNotes?: string;
    rejectionReason?: string;
  }
): Promise<CoachApplicationResponse> {
  try {
    const res = await apiClient.post<CoachApplicationResponse>(
      `/admin/coach-applications/${id}/review`,
      reviewData
    );
    return res.data;
  } catch {
    // Fallback update mock
    const target = INITIAL_MOCK_APPLICATIONS.find((a) => a.id === id);
    if (target) {
      target.status = reviewData.status;
      target.adminNotes = reviewData.adminNotes;
      target.rejectionReason = reviewData.rejectionReason;
      target.reviewedAt = new Date().toISOString();
      return { ...target };
    }
    throw new Error("Không tìm thấy hồ sơ");
  }
}
