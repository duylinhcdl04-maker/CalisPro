import type {
  Achievement,
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventType,
  ChatMessage,
  CoachNotification,
  Conversation,
  MessageKind,
  MessageSender,
} from "../types";
import { studentRef } from "./students.mock";
import { atDay, daysAgo, minutesAgo } from "./helpers";

/* ----------------------------------- Messages ----------------------------------- */

type MsgSeed = [sender: MessageSender, kind: MessageKind, content: string, minutesAgo: number, attachment?: ChatMessage["attachment"]];

const THREADS: { studentId: string; online: boolean; messages: MsgSeed[] }[] = [
  {
    studentId: "stu-001",
    online: true,
    messages: [
      ["COACH", "FEEDBACK", "Buổi push hôm qua AI ghi nhận khuỷu tay bị mở ở các rep cuối. Em thấy mỏi vai không?", 1300],
      ["STUDENT", "WORKOUT_QUESTION", "Dạ có ạ, set 3-4 vai phải hơi mỏi. Em có nên giảm số rep không thầy?", 1240],
      ["COACH", "RECOMMENDATION", "Tuần này giảm còn 4×8, thêm scapular push-up 2×12 khởi động. Giữ khuỷu ~45° nhé.", 1200],
      ["STUDENT", "TEXT", "Dạ em cảm ơn thầy 🙏", 1195],
      ["STUDENT", "ASSESSMENT_QUESTION", "Thầy ơi kết quả đánh giá hôm qua mobility em bị giảm, em cần tập thêm gì ạ?", 42],
    ],
  },
  {
    studentId: "stu-002",
    online: false,
    messages: [
      ["COACH", "TEXT", "Bảo ơi, mấy hôm nay chưa thấy em tập. Mọi chuyện ổn chứ?", 2900],
      ["STUDENT", "TEXT", "Em đang chạy ca đêm cả tuần thầy ạ, về là ngủ luôn 😅", 2600],
      ["COACH", "WORKOUT_PLAN", "Thầy gửi em bản rút gọn 25 phút, tập lúc nào cũng được.", 2580, { type: "PLAN", refId: "plan-003", title: "Fat Loss Conditioning 6W" }],
    ],
  },
  {
    studentId: "stu-004",
    online: true,
    messages: [
      ["STUDENT", "TEXT", "Thầy ơi em giữ được freestanding handstand 22 giây rồi!! 🎉", 180],
      ["COACH", "FEEDBACK", "Tuyệt vời Hà! Tuần sau mình bắt đầu press handstand drill.", 150],
      ["STUDENT", "WORKOUT_QUESTION", "Em có cần thay đổi bài L-sit không ạ?", 25],
    ],
  },
  {
    studentId: "stu-009",
    online: false,
    messages: [
      ["STUDENT", "WORKOUT_QUESTION", "Vai phải em vẫn hơi đau khi dips, em có nên bỏ hẳn không thầy?", 400],
      ["COACH", "RECOMMENDATION", "Tạm thay dips bằng decline push-up 2 tuần. Nếu vẫn đau khi nghỉ thì đi khám nhé.", 360],
    ],
  },
  {
    studentId: "stu-003",
    online: true,
    messages: [
      ["COACH", "TEXT", "Châu nhớ làm bài đánh giá tháng này nhé, đã quá hạn 3 ngày rồi.", 1500],
      ["STUDENT", "TEXT", "Dạ mai em làm luôn ạ.", 1420],
    ],
  },
  {
    studentId: "stu-005",
    online: false,
    messages: [
      ["STUDENT", "TEXT", "Em vừa làm được 5 strict muscle-up liên tục thầy ơi 💪", 4300],
      ["COACH", "FEEDBACK", "Quá đỉnh Huy! PR mới đã được ghi nhận.", 4200],
    ],
  },
  {
    studentId: "stu-007",
    online: false,
    messages: [["STUDENT", "WORKOUT_QUESTION", "Tempo 2-0-1-0 là hạ 2 giây đúng không thầy?", 95]],
  },
  {
    studentId: "stu-012",
    online: true,
    messages: [
      ["COACH", "TEXT", "Ngọc ơi tuần 6 mình tăng 1 set cho diamond push-up nhé.", 3000],
      ["STUDENT", "TEXT", "Ok thầy ạ!", 2950],
    ],
  },
];

export const MESSAGES: ChatMessage[] = [];
export const CONVERSATIONS: Conversation[] = THREADS.map((thread, t) => {
  const conversationId = `conv-${String(t + 1).padStart(3, "0")}`;
  thread.messages.forEach(([sender, kind, content, ago, attachment], m) => {
    MESSAGES.push({
      id: `${conversationId}-m${m + 1}`,
      conversationId,
      sender,
      kind,
      content,
      attachment: attachment ?? null,
      sentAt: minutesAgo(ago),
      read: sender === "COACH" || m < thread.messages.length - 1 || ago > 600,
    });
  });
  const last = thread.messages[thread.messages.length - 1];
  return {
    id: conversationId,
    ...studentRef(thread.studentId),
    lastMessage: last[2],
    lastMessageAt: minutesAgo(last[3]),
    unreadCount: MESSAGES.filter((msg) => msg.conversationId === conversationId && !msg.read).length,
    online: thread.online,
  };
});

