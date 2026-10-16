import type { CoachProfile, CoachSettings } from "../types";
import { daysAgo, minutesAgo } from "./helpers";
import { STUDENTS } from "./students.mock";

export const COACH_PROFILE: CoachProfile = {
  id: "demo-coach",
  name: "Hoàng Việt",
  email: "coach@calis.app",
  phone: "0912 345 678",
  avatarUrl: "https://i.pravatar.cc/200?img=14",
  bio: "Huấn luyện viên Calisthenics 8 năm kinh nghiệm, chuyên sức mạnh thân trên và kỹ năng handstand. Tin vào việc tập đúng kỹ thuật trước khi tăng độ khó.",
  specializations: ["Strength", "Handstand", "Mobility", "Rehab-friendly training"],
  experienceYears: 8,
  certifications: [
    { id: "cert-1", name: "Certified Calisthenics Coach (Level 2)", issuer: "World Calisthenics Organization", year: 2019 },
    { id: "cert-2", name: "NASM Certified Personal Trainer", issuer: "NASM", year: 2017 },
    { id: "cert-3", name: "Functional Range Conditioning Mobility Specialist", issuer: "FRC", year: 2021 },
  ],
  assignedStudents: STUDENTS.length,
  rating: 4.9,
  location: "TP. Hồ Chí Minh",
  languages: ["Tiếng Việt", "English"],
};

export const COACH_SETTINGS: CoachSettings = {
  notifications: {
    email: true,
    push: true,
    inApp: true,
    digest: "DAILY",
    types: { STUDENT: true, ASSESSMENT: true, WORKOUT: false, AI: true, ACHIEVEMENT: true, SYSTEM: false },
  },
  availability: [
    { day: "MON", enabled: true, start: "08:00", end: "18:00" },
    { day: "TUE", enabled: true, start: "08:00", end: "18:00" },
    { day: "WED", enabled: true, start: "08:00", end: "18:00" },
    { day: "THU", enabled: true, start: "08:00", end: "18:00" },
    { day: "FRI", enabled: true, start: "08:00", end: "17:00" },
    { day: "SAT", enabled: true, start: "09:00", end: "12:00" },
    { day: "SUN", enabled: false, start: "09:00", end: "12:00" },
  ],
  security: {
    twoFactorEnabled: false,
    lastPasswordChangeAt: daysAgo(94),
    activeSessions: [
      { id: "sess-1", device: "Chrome · Windows 11", location: "TP. Hồ Chí Minh", lastActiveAt: minutesAgo(1), current: true },
      { id: "sess-2", device: "CalisHealth iOS · iPhone 15", location: "TP. Hồ Chí Minh", lastActiveAt: minutesAgo(140), current: false },
    ],
  },
};
