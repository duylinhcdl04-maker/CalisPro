import { CoachProfileInfo, UserChatMessage, UserMessageKind } from "../types";

const STORAGE_KEY = "calis_user_coach_chat_v2";

export const DEFAULT_COACH: CoachProfileInfo = {
  id: "coach-001",
  name: "HLV Hoàng Việt",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  title: "Head Coach Calisthenics & Sức mạnh",
  badge: "Elite Master Trainer",
  experience: "7+ năm huấn luyện Calisthenics",
  rating: 4.98,
  reviewsCount: 142,
  specialties: ["Muscle-up", "Handstand", "Sửa Form AI", "Linh hoạt khớp vai"],
  online: true,
  responseRate: "~5 phút",
  bio: "Đồng hành 1-1 cùng bạn chinh phục các kỹ năng Calisthenics nâng cao an toàn và hiệu quả nhất.",
};

const INITIAL_MESSAGES: UserChatMessage[] = [
  {
    id: "msg-001",
    sender: "COACH",
    kind: "TEXT",
    content: "Chào bạn! Mình là Hoàng Việt - HLV phụ trách lộ trình Calisthenics của bạn. Chúc mừng bạn đã hoàn thành buổi test thể lực đầu vào rất ấn tượng nhé! 💪",
    sentAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    read: true,
  },
  {
    id: "msg-002",
    sender: "COACH",
    kind: "WORKOUT_RECOMMENDATION",
    content: "Dựa trên chỉ số Mobility và Strength của bạn, mình vừa cá nhân hóa giáo án tuần này để tập trung gia cố khớp vai và cơ lưng xô.",
    attachment: {
      type: "PLAN",
      title: "Lộ trình Cơ bản & Nền tảng Vai - 4 Tuần",
      duration: "45 phút / buổi • 4 buổi / tuần",
      actionLabel: "Xem giáo án ngay",
      actionUrl: "/workout/12",
    },
    sentAt: new Date(Date.now() - 3600 * 1000 * 24 * 2 + 120000).toISOString(),
    read: true,
  },
  {
    id: "msg-003",
    sender: "USER",
    kind: "TEXT",
    content: "Chào thầy ạ! Em cảm ơn thầy. Hôm nay em vừa tập bài Dips và Push-up theo giáo án, cảm giác cơ ngực vào rất tốt!",
    sentAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    read: true,
  },
  {
    id: "msg-004",
    sender: "COACH",
    kind: "FORM_FEEDBACK",
    content: "Rất tốt! Hệ thống AI Motion ghi nhận form bài Dips của bạn đạt 92/100 điểm. Lưu ý ở các rep cuối nhớ gồng chặt cơ bụng (core) để tránh võng lưng nhé.",
    attachment: {
      type: "FORM_SCORE",
      title: "Phân tích AI Motion: Bar Dips",
      score: 92,
      actionLabel: "Xem phân tích động tác",
      actionUrl: "/progress",
    },
    sentAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    read: true,
  },
  {
    id: "msg-005",
    sender: "COACH",
    kind: "TEXT",
    content: "Nếu có bất kỳ thắc mắc nào về bài tập, cảm giác mỏi cơ hoặc cần kiểm tra video động tác, bạn cứ nhắn trực tiếp ở đây cho mình nhé! 🚀",
    sentAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    read: false,
  },
];

