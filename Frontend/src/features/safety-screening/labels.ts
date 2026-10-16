/** Nhãn tiếng Việt cho mã cờ / ràng buộc an toàn (seed migration_assessment_v2_02). Mã chưa biết: cờ hiện nguyên mã, ràng buộc bị ẩn. */

export const FLAG_LABEL: Record<string, string> = {
  EXISTING_CONDITION: "Được khuyến cáo chỉ tập có giám sát",
  EXERTION_SYMPTOM: "Triệu chứng khi gắng sức (đau ngực, chóng mặt…)",
  JOINT_BONE_CONCERN: "Vấn đề xương khớp có thể nặng hơn khi vận động",
  MEDICATION_CONCERN: "Đang dùng thuốc liên quan tim mạch/huyết áp",
  OTHER_REASON: "Lý do khác không nên tập",
  INJURY_SHOULDER: "Đau/chấn thương vai",
  INJURY_WRIST: "Đau/chấn thương cổ tay",
  INJURY_ELBOW: "Đau/chấn thương khuỷu tay",
  INJURY_LOWER_BACK: "Đau/chấn thương lưng dưới",
  INJURY_KNEE: "Đau/chấn thương đầu gối",
  INJURY_ANKLE: "Đau/chấn thương cổ chân",
  INJURY_NECK: "Đau/chấn thương vùng cổ",
};

export const CONSTRAINT_LABEL: Record<string, string> = {
  NO_PLYOMETRIC: "Không có bài nhảy/va chạm mạnh",
  NO_INVERSION: "Không có bài đầu thấp hơn tim (trồng chuối, lộn ngược)",
  LOW_INTENSITY_ONLY: "Chỉ bài nền tảng cường độ thấp",
  NO_MAX_EFFORT_TEST: "Không làm bài test tối đa (bài bị loại không bị tính là không đạt)",
  LOAD_CAP_MODERATE: "Giới hạn cường độ và khối lượng ở mức vừa",
  LOAD_CAP_LOW: "Giới hạn cường độ và khối lượng ở mức thấp",
  REGION_LIMIT_SHOULDER: "Hạn chế bài tải vùng vai",
  REGION_LIMIT_WRIST: "Hạn chế bài tải cổ tay",
  REGION_LIMIT_ELBOW: "Hạn chế bài tải khuỷu tay",
  REGION_LIMIT_LOWER_BACK: "Hạn chế bài tải lưng dưới",
  REGION_LIMIT_KNEE: "Hạn chế bài tải đầu gối",
  REGION_LIMIT_ANKLE: "Hạn chế bài tải cổ chân",
  REGION_LIMIT_NECK: "Hạn chế bài tải vùng cổ",
};

export const SAFETY_STATUS_LABEL: Record<string, string> = {
  CLEARED: "Không có hạn chế riêng",
  REVIEW_REQUIRED: "Nên tham khảo ý kiến chuyên gia",
  RESTRICTED: "Chỉ tập nền tảng, cường độ thấp",
};
