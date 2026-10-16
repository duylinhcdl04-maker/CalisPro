/**
 * Tên gọi dễ hiểu cho các mã kỹ thuật của Level Engine (tham số, điều kiện cổng, nguồn quy chuẩn).
 * Chỉ để HIỂN THỊ: khoá thật (vd. blend.halfLifeDays) vẫn là định danh lưu trong database và được hiện kèm bên dưới tên gọi.
 */

export const COMPETENCY_LABEL: Record<string, string> = {
  PUSH: "Sức mạnh đẩy",
  PULL: "Sức mạnh kéo",
  LEGS: "Chân",
  CORE: "Thân giữa (core)",
  SKILL: "Kỹ năng",
  MOBILITY: "Linh hoạt",
};

export function sourceLabel(type: string): { label: string; hint: string } {
  switch (type) {
    case "PRODUCT_RULE":
      return { label: "Quy định sản phẩm", hint: "Do đội sản phẩm quyết định, không có tài liệu khoa học đi kèm." };
    case "COACHING_BENCHMARK":
      return { label: "Chuẩn huấn luyện", hint: "Dựa trên thông lệ hoặc tài liệu huấn luyện." };
    default:
      return { label: type, hint: "" };
  }
}

export interface ParamInfo {
  title: string;
  unit?: string;
  help?: string;
  /** Nhóm hiển thị, theo thứ tự trong PARAM_GROUPS */
  group: string;
}

export const PARAM_GROUPS = [
  "Điểm tổng & trọng số",
  "Phân nhóm & mốc điểm",
  "Độ tin cậy dữ liệu",
  "Lên/xuống level",
  "Chu kỳ & khối lượng tập",
  "Liều tập theo level",
  "Chọn giáo án & gợi ý bài",
  "Bài đo thực hành (Baseline)",
  "Khảo sát tự khai",
  "Đánh giá định kỳ",
  "Linh hoạt (bài đo góc)",
  "Level 4 & Coach xác nhận",
  "Chuyên cần & EXP",
  "Khác",
] as const;

const COMP_NAME: Record<string, string> = { CORE: "Thân giữa", LEGS: "Chân", MOBILITY: "Linh hoạt", PULL: "Kéo", PUSH: "Đẩy", SKILL: "Kỹ năng" };

/** Khoá có hậu tố level (.L0 … .L4): tên chung + level. */
const PER_LEVEL: Record<string, Omit<ParamInfo, "group"> & { group: string }> = {
  "baseline.attempts": { title: "Số lần đo độc lập tối thiểu để xác nhận level", unit: "lần", help: "Sàn bất biến: L0–L1 tối thiểu 1 lần, L2–L4 tối thiểu 2 lần độc lập, cả hai đều phải đạt. Có thể đặt cao hơn sàn, không thấp hơn.", group: "Bài đo thực hành (Baseline)" },
  "cycle.weeks": { title: "Số tuần của một chu kỳ tập", unit: "tuần", group: "Chu kỳ & khối lượng tập" },
  "dose.holdSec": { title: "Thời gian giữ mỗi hiệp (bài giữ tĩnh)", unit: "giây", group: "Liều tập theo level" },
  "dose.repMin": { title: "Số rep tối thiểu mỗi hiệp", unit: "rep", group: "Liều tập theo level" },
  "dose.repMax": { title: "Số rep tối đa mỗi hiệp", unit: "rep", group: "Liều tập theo level" },
  "dose.restSec": { title: "Thời gian nghỉ giữa các hiệp", unit: "giây", group: "Liều tập theo level" },
  "dose.rir": { title: "Rep dự trữ cuối hiệp (RIR)", unit: "rep", help: "Số rep còn có thể làm thêm khi kết thúc hiệp; dùng để đặt mức nỗ lực mục tiêu (RPE = 10 − RIR). Càng thấp là tập càng sát sức.", group: "Liều tập theo level" },
  "dose.sets": { title: "Số hiệp mỗi bài", unit: "hiệp", group: "Liều tập theo level" },
  "volume.maxSetsPerWeek": { title: "Số hiệp khó tối đa mỗi tuần cho mỗi nhóm năng lực", unit: "hiệp", group: "Chu kỳ & khối lượng tập" },
};

