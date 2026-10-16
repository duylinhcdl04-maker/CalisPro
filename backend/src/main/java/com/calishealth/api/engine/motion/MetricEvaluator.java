package com.calishealth.api.engine.motion;

import com.calishealth.api.engine.motion.MotionTypes.*;

import java.util.List;
import java.util.Set;

/**
 * Strategy cho từng loại chỉ số: khai báo toán tử/đơn vị hợp lệ, cấu hình đo bắt buộc, thời điểm xét,
 * và cách lấy giá trị (đã chuẩn hoá đơn vị) từ MotionFeatures. KHÔNG tính toán từ landmark thô (việc của FeatureEngine).
 */
public interface MetricEvaluator {
    MetricType type();

    Set<Operator> operators();

    /** Đơn vị hợp lệ; phần tử đầu là đơn vị gốc của FeatureEngine. */
    List<String> units();

    Timing timing();

    List<String> validateMeasurement(Measurement m);

    /** Giá trị đo theo đơn vị của rule; null = không có dữ liệu (=> MEASUREMENT_UNRELIABLE, không phải "form tốt"). */
    Double value(Measurement m, String unit, MotionFeatures f);

    /** Chính rule này đo độ tin cậy (POSE_CONFIDENCE, LANDMARK_VISIBILITY) nên không bị chặn bởi kiểm tra tin cậy. */
    default boolean measuresReliability() { return false; }
}
