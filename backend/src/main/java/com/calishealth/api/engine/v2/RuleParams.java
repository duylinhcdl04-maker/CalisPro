package com.calishealth.api.engine.v2;

import java.util.Map;
import java.util.OptionalDouble;

/**
 * Tham số số học của một rule set V2 (đã nạp từ engine_parameters). KHÔNG có giá trị mặc định: thiếu tham số
 * là lỗi cấu hình (rule set không hợp lệ), không bao giờ im lặng dùng số viết cứng trong code.
 */
public final class RuleParams {
    private final Map<String, Double> values;

    public RuleParams(Map<String, Double> values) { this.values = Map.copyOf(values); }

    public double require(String key) {
        Double v = values.get(key);
        if (v == null) throw new IllegalStateException("Rule set thiếu tham số: " + key);
        return v;
    }

    public OptionalDouble find(String key) {
        Double v = values.get(key);
        return v == null ? OptionalDouble.empty() : OptionalDouble.of(v);
    }

    /** Nhỏ nhất trong các tham số có tiền tố (dùng cho hệ số "bảo thủ" khi câu tuỳ chọn bị bỏ qua). */
    public double minWithPrefix(String prefix) {
        return values.entrySet().stream().filter(e -> e.getKey().startsWith(prefix)).mapToDouble(Map.Entry::getValue).min()
                .orElseThrow(() -> new IllegalStateException("Rule set thiếu tham số: " + prefix + "*"));
    }

    /** group_weight.{TYPE}.{COMPETENCY}.{GROUP}_WEIGHT (ghi đè theo năng lực) rồi group_weight.{TYPE}.{GROUP}_WEIGHT. */
    public double groupWeight(String assessmentType, String competency, String group) {
        OptionalDouble specific = find("group_weight." + assessmentType + "." + competency + "." + group + "_WEIGHT");
        double w = specific.isPresent() ? specific.getAsDouble() : require("group_weight." + assessmentType + "." + group + "_WEIGHT");
        if (w < 0) throw new IllegalStateException("Trọng số nhóm âm: " + group);
        return w;
    }
}