export const userChatService = {
  getCoachInfo(): CoachProfileInfo {
    return DEFAULT_COACH;
  },

  getMessages(): UserChatMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      /* ignore */
    }
    this.saveMessages(INITIAL_MESSAGES);
    return INITIAL_MESSAGES;
  },

  saveMessages(messages: UserChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  },

  sendMessage(content: string, kind: UserMessageKind = "TEXT", attachment?: UserChatMessage["attachment"]): UserChatMessage {
    const messages = this.getMessages();
    const newMsg: UserChatMessage = {
      id: `usr-msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sender: "USER",
      kind,
      content,
      attachment: attachment ?? null,
      sentAt: new Date().toISOString(),
      read: true,
    };

    const updated = [...messages, newMsg];
    this.saveMessages(updated);
    return newMsg;
  },

  markAllAsRead(): void {
    const messages = this.getMessages();
    const updated = messages.map((m) => ({ ...m, read: true }));
    this.saveMessages(updated);
  },

  getUnreadCount(): number {
    const messages = this.getMessages();
    return messages.filter((m) => m.sender === "COACH" && !m.read).length;
  },

  clearHistory(): void {
    this.saveMessages(INITIAL_MESSAGES);
  },

  /**
   * Generates intelligent, contextual Calisthenics Coach response
   */
  generateCoachReply(userQuery: string): { reply: string; attachment?: UserChatMessage["attachment"] } {
    const lower = userQuery.toLowerCase();

    if (lower.includes("đau") || lower.includes("mỏi") || lower.includes("cổ tay") || lower.includes("vai")) {
      return {
        reply: "Chào bạn! Nếu cổ tay hoặc khớp vai bị mỏi/căng sau buổi tập, bạn nên dừng bài tải nặng ngay. Hãy làm 3 hiệp xoay cổ tay + duỗi cẳng tay 30 giây và chườm ấm nhẹ. Nếu đau nhói kéo dài trên 48h, hãy báo lại mình để điều chỉnh bài tập thay thế nhé!",
        attachment: {
          type: "PLAN",
          title: "Bài tập Phục hồi & Khởi động Cổ tay / Khớp vai (10 phút)",
          actionLabel: "Mở bài tập phục hồi",
          actionUrl: "/exercises",
        },
      };
    }

    if (lower.includes("form") || lower.includes("video") || lower.includes("xem giúp") || lower.includes("sửa")) {
      return {
        reply: "Mình đã nhận được yêu cầu sửa form của bạn! Để mình đánh giá chính xác nhất, bạn hãy quay video góc nghiêng 45 độ từ phía trước hoặc bên hông, thấy rõ từ bàn tay đến mũi chân nhé. Hệ thống AI và mình sẽ phản hồi chi tiết góc khớp cho bạn ngay!",
      };
    }

    if (lower.includes("giáo án") || lower.includes("hôm nay") || lower.includes("tập gì") || lower.includes("lộ trình")) {
      return {
        reply: "Hôm nay trong lịch tập của bạn là buổi Push & Core Focus (Hít đất biến thể, Dips và Hollow Body hold). Nhớ làm nóng khớp vai thật kỹ trước khi vào set chính nhé!",
        attachment: {
          type: "PLAN",
          title: "Buổi tập hôm nay: Upper Push & Core Conditioning",
          duration: "40 phút • 5 bài tập",
          actionLabel: "Bắt đầu tập luyện",
          actionUrl: "/workout/12",
        },
      };
    }

    if (lower.includes("muscle-up") || lower.includes("muscle up") || lower.includes("kéo xà") || lower.includes("pull-up") || lower.includes("pull up")) {
      return {
        reply: "Để lên Muscle-up mượt mà, chìa khóa là High Explosive Pull-up (kéo ngực chạm xà) và bài tập chuyển tiếp Transition trên xà thấp. Bạn đang kéo được bao nhiêu rep strict pull-up liên tục rồi?",
      };
    }

    if (lower.includes("handstand") || lower.includes("trồng chuối") || lower.includes("thăng bằng")) {
      return {
        reply: "Về Handstand, hãy ưu tiên Chest-to-wall (ngực áp tường) để giữ lưng thẳng tắp như đường thẳng và tập dùng lực từ 10 đầu ngón tay để hãm thăng bằng. Mỗi ngày tập 10-15 phút là tiến bộ rất nhanh!",
      };
    }

    if (lower.includes("đánh giá") || lower.includes("test") || lower.includes("kiểm tra") || lower.includes("thể lực")) {
      return {
        reply: "Lần đánh giá thể lực định kỳ tiếp theo sẽ giúp đo lường lại 6 chỉ số: Sức mạnh, Sức bền, Linh hoạt, Core, Thăng bằng và Kỹ năng. Bạn có thể làm bài kiểm tra bất cứ lúc nào khi cơ thể ở trạng thái sung sức nhất!",
        attachment: {
          type: "FORM_SCORE",
          title: "Bài đánh giá thể lực toàn diện định kỳ",
          actionLabel: "Vào phòng đánh giá",
          actionUrl: "/assessment",
        },
      };
    }

    if (lower.includes("pr") || lower.includes("kỷ lục") || lower.includes("thành tích") || lower.includes("tiến bộ")) {
      return {
        reply: "Tuyệt vời quá! Chúc mừng bạn đã phá kỷ lục cá nhân (PR)! 🔥 Sự kiên trì và kỷ luật của bạn đang đem lại kết quả rất rõ rệt. Hãy duy trì nhịp độ này nhé!",
      };
    }

    // Default friendly coach response
    return {
      reply: "Thầy đã ghi nhận tin nhắn của bạn! Thầy đang theo sát tiến độ tập luyện của bạn trên hệ thống. Cứ tiếp tục tập đúng giáo án và nhắn thầy nếu cần hỗ trợ bất kỳ lúc nào nhé! 💪",
    };
  },
};
