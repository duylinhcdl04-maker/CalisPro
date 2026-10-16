package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.engine.v2.level.TrainingStabilityEvaluator.Obs;

import java.util.List;

/** Nguồn các buổi tập thật của người dùng cho cổng Stability của V2 (tách khỏi v1 để test không phụ thuộc bảng nhật ký tập). */
public interface TrainingEvidenceSource {
    /** Các buổi tập hoàn thành trong `windowDays` ngày gần nhất, theo mã bài tập. */
    List<Obs> observations(long userId, int windowDays);
}
