package com.calishealth.api.service.level;

import com.calishealth.api.dto.TrainingSessionDtos.AiCoachInfo;
import com.calishealth.api.dto.TrainingSessionDtos.AiInfo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/**
 * Bài nào đo được bằng AI (camera): profile chuyển động có loại chuyển động, ngưỡng đỉnh/đáy và đủ 3 khớp tạo góc đo.
 * formScoring: bài còn có rule đã xuất bản để chấm form. Cùng cách chọn profile với Motion Rule Engine (ACTIVE trước, không có thì bản mới nhất).
 */
@Service
public class AiReadinessService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public AiReadinessService(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    public Map<Long, AiInfo> infoFor(Collection<Long> exerciseIds) {
        Map<Long, AiInfo> out = new HashMap<>();
        if (exerciseIds.isEmpty()) return out;
        String in = String.join(",", Collections.nCopies(exerciseIds.size(), "?"));
        jdbc.query("""
                SELECT p.exercise_id, p.movement_type, p.camera_view, p.rep_top_threshold, p.rep_bottom_threshold, p.rep_metric_json,
                       (SELECT COUNT(*) FROM ai_motion_rules r WHERE r.ai_profile_id = p.id AND r.status = 'PUBLISHED'), e.ai_enabled
                FROM exercise_ai_profiles p JOIN exercises e ON e.id = p.exercise_id WHERE p.exercise_id IN (""" + in + ") ORDER BY (p.status = 'ACTIVE') DESC, p.created_at DESC", rs -> {
            long exId = rs.getLong(1);
            if (out.containsKey(exId)) return;
            String movement = rs.getString(2);
            Double top = (Double) rs.getObject(4), bottom = (Double) rs.getObject(5);
            List<Integer> points = new ArrayList<>();
            try {
                String raw = rs.getString(6);
                if (raw != null) {
                    JsonNode p = json.readTree(raw).path("points");
                    if (p.isArray()) p.forEach(n -> points.add(n.asInt()));
                }
            } catch (Exception ignored) { /* profile không đọc được: coi như chưa có chỉ số đo */ }
            boolean configured = movement != null && top != null && bottom != null && points.size() >= 3;
            boolean enabled = rs.getBoolean(8);
            boolean ready = configured && enabled;
            boolean form = rs.getInt(7) > 0;
            String note = !configured ? (enabled ? NOT_CONFIGURED : NOT_READY)
                    : !enabled ? NOT_ENABLED
                    : form ? "AI đếm rep, đo biên độ góc và chấm form theo rule của bài."
                    : "AI đếm rep và đo biên độ góc. Bài này chưa có rule chấm form được xuất bản.";
            out.put(exId, new AiInfo(ready, ready && form, movement, rs.getString(3), top, bottom, points, note, enabled, configured));
        }, exerciseIds.toArray());
        return out;
    }

    /** AI Coach của một bài (trang chi tiết của học viên). Bài không có profile hoặc chưa bật vẫn trả về, với ready=false và lời giải thích. */
    public AiCoachInfo coach(long exerciseId) {
        List<Object[]> rows = jdbc.query("SELECT code, name, ai_enabled FROM exercises WHERE id = ?", (rs, i) -> new Object[]{rs.getString(1), rs.getString(2), rs.getBoolean(3)}, exerciseId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy bài tập.");
        boolean enabled = (Boolean) rows.get(0)[2];
        AiInfo ai = infoFor(List.of(exerciseId)).getOrDefault(exerciseId,
                new AiInfo(false, false, null, null, null, null, List.of(), enabled ? NOT_CONFIGURED : NOT_ENABLED, enabled, false));
        return new AiCoachInfo(exerciseId, (String) rows.get(0)[0], (String) rows.get(0)[1], ai);
    }

    public record Readiness(boolean ready, boolean formScoring, boolean configured, boolean enabled) {}

    /** Cho trang soạn giáo án: mọi bài đã có profile chuyển động và việc bài đó đo/chấm form được bằng AI hay chưa. */
    public Map<Long, Readiness> all() {
        List<Long> ids = jdbc.queryForList("SELECT DISTINCT exercise_id FROM exercise_ai_profiles", Long.class);
        Map<Long, Readiness> out = new HashMap<>();
        infoFor(ids).forEach((id, i) -> out.put(id, new Readiness(i.ready(), i.formScoring(), i.configured(), i.enabled())));
        return out;
    }

    public static final String NOT_READY = "Bài này chưa có cấu hình AI. Bạn tự nhập kết quả.";
    public static final String NOT_ENABLED = "Bài này chưa được bật tích hợp AI. Bạn tự nhập kết quả.";
    public static final String NOT_CONFIGURED = "Bài này đã bật tích hợp AI nhưng chưa có đủ cấu hình đo (loại chuyển động, ngưỡng đỉnh/đáy, 3 điểm khớp). Bạn tự nhập kết quả.";

    public boolean isReady(Long exerciseId, Map<Long, AiInfo> infos) {
        AiInfo i = infos.get(exerciseId);
        return i != null && i.ready();
    }
}