const FIXED: Record<string, Omit<ParamInfo, "group"> & { group: string }> = {
  "assessment.baselineDueDays": { title: "Hạn làm bài đo thực hành đầu tiên", unit: "ngày", group: "Lên/xuống level" },
  "assessment.minIntervalDays": { title: "Khoảng cách tối thiểu giữa hai lần đánh giá", unit: "ngày", group: "Lên/xuống level" },
  "band.BEGINNER": { title: "Mốc điểm tổng vào nhóm Beginner", unit: "điểm", group: "Phân nhóm & mốc điểm" },
  "band.INTERMEDIATE": { title: "Mốc điểm tổng vào nhóm Trung cấp", unit: "điểm", group: "Phân nhóm & mốc điểm" },
  "band.ADVANCED": { title: "Mốc điểm tổng vào nhóm Nâng cao", unit: "điểm", group: "Phân nhóm & mốc điểm" },
  "band.ELITE": { title: "Mốc điểm tổng vào nhóm Elite", unit: "điểm", group: "Phân nhóm & mốc điểm" },
  "band.margin": { title: "Biên độ chống tụt nhóm khi điểm sát mốc", unit: "điểm", help: "Lên nhóm thì không cần biên độ; muốn bị hạ nhóm, điểm phải thấp hơn mốc của nhóm hiện tại quá chừng này.", group: "Phân nhóm & mốc điểm" },
  "blend.halfLifeDays": { title: "Chu kỳ bán rã của dữ liệu cũ", unit: "ngày", help: "Dữ liệu càng cũ càng ít trọng lượng; sau chừng này ngày chỉ còn một nửa.", group: "Độ tin cậy dữ liệu" },
  "blend.measuredMinReliability": { title: "Độ tin cậy tối thiểu để coi là \"đo thực tế\"", unit: "0–1", help: "Kết quả đo chỉ được xem là đo thực tế khi độ tin cậy từ mức này trở lên.", group: "Độ tin cậy dữ liệu" },
  "blend.selfReportDamp": { title: "Hệ số giảm trọng số dữ liệu tự khai cũ", unit: "×", help: "Dữ liệu tự khai cũ hơn lần đo thực tế gần nhất chỉ còn tính ở mức này (0.1 = 10%).", group: "Độ tin cậy dữ liệu" },
  "cycle.deload.minRank": { title: "Level thấp nhất có tuần xả tải", unit: "cấp", help: "Từ level này trở lên, chu kỳ tập có tuần xả tải (giảm khối lượng).", group: "Chu kỳ & khối lượng tập" },
  "deload.volumeFactor": { title: "Hệ số khối lượng ở tuần xả tải", unit: "×", help: "Số hiệp của tuần xả tải được nhân với hệ số này (0.6 = còn 60%).", group: "Chu kỳ & khối lượng tập" },
  "ewma.alpha": { title: "Hệ số làm mượt điểm theo thời gian (EWMA)", unit: "0–1", help: "Điểm trung bình trượt mới = hệ số × điểm lần này + (1 − hệ số) × điểm trung bình trượt trước. Càng cao càng phản ứng nhanh với kết quả mới.", group: "Lên/xuống level" },
  "fastTrack.margin": { title: "Điểm tổng phải vượt mốc lên level thêm bao nhiêu để được lên nhanh", unit: "điểm", help: "Lên nhanh chỉ xét ở bài đo thực hành đầu tiên hoặc khi Coach xác minh, và khi điểm tổng vượt mốc lên level ít nhất chừng này.", group: "Lên/xuống level" },
  "fastTrack.minReliability": { title: "Độ tin cậy tối thiểu của mọi bài đo để được lên nhanh", unit: "0–1", help: "Mọi bài đo hợp lệ đều phải đạt độ tin cậy này mới được lên nhanh.", group: "Lên/xuống level" },
  "gate.reliability.minPose": { title: "Độ tin cậy tối thiểu của nhận diện tư thế", unit: "0–1", help: "Cổng Tin cậy: bài đo có độ tin cậy tư thế thấp hơn mức này bị coi là chưa đủ tin cậy.", group: "Độ tin cậy dữ liệu" },
  "gate.reliability.minTracked": { title: "Tỷ lệ khung hình theo dõi được tối thiểu", unit: "0–1", help: "Cổng Tin cậy: tỷ lệ khung hình camera theo dõi được thấp hơn mức này thì bài đo không đủ tin cậy.", group: "Độ tin cậy dữ liệu" },
  "gate.reliability.minVisibility": { title: "Độ hiển thị tối thiểu của các khớp", unit: "0–1", help: "Cổng Tin cậy: các khớp bị khuất nhiều hơn mức này thì bài đo không đủ tin cậy.", group: "Độ tin cậy dữ liệu" },
  "level.L4.requiresCoachVerified": { title: "Level 4 cần Huấn luyện viên xác nhận", unit: "1 = có", help: "Camera chỉ xác minh tới L3; L4 phải được Coach xem video và xác nhận.", group: "Lên/xuống level" },
  "match.minutesTolerance": { title: "Số phút buổi giáo án được phép dài hơn thời gian học viên có", unit: "phút", help: "Giáo án có buổi tập dài hơn thời gian học viên có quá mức này sẽ bị loại.", group: "Chọn giáo án & gợi ý bài" },
  "match.w.goal": { title: "Trọng số chọn giáo án: mục tiêu", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "match.w.level": { title: "Trọng số chọn giáo án: level", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "match.w.schedule": { title: "Trọng số chọn giáo án: lịch tập", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "match.w.variety": { title: "Trọng số chọn giáo án: độ đa dạng", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "match.w.weakness": { title: "Trọng số chọn giáo án: điểm yếu", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "observation.ladderWeight": { title: "Trọng số điểm thang bài tập khi trộn với điểm câu hỏi khảo sát", unit: "trọng số", help: "Điểm năng lực = trung bình có trọng số giữa điểm từ thang bài tập (dùng trọng số này) và điểm các câu hỏi khảo sát (mỗi câu có trọng số riêng).", group: "Điểm tổng & trọng số" },
  "progression.minForm": { title: "Điểm form tối thiểu để một lần tập được tính là \"buổi đạt\"", unit: "điểm", help: "Mặc định khi xét làm chủ một bài tập; từng bài có thể có tiêu chí riêng.", group: "Lên/xuống level" },
  "progression.qualifyingSessions": { title: "Số buổi đạt để được xem là làm chủ bài tập", unit: "buổi", help: "Mặc định khi xét làm chủ một bài tập; từng bài có thể có tiêu chí riêng.", group: "Lên/xuống level" },
  "provisional.maxRank": { title: "Level tối đa của kết quả tạm thời (khảo sát tự khai)", unit: "cấp", help: "Dữ liệu tự khai không xếp cao hơn level này; muốn cao hơn phải có bài đánh giá thực hành.", group: "Lên/xuống level" },
  "provisional.screeningMaxRank": { title: "Level tối đa khi sàng lọc an toàn có dấu hiệu cần lưu ý", unit: "cấp", help: "Nếu bảng sàng lọc có dấu hiệu cần lưu ý, level tạm thời bị giới hạn ở mức này.", group: "Lên/xuống level" },
  "quality.CONFLICTED": { title: "Hệ số chất lượng dữ liệu: mâu thuẫn", unit: "×", help: "Nhân vào độ tin cậy của dữ liệu khảo sát khi câu trả lời mâu thuẫn nhau.", group: "Độ tin cậy dữ liệu" },
  "quality.HIGH": { title: "Hệ số chất lượng dữ liệu: cao", unit: "×", help: "Nhân vào độ tin cậy của dữ liệu khảo sát có chất lượng cao.", group: "Độ tin cậy dữ liệu" },
  "quality.MEDIUM": { title: "Hệ số chất lượng dữ liệu: trung bình", unit: "×", help: "Nhân vào độ tin cậy của dữ liệu khảo sát có chất lượng trung bình.", group: "Độ tin cậy dữ liệu" },
  "quality.LOW": { title: "Hệ số chất lượng dữ liệu: thấp", unit: "×", help: "Nhân vào độ tin cậy của dữ liệu khảo sát có chất lượng thấp.", group: "Độ tin cậy dữ liệu" },
  "quality.coverage.high": { title: "Tỷ lệ câu đã trả lời để dữ liệu khảo sát xếp \"chất lượng cao\"", unit: "0–1", help: "Trả lời từ tỷ lệ này trở lên là chất lượng cao.", group: "Độ tin cậy dữ liệu" },
  "quality.coverage.medium": { title: "Tỷ lệ câu đã trả lời để dữ liệu khảo sát xếp \"chất lượng trung bình\"", unit: "0–1", help: "Thấp hơn mức này là chất lượng thấp.", group: "Độ tin cậy dữ liệu" },
  "rec.w.difficulty": { title: "Trọng số gợi ý bài: độ khó", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.equipment": { title: "Trọng số gợi ý bài: dụng cụ", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.goal": { title: "Trọng số gợi ý bài: mục tiêu", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.overload": { title: "Trọng số gợi ý bài: nguy cơ quá tải (bị trừ điểm)", unit: "tỷ lệ", help: "Khác các trọng số còn lại, mục này được TRỪ vào điểm gợi ý.", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.prerequisite": { title: "Trọng số gợi ý bài: bài tiên quyết", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.recent": { title: "Trọng số gợi ý bài: hiệu suất gần đây", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.skillGap": { title: "Trọng số gợi ý bài: khoảng cách kỹ năng", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "rec.w.weakness": { title: "Trọng số gợi ý bài: điểm yếu", unit: "tỷ lệ", group: "Chọn giáo án & gợi ý bài" },
  "regression.competencyMargin": { title: "Biên điểm để tính là \"năng lực thấp hơn nhiều so với yêu cầu\"", unit: "điểm", help: "Một năng lực bắt buộc thấp hơn yêu cầu của level hiện tại quá chừng này điểm thì lần đánh giá đó được tính là dưới ngưỡng.", group: "Lên/xuống level" },
  "regression.confirmations": { title: "Số lần đánh giá liên tiếp dưới ngưỡng trước khi hạ 1 level", unit: "lần", help: "Chưa đủ số lần thì chỉ theo dõi, giữ nguyên level.", group: "Lên/xuống level" },
  "reliability.AI_BASE": { title: "Độ tin cậy gốc của kết quả đo bằng AI", unit: "0–1", help: "Độ tin cậy của một bài đo AI = mức gốc này × (chất lượng tư thế ÷ mốc tham chiếu) × (độ hiển thị ÷ mốc tham chiếu) × tỷ lệ khung hình theo dõi được; mỗi tỷ số tối đa bằng 1.", group: "Độ tin cậy dữ liệu" },
  "reliability.COACH_VERIFIED": { title: "Độ tin cậy của kết quả do Coach xác nhận", unit: "0–1", group: "Độ tin cậy dữ liệu" },
  "reliability.SELF_REPORTED": { title: "Độ tin cậy của dữ liệu tự khai", unit: "0–1", group: "Độ tin cậy dữ liệu" },
  "reliability.ai.poseRef": { title: "Mốc tham chiếu chất lượng tư thế khi đo AI", unit: "0–1", help: "Chất lượng tư thế đạt hoặc vượt mốc này thì không bị trừ độ tin cậy.", group: "Độ tin cậy dữ liệu" },
  "reliability.ai.visibilityRef": { title: "Mốc tham chiếu độ hiển thị khi đo AI", unit: "0–1", help: "Độ hiển thị các khớp đạt hoặc vượt mốc này thì không bị trừ độ tin cậy.", group: "Độ tin cậy dữ liệu" },
  "returning.inactiveDays": { title: "Số ngày không hoạt động để coi là quay lại tập", unit: "ngày", help: "Nghỉ từ chừng này ngày trở lên thì được xếp vào trạng thái \"quay lại tập\" (giữ level, giảm khối lượng).", group: "Chu kỳ & khối lượng tập" },
  "returning.volumeFactor": { title: "Hệ số khối lượng khi quay lại tập", unit: "×", help: "Số hiệp được nhân với hệ số này trong giáo án của người quay lại.", group: "Chu kỳ & khối lượng tập" },
  "session.cooldownMin": { title: "Thời gian thả lỏng tính vào mỗi buổi", unit: "phút", help: "Dùng để ước lượng thời lượng buổi tập.", group: "Chu kỳ & khối lượng tập" },
  "session.warmupMin": { title: "Thời gian khởi động tính vào mỗi buổi", unit: "phút", help: "Dùng để ước lượng thời lượng buổi tập.", group: "Chu kỳ & khối lượng tập" },
  "session.secPerRep": { title: "Thời gian ước tính mỗi rep", unit: "giây", help: "Dùng để ước lượng thời lượng buổi tập.", group: "Chu kỳ & khối lượng tập" },
  "stability.logLastN": { title: "Số buổi tập gần nhất được xét độ ổn định", unit: "buổi", help: "Cổng Ổn định: xét tối đa chừng này buổi tập gần nhất của bài chuẩn.", group: "Lên/xuống level" },
  "stability.logMinPass": { title: "Số buổi đạt tối thiểu trong các buổi được xét", unit: "buổi", help: "Cổng Ổn định: cần ít nhất chừng này buổi đạt chuẩn.", group: "Lên/xuống level" },
  "stability.logWindowDays": { title: "Chỉ xét các buổi tập trong khoảng thời gian này", unit: "ngày", help: "Cổng Ổn định: bỏ qua buổi tập cũ hơn chừng này ngày.", group: "Lên/xuống level" },
  "stability.prevWindowWeeks": { title: "Lần đánh giá trước chỉ có giá trị nếu cách nay không quá", unit: "tuần", help: "Cổng Ổn định: nếu lần đánh giá trước (trong khoảng này) cũng đạt level đó thì được coi là ổn định.", group: "Lên/xuống level" },
  "trend.delta": { title: "Mức chênh điểm so với lần trước để xác định xu hướng", unit: "điểm", help: "Điểm năng lực tăng từ mức này trở lên so với lần trước là \"đang cải thiện\", giảm từ mức này là \"đang đi xuống\", còn lại là \"ổn định\".", group: "Lên/xuống level" },
  "volume.weakBonusSets": { title: "Số hiệp cộng thêm mỗi tuần cho năng lực yếu nhất", unit: "hiệp", help: "Cộng vào bài chính của năng lực yếu nhất, không vượt trần hiệp mỗi tuần; không áp dụng ở tuần xả tải.", group: "Chu kỳ & khối lượng tập" },
};

const BASELINE = "Bài đo thực hành (Baseline)";
const INITIAL = "Khảo sát tự khai";
const PERIODIC = "Đánh giá định kỳ";
const MOBILITY = "Linh hoạt (bài đo góc)";
const L4 = "Level 4 & Coach xác nhận";

/** Khoá chỉ có ở bộ quy tắc V2. Mô tả đối chiếu với BaselineService, PeriodicAssessmentV2Service, FitnessLevelEngine (V2), AttemptRecorder, RuleParams. */
const EXP_GROUP = "Chuyên cần & EXP";
const V2: Record<string, Omit<ParamInfo, "group"> & { group: string }> = {
  "exp.enabled": { title: "Bật tính năng EXP chuyên cần", unit: "0 hoặc 1", help: "1 = bật. EXP chỉ làm cổng chuyên cần và điểm cộng nhỏ khi xét lên level, không thay điểm bài test hay form.", group: EXP_GROUP },
  "exp.checkin": { title: "EXP mỗi ngày điểm danh (check-in sức khỏe)", unit: "EXP", help: "Chỉ tính check-in trong ngày, không điểm danh bù.", group: EXP_GROUP },
  "exp.session": { title: "EXP mỗi buổi tập hoàn thành của giáo án hệ thống", unit: "EXP", help: "Buổi chỉ tính khi làm đủ số hiệp tối thiểu. Giáo án tự soạn không có EXP.", group: EXP_GROUP },
  "exp.goodForm": { title: "EXP thưởng thêm khi tập đúng (AI đo đủ hiệp và form đạt chuẩn)", unit: "EXP", help: "Thưởng thêm cho buổi có đủ tỷ lệ hiệp do AI đo và điểm form trung bình đạt chuẩn. Buổi nhập tay hay thiếu dữ liệu không bị trừ.", group: EXP_GROUP },
  "exp.goodForm.minAiShare": { title: "Tỷ lệ hiệp do AI đo tối thiểu để được thưởng tập đúng", unit: "0–1", group: EXP_GROUP },
  "exp.streak7": { title: "EXP thưởng khi điểm danh đủ 7 ngày liên tiếp", unit: "EXP", help: "Mỗi chuỗi chỉ thưởng một lần.", group: EXP_GROUP },
  "exp.assessment": { title: "EXP khi làm trọn một lần đánh giá định kỳ", unit: "EXP", help: "Thưởng việc đo xong, không thưởng theo điểm cao.", group: EXP_GROUP },
  "attendance.windowDays": { title: "Cửa sổ tính điểm chuyên cần", unit: "ngày", help: "Chỉ EXP trong khoảng này gần nhất được tính vào điểm chuyên cần (thường bằng một chu kỳ tập).", group: EXP_GROUP },
  "attendance.targetExp": { title: "EXP trong cửa sổ để đạt 100 điểm chuyên cần", unit: "EXP", help: "Điểm chuyên cần = EXP trong cửa sổ ÷ giá trị này × 100, tối đa 100.", group: EXP_GROUP },
  "attendance.minScore": { title: "Điểm chuyên cần tối thiểu để được xét lên level", unit: "điểm (0–100)", help: "Cổng Chuyên cần: thấp hơn mức này thì chưa lên level dù các cổng khác đạt.", group: EXP_GROUP },
  "attendance.bonusMax": { title: "Điểm cộng chuyên cần tối đa vào điểm tổng", unit: "điểm", help: "Chỉ có tác dụng khi mọi cổng đã đạt và điểm tổng chỉ thiếu ít điểm. Hệ thống không cho đặt quá 5.", group: EXP_GROUP },
  "baseline.attempt_aggregation": { title: "Cách tổng hợp nhiều lần đo", help: "MIN: lấy kết quả thấp nhất của các lần đo (thận trọng). MEAN: lấy trung bình.", group: BASELINE },
  "baseline.max_span_days": { title: "Thời gian tối đa để hoàn tất một lượt đo thực hành", unit: "ngày", help: "Quá thời hạn này phiên đo hết hạn và phải bắt đầu lượt mới.", group: BASELINE },
  "baseline.retest_after_days": { title: "Số ngày chờ để đo lại sau lần đo chưa đủ tin cậy", unit: "ngày", help: "Chỉ là gợi ý ngày đo lại; lần đo chưa đủ tin cậy không làm hạ level.", group: BASELINE },
  "baseline.reliability.minPose": { title: "Độ tin cậy tối thiểu của nhận diện tư thế (một lần đo)", unit: "0–1", group: BASELINE },
  "baseline.reliability.minTracked": { title: "Tỷ lệ khung hình theo dõi được tối thiểu (một lần đo)", unit: "0–1", group: BASELINE },
  "baseline.reliability.minVisibility": { title: "Độ hiển thị tối thiểu của các khớp (một lần đo)", unit: "0–1", group: BASELINE },
  "fast_track.enabled": { title: "Cho phép lên nhanh ở bài đo thực hành đầu tiên", unit: "1 = có", help: "Chỉ gỡ giới hạn số level được lên ở lần đo đầu; không bỏ qua cổng nào.", group: BASELINE },
  "protocol.restSec": { title: "Thời gian nghỉ tối thiểu giữa hai lần đo độc lập", unit: "giây", group: BASELINE },
  "max_promotion_step": { title: "Số level tối đa được lên mỗi lần đánh giá", unit: "cấp", help: "Áp dụng từ lần đánh giá định kỳ thứ hai; lần đo đầu có thể lên nhanh hơn nếu bật lên nhanh.", group: PERIODIC },
  "periodic.illness.maxEnergy": { title: "Mức năng lượng check-in bị coi là ốm hoặc mệt nặng", unit: "≤ thang check-in", group: PERIODIC },
  "periodic.illness.windowDays": { title: "Số ngày gần nhất được xét khi có check-in ốm hoặc mệt", unit: "ngày", help: "Nếu trong khoảng này học viên báo năng lượng rất thấp, lần đo kém không bị tính vào xu hướng giảm.", group: PERIODIC },
  "initial.conflict_downgrade_levels": { title: "Số level bị hạ khi khảo sát có câu trả lời mâu thuẫn", unit: "cấp", group: INITIAL },
  "initial.low_confidence_threshold": { title: "Ngưỡng độ chắc chắn thấp của khảo sát", unit: "0–1", help: "Dưới ngưỡng này chỉ được ghi nhận và nhắc cần bài đo thực hành; không làm hạ level.", group: INITIAL },
  "initial.max_level_rank": { title: "Level tối đa của khảo sát tự khai", unit: "cấp", help: "Quy định nghiệp vụ bất biến: dữ liệu tự khai không xếp cao hơn L2.", group: INITIAL },
  "l4.review.expiry_days": { title: "Hạn xử lý một gói xem xét Level 4", unit: "ngày", help: "Quá hạn gói chuyển sang hết hạn; đây không phải bằng chứng tiêu cực với học viên.", group: L4 },
  "l4.video.retention_days": { title: "Số ngày lưu video bằng chứng Level 4", unit: "ngày", group: L4 },
  "mobility.capRatio": { title: "Hệ số trần của góc đo linh hoạt", unit: "×", help: "Góc đo lớn hơn hệ số này × góc mục tiêu bị coi là số đo phi lý (đo không hợp lệ).", group: MOBILITY },
};

const MOBILITY_TEST: Record<string, string> = {
  "shoulder-flexion-test": "gập vai",
  "pike-fold-test": "gập hông (pike)",
  "overhead-squat-test": "squat sâu, tay giơ cao",
};
const FORM_CONF: Record<string, string> = { NOT_CONFIDENT: "không tự tin", SLIGHT: "hơi tự tin", MODERATE: "tương đối tự tin", VERY: "rất tự tin", EXTREMELY: "cực kỳ tự tin" };
const RECENCY: Record<string, string> = { RECENT_30D: "làm được trong 30 ngày qua", RECENT_1_6M: "làm được cách đây 1–6 tháng", ESTIMATE: "chỉ ước đoán" };
const CLASS_NAME: Record<string, string> = { HIGH: "cao", MEDIUM: "trung bình", LOW: "thấp" };
const WEIGHT_NAME: Record<string, string> = { LADDER: "điểm thang bài tập", CHOICE: "câu hỏi lựa chọn", QUALITY: "chất lượng thực hiện" };

/** Tên gọi dễ hiểu cho một khoá tham số; khoá lạ thì trả về chính khoá đó (không bịa nghĩa). */
export function describeParam(key: string): ParamInfo {
  if (FIXED[key]) return FIXED[key];
  if (V2[key]) return V2[key];
  const mt = key.match(/^mobility\.target\.(.+)$/);
  if (mt) return { title: `Góc mục tiêu bài đo ${MOBILITY_TEST[mt[1]] ?? mt[1]}`, unit: "độ", help: "Đạt góc này tương ứng điểm tối đa của bài đo linh hoạt.", group: MOBILITY };
  const ff = key.match(/^form_factor\.(.+)$/);
  if (ff && FORM_CONF[ff[1]]) return { title: `Hệ số theo độ tự tin về form: ${FORM_CONF[ff[1]]}`, unit: "×", help: "Hệ số không vượt 1: tự tin cao không bao giờ làm điểm hay độ tin cậy vượt mức.", group: INITIAL };
  const rc = key.match(/^recency\.(.+)$/);
  if (rc && RECENCY[rc[1]]) return { title: `Hệ số theo thời điểm gần nhất: ${RECENCY[rc[1]]}`, unit: "×", help: "Càng lâu chưa làm được mức đã khai thì hệ số càng thấp.", group: INITIAL };
  const rcl = key.match(/^reliability_class\.(.+)$/);
  if (rcl && CLASS_NAME[rcl[1]]) return { title: `Độ tin cậy gán cho câu hỏi nhóm tin cậy ${CLASS_NAME[rcl[1]]}`, unit: "0–1", group: INITIAL };
  const gw = key.match(/^group_weight\.(INITIAL|PERIODIC)\.(?:[A-Z]+\.)?([A-Z]+)_WEIGHT$/);
  if (gw) return { title: `Trọng số ${WEIGHT_NAME[gw[2]] ?? gw[2]} trong ${gw[1] === "INITIAL" ? "khảo sát" : "đo định kỳ"}`, unit: "tỷ lệ", group: gw[1] === "INITIAL" ? INITIAL : PERIODIC };
  const w = key.match(/^overall\.weight\.([A-Z]+)$/);
  if (w) return { title: `Trọng số điểm tổng: ${COMP_NAME[w[1]] ?? w[1]}`, unit: "tỷ lệ", help: "Tổng trọng số của các nhóm năng lực phải bằng 1.0 (100%).", group: "Điểm tổng & trọng số" };
  const lv = key.match(/^(.*)\.L(\d)$/);
  if (lv && PER_LEVEL[lv[1]]) return { ...PER_LEVEL[lv[1]], title: `${PER_LEVEL[lv[1]].title} (Level ${lv[2]})` };
  return { title: key, group: "Khác" };
}

export function competencyName(code: string | null | undefined): string {
  return code ? COMPETENCY_LABEL[code] ?? code : "";
}

interface Req {
  gate: string; competency?: string | null; exerciseCode?: string | null; metric?: string | null; operator: string; value: number;
}

/** Điều kiện của một cổng, viết thành câu. exerciseNames: mã bài → tên bài (lấy từ các bậc tiến trình của rule set). */
export function describeRequirement(r: Req, exerciseNames: Record<string, string>): string {
  const up = r.operator !== "LTE";
  const ex = r.exerciseCode ? exerciseNames[r.exerciseCode] ?? r.exerciseCode : "";
  const v = Number.isInteger(r.value) ? String(r.value) : String(Number(r.value.toFixed(2)));
  if (r.gate === "COMPETENCY") return `${competencyName(r.competency)}: từ ${v} điểm trở lên`;
  if (r.gate === "SKILL") return `Đạt kỹ năng ${ex} (đo bằng AI hoặc Coach xác nhận)`;
  if (r.gate === "QUALITY") {
    switch (r.metric) {
      case "FORM_SCORE": return `Điểm form trung bình từ ${v}/100`;
      case "VALID_RATIO": return `Tỷ lệ rep hợp lệ từ ${Math.round(r.value * 100)}%`;
      case "MAJOR_VIOLATIONS": return `Không quá ${v} lỗi nghiêm trọng mỗi lần đo`;
      default: return `${r.metric} ${up ? "≥" : "≤"} ${v}`;
    }
  }
  if (r.metric === "HOLD_SEC") return `${ex}: giữ ${up ? "từ" : "tối đa"} ${v} giây`;
  return `${ex}: ${up ? "từ" : "tối đa"} ${v} rep hợp lệ`;
}

export const GOAL_LABEL: Record<string, string> = {
  STRENGTH: "Tăng sức mạnh",
  MUSCLE_GAIN: "Tăng cơ",
  WEIGHT_LOSS: "Giảm cân",
  ENDURANCE: "Sức bền",
  FLEXIBILITY: "Linh hoạt",
  SKILL: "Học kỹ năng",
  GENERAL_FITNESS: "Thể lực tổng quát",
  POSTURE: "Cải thiện tư thế",
  FIRST_PULL_UP: "Pull-up đầu tiên",
  MUSCLE_UP: "Chinh phục Muscle-up",
  HANDSTAND: "Làm chủ Handstand",
};

export const LEVEL_LABEL: Record<string, string> = {
  L0: "Nền tảng",
  L1: "Cơ bản",
  L2: "Trung cấp",
  L3: "Nâng cao",
  L4: "Elite",
};

export const goalName = (code: string): string => GOAL_LABEL[code] ?? code;
export const levelName = (code: string): string => LEVEL_LABEL[code] ?? "";

export const GATE_LABEL: Record<string, string> = {
  COMPETENCY: "Cổng năng lực",
  PERFORMANCE: "Cổng thành tích",
  SKILL: "Cổng kỹ năng",
  QUALITY: "Cổng chất lượng",
};

/** Mã bài tập (vd. incline-push-up) thành tên đọc được (Incline Push-up) khi không có tên chính thức. */
export function humanizeExercise(code: string | null | undefined): string {
  if (!code) return "";
  return code.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

interface ReqLike {
  gate: string; competency?: string | null; exerciseCode?: string | null; metric?: string | null; operator: string;
}

/** Nhãn và đơn vị của một điều kiện cổng khi giá trị được hiển thị/sửa ở ô riêng (không kèm số). */
export function requirementLabel(r: ReqLike): { label: string; unit: string } {
  const bound = r.operator === "LTE" ? "tối đa" : "tối thiểu";
  const ex = humanizeExercise(r.exerciseCode);
  if (r.gate === "COMPETENCY") return { label: `${competencyName(r.competency)}: điểm ${bound}`, unit: "điểm" };
  if (r.gate === "SKILL") return { label: `Đạt kỹ năng ${ex}`, unit: "" };
  if (r.gate === "QUALITY") {
    switch (r.metric) {
      case "FORM_SCORE": return { label: `Điểm form trung bình ${bound}`, unit: "/100" };
      case "VALID_RATIO": return { label: `Tỷ lệ rep hợp lệ ${bound}`, unit: "0–1 (0.7 = 70%)" };
      case "MAJOR_VIOLATIONS": return { label: `Số lỗi nghiêm trọng ${bound}`, unit: "lỗi" };
      default: return { label: `${r.metric ?? ""} ${bound}`, unit: "" };
    }
  }
  if (r.metric === "HOLD_SEC") return { label: `${ex}: thời gian giữ ${bound}`, unit: "giây" };
  return { label: `${ex}: số rep hợp lệ ${bound}`, unit: "rep" };
}

export const LEVEL_FIELD_LABEL: Record<string, string> = {
  promote_min: "Điểm tổng để lên level",
  regress_below: "Ngưỡng xét tụt (điểm trung bình trượt)",
  min_competency_confidence: "Độ chắc chắn tối thiểu của năng lực",
};

/** Mục bị thay đổi trong nhật ký (khoá backend ghi) thành câu đọc được. */
export function describeChangeTarget(type: string, key: string): { title: string; sub: string } {
  if (type === "PARAM") return { title: describeParam(key).title, sub: key };
  if (type === "LEVEL") {
    const [code, field] = key.split(".");
    return { title: `Level ${code}${levelName(code) ? ` (${levelName(code)})` : ""}: ${LEVEL_FIELD_LABEL[field] ?? field}`, sub: key };
  }
  const m = key.match(/^(L\d)\.([A-Z]+)\.([^#]*)#(\d+)$/);
  if (m) {
    const comp = m[3] && m[3] !== "null" ? competencyName(m[3]) : "";
    return { title: `Level ${m[1]} · ${GATE_LABEL[m[2]] ?? m[2]}${comp ? ` · ${comp}` : ""}`, sub: key };
  }
  return { title: key, sub: "" };
}
