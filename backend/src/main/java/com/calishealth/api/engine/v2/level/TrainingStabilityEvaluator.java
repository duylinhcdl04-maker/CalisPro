package com.calishealth.api.engine.v2.level;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Cổng Stability theo chất lượng các buổi tập thật trong lộ trình (ASSESSMENT_FRAMEWORK_V2 §41; v1: LevelGates.stability nhánh "TRAINING_LOG_WINDOW").
 * Hàm thuần (không đọc DB). Xét "bài nút cổ chai" của level đích (tỉ lệ thành tích đo được / yêu cầu thấp nhất; hoà thì xét tất cả):
 * PASS khi ít nhất `minPass` trong `lastN` buổi tập gần nhất (trong `windowDays` ngày) đạt chỉ tiêu bài đó (hoặc bài khó hơn cùng ladder đạt ≥ 1) VỚI điểm form ≥ `minForm`.
 * I19: chưa đủ buổi tập thì INSUFFICIENT (thiếu bằng chứng), không bao giờ là FAIL; chỉ khi đã có đủ `lastN` buổi mà vẫn không đạt mới là FAIL.
 */
public final class TrainingStabilityEvaluator {

    public enum Verdict { PASS, FAIL, INSUFFICIENT }

    /** Một buổi tập của một bài: giá trị tốt nhất (rep/giây) và điểm form (null = không chấm được, không tính là đạt). */
    public record Obs(String exercise, Instant at, double bestValue, Double formScore) {}

    /** Yêu cầu hiệu năng bắt buộc của level đích. measured = thành tích đo được trong lần đánh giá này (null = chưa đo). equivalents = các bài khó hơn/bằng cùng ladder. */
    public record Req(String exercise, double required, Double measured, Set<String> equivalents) {
        double ratio() { return measured == null || required <= 0 ? 0 : measured / required; }
    }

    public record Result(Verdict verdict, String reasonCode, List<String> bottlenecks, int qualifying, int considered) {}

    public Result evaluate(List<Req> requirements, List<Obs> observations, Instant now, int windowDays, int lastN, int minPass, double minForm) {
        if (requirements.isEmpty()) return new Result(Verdict.PASS, "NO_BENCHMARK", List.of(), 0, 0);
        double minRatio = requirements.stream().mapToDouble(Req::ratio).min().orElse(0);
        List<String> names = new ArrayList<>();
        int bestQualifying = Integer.MAX_VALUE, bestConsidered = Integer.MAX_VALUE;
        boolean allPass = true, anyEnough = false;

        for (Req r : requirements) {
            if (Math.abs(r.ratio() - minRatio) > 1e-9) continue;
            names.add(r.exercise());
            List<Obs> recent = observations.stream()
                    .filter(o -> o.exercise().equals(r.exercise()) || r.equivalents().contains(o.exercise()))
                    .filter(o -> Duration.between(o.at(), now).toDays() <= windowDays)
                    .sorted(Comparator.comparing(Obs::at).reversed())
                    .limit(lastN).toList();
            int qualifying = (int) recent.stream()
                    .filter(o -> (o.exercise().equals(r.exercise()) ? o.bestValue() >= r.required() : o.bestValue() >= 1))
                    .filter(o -> o.formScore() != null && o.formScore() >= minForm).count();
            allPass &= qualifying >= minPass;
            anyEnough |= recent.size() >= lastN;
            bestQualifying = Math.min(bestQualifying, qualifying);
            bestConsidered = Math.min(bestConsidered, recent.size());
        }
        if (allPass) return new Result(Verdict.PASS, "TRAINING_LOG_WINDOW", names, bestQualifying, bestConsidered);
        // đủ số buổi để kết luận mà vẫn không đạt ⇒ FAIL thật; chưa đủ buổi ⇒ thiếu bằng chứng (I19)
        return new Result(anyEnough ? Verdict.FAIL : Verdict.INSUFFICIENT, anyEnough ? "TRAINING_LOG_NOT_QUALIFYING" : "TRAINING_LOG_TOO_FEW_SESSIONS",
                names, bestQualifying, bestConsidered);
    }
}