/* --------------------------------- Notifications --------------------------------- */

export const NOTIFICATIONS: CoachNotification[] = [
  { id: "ntf-001", type: "AI", severity: "critical", title: "Học viên cần review form", message: "Nguyễn Minh Anh: form score Push Up giảm 87 → 71.", createdAt: minutesAgo(35), read: false, href: "/coach/students/stu-001" },
  { id: "ntf-002", type: "ACHIEVEMENT", severity: "success", title: "PR mới", message: "Phạm Thu Hà giữ freestanding handstand 22 giây.", createdAt: minutesAgo(180), read: false, href: "/coach/students/stu-004" },
  { id: "ntf-003", type: "ASSESSMENT", severity: "warning", title: "Đánh giá quá hạn", message: "Lê Hoàng Châu chưa làm Monthly Assessment (quá hạn 3 ngày).", createdAt: minutesAgo(300), read: false, href: "/coach/assessments?status=OVERDUE" },
  { id: "ntf-004", type: "WORKOUT", severity: "info", title: "Hoàn thành buổi tập", message: "Bùi Tuấn Kiệt vừa hoàn thành Push Strength (48 phút).", createdAt: minutesAgo(420), read: false, href: "/coach/sessions" },
  { id: "ntf-005", type: "STUDENT", severity: "critical", title: "Học viên không hoạt động", message: "Trần Quốc Bảo đã 6 ngày chưa tập.", createdAt: minutesAgo(600), read: false, href: "/coach/students/stu-002" },
  { id: "ntf-006", type: "ASSESSMENT", severity: "info", title: "Đánh giá cần review", message: "Phạm Thu Hà đã hoàn thành Skill Benchmark Test.", createdAt: minutesAgo(700), read: true, href: "/coach/assessments?status=NEEDS_REVIEW" },
  { id: "ntf-007", type: "STUDENT", severity: "warning", title: "Ghi chú chấn thương", message: "Ngô Thanh Tùng báo đau vai phải khi dips.", createdAt: daysAgo(1, 19), read: true, href: "/coach/students/stu-009" },
  { id: "ntf-008", type: "ACHIEVEMENT", severity: "success", title: "Streak 30 ngày", message: "Võ Đức Huy đạt chuỗi 34 ngày tập liên tục.", createdAt: daysAgo(1, 8), read: true, href: "/coach/students/stu-005" },
  { id: "ntf-009", type: "AI", severity: "info", title: "Báo cáo AI tuần", message: "42 phiên tập được phân tích, form trung bình tăng 2.1 điểm.", createdAt: daysAgo(2, 8), read: true, href: "/coach/ai-analysis" },
  { id: "ntf-010", type: "WORKOUT", severity: "warning", title: "Bỏ lỡ buổi tập", message: "Hoàng Gia Hân bỏ lỡ 2 buổi theo giáo án tuần này.", createdAt: daysAgo(2, 20), read: true, href: "/coach/students/stu-008" },
  { id: "ntf-011", type: "STUDENT", severity: "info", title: "Học viên mới được phân công", message: "Tôn Nữ Minh Thư đã được gán cho bạn.", createdAt: daysAgo(6, 10), read: true, href: "/coach/students/stu-022" },
  { id: "ntf-012", type: "SYSTEM", severity: "info", title: "Cập nhật AI Motion", message: "CalisVision Pose v2.4 đã hỗ trợ phân tích Pistol Squat.", createdAt: daysAgo(4, 9), read: true, href: null },
  { id: "ntf-013", type: "SYSTEM", severity: "info", title: "Bảo trì hệ thống", message: "Bảo trì định kỳ 02:00-03:00 Chủ nhật này.", createdAt: daysAgo(5, 9), read: true, href: null },
  { id: "ntf-014", type: "ACHIEVEMENT", severity: "success", title: "Lên cấp", message: "Trịnh Bảo Ngọc đạt cấp Advanced.", createdAt: daysAgo(7, 9), read: true, href: "/coach/students/stu-012" },
];

/* ----------------------------------- Calendar ----------------------------------- */

type EventSeed = [day: number, startHour: number, startMin: number, durationMin: number, type: CalendarEventType, studentId: string | null, title: string, location: string, cancelled?: boolean];

