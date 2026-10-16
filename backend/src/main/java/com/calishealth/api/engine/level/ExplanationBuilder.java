package com.calishealth.api.engine.level;

import com.calishealth.api.engine.config.RuleSetConfig;
import com.calishealth.api.engine.level.LevelModels.Reason;

import java.util.List;

/**
 * Dựng lời giải thích tất định từ quyết định đã có (structured explanation -> văn bản).
 * Gemini (nếu bật) chỉ được diễn đạt lại văn bản này; mọi con số đều đến từ Level Engine.
 */
public final class ExplanationBuilder {
    private ExplanationBuilder() {}

    public static String level(RuleSetConfig rs, String previous, String finalLevel, String decision, Double overall,
                               List<Reason> reasons) {
        String prevName = previous == null ? null : rs.level(previous).name();
        String newName = rs.level(finalLevel).name();
        StringBuilder sb = new StringBuilder();
        switch (decision) {
            case LevelModels.PROVISIONAL_ASSIGNED -> sb.append("Mức khởi điểm tạm thời của bạn là ").append(newName)
                    .append(" (dựa trên câu trả lời tự khai báo). Mức này sẽ được xác nhận bằng bài đánh giá thực hành.");
            case LevelModels.PROMOTED -> sb.append("Chúc mừng! Bạn đã lên ").append(newName).append(prevName == null ? "" : " từ " + prevName).append('.');
            case LevelModels.REGRESSED -> sb.append("Level được điều chỉnh về ").append(newName)
                    .append(" để giáo án phù hợp với thể trạng hiện tại.");
            case LevelModels.RETEST_REQUIRED -> sb.append("Kết quả đo chưa đủ tin cậy nên level giữ nguyên (").append(newName)
                    .append("). Hãy làm lại bài test với camera thấy rõ toàn thân.");
            default -> sb.append("Bạn tiếp tục ở ").append(newName).append('.');
        }
        if (overall != null) sb.append(" Điểm tổng: ").append(LevelGates.fmt(overall)).append("/100.");
        List<Reason> failed = reasons.stream().filter(r -> !r.passed() && !LevelModels.G_DECISION.equals(r.gate())).limit(3).toList();
        if (!failed.isEmpty() && !LevelModels.PROMOTED.equals(decision)) {
            sb.append(" Cần cải thiện: ");
            sb.append(String.join(" ", failed.stream().map(reason -> reason.message()).toList()));
        }
        return sb.toString();
    }
}