const EVENT_SEEDS: EventSeed[] = [
  [0, 9, 0, 60, "ASSESSMENT", "stu-006", "Initial Assessment", "Studio A"],
  [0, 10, 30, 30, "WORKOUT_REVIEW", "stu-002", "Workout Review", "Online · Google Meet"],
  [0, 14, 0, 45, "PROGRESS_REVIEW", "stu-003", "Progress Review", "Studio A"],
  [0, 16, 30, 60, "COACHING_SESSION", "stu-004", "1:1 Handstand Coaching", "Studio B"],
  [0, 19, 0, 30, "WORKOUT_REVIEW", "stu-007", "AI Form Review: Push Up", "Online · Zoom", true],
  [1, 8, 30, 60, "ASSESSMENT", "stu-022", "Initial Assessment", "Studio A"],
  [1, 11, 0, 45, "COACHING_SESSION", "stu-001", "Scapular Control Session", "Studio B"],
  [1, 15, 0, 30, "PROGRESS_REVIEW", "stu-012", "Hypertrophy Check-in", "Online · Google Meet"],
  [2, 9, 30, 60, "ASSESSMENT", "stu-010", "Monthly Assessment", "Studio A"],
  [2, 17, 0, 60, "COACHING_SESSION", "stu-005", "Muscle-up Technique", "Outdoor Park"],
  [3, 10, 0, 30, "WORKOUT_REVIEW", "stu-009", "Shoulder Check & Plan Adjust", "Studio A"],
  [4, 9, 0, 60, "ASSESSMENT", "stu-015", "Monthly Assessment", "Studio A"],
  [4, 14, 0, 90, "COACHING_SESSION", null, "Group Class: Pull-up Clinic", "Studio B"],
  [6, 10, 0, 45, "PROGRESS_REVIEW", "stu-008", "Adherence Check-in", "Online · Zoom"],
  [8, 9, 0, 60, "ASSESSMENT", "stu-016", "Monthly Assessment", "Studio A"],
  [10, 16, 0, 60, "COACHING_SESSION", "stu-017", "Front Lever Progression", "Studio B"],
  [13, 9, 0, 60, "ASSESSMENT", "stu-018", "Monthly Assessment", "Studio A"],
  [-1, 9, 0, 60, "ASSESSMENT", "stu-001", "Monthly Assessment", "Studio A"],
  [-1, 15, 0, 30, "WORKOUT_REVIEW", "stu-014", "Workout Review", "Online · Google Meet"],
  [-2, 10, 0, 45, "PROGRESS_REVIEW", "stu-012", "Monthly Progress Review", "Studio A"],
  [-3, 17, 0, 60, "COACHING_SESSION", "stu-004", "1:1 Handstand Coaching", "Studio B"],
  [-5, 9, 0, 60, "ASSESSMENT", "stu-009", "Monthly Assessment", "Studio A"],
  [-7, 14, 0, 90, "COACHING_SESSION", null, "Group Class: Core Foundations", "Studio B"],
  [-9, 10, 0, 30, "WORKOUT_REVIEW", "stu-003", "Workout Review", "Online · Zoom", true],
];

function statusFor(start: Date, end: Date, cancelled: boolean): CalendarEventStatus {
  if (cancelled) return "CANCELLED";
  const now = Date.now();
  if (end.getTime() < now) return "COMPLETED";
  if (start.getTime() <= now) return "IN_PROGRESS";
  return "UPCOMING";
}

export const CALENDAR_EVENTS: CalendarEvent[] = EVENT_SEEDS.map(([day, h, m, duration, type, studentId, title, location, cancelled], i) => {
  const start = new Date(atDay(day, h, m));
  const end = new Date(start.getTime() + duration * 60_000);
  const ref = studentId ? studentRef(studentId) : null;
  return {
    id: `evt-${String(i + 1).padStart(3, "0")}`,
    title,
    type,
    studentId,
    studentName: ref?.studentName ?? null,
    studentAvatar: ref?.studentAvatar ?? null,
    start: start.toISOString(),
    end: end.toISOString(),
    status: statusFor(start, end, !!cancelled),
    location,
    notes: "",
  };
});

/* --------------------------------- Achievements --------------------------------- */

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ach-001", ...studentRef("stu-004"), type: "PR", title: "Freestanding Handstand", detail: "22 giây (+7s)", achievedAt: minutesAgo(180) },
  { id: "ach-002", ...studentRef("stu-005"), type: "STREAK", title: "Streak 34 ngày", detail: "Chuỗi dài nhất từ trước đến nay", achievedAt: daysAgo(0, 7) },
  { id: "ach-003", ...studentRef("stu-012"), type: "LEVEL_UP", title: "Lên Advanced", detail: "Fitness score đạt 83", achievedAt: daysAgo(1, 18) },
  { id: "ach-004", ...studentRef("stu-021"), type: "PR", title: "Pull Up", detail: "18 reps (+2)", achievedAt: daysAgo(1, 19) },
  { id: "ach-005", ...studentRef("stu-010"), type: "CHALLENGE", title: "30-Day Plank Challenge", detail: "Hoàn thành 30/30 ngày", achievedAt: daysAgo(2, 20) },
  { id: "ach-006", ...studentRef("stu-007"), type: "PR", title: "Dips", detail: "18 reps (+3)", achievedAt: daysAgo(3, 19) },
];
