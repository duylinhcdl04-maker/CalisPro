package com.calishealth.api.engine.v2.progression;

import com.calishealth.api.engine.v2.progression.ProgressionModels.*;

import java.util.*;

/**
 * Xác định highestAchievedStage trong MỘT ladder (Quyết định 2): stage cao nhất có PASS hợp lệ và thoả tiên quyết;
 * KHÔNG lấy trung bình các stage. Hàm thuần, không đọc DB.
 *
 * I19: chỉ số liệu ĐỦ + TIN CẬY chưa đạt mới là FAIL. Chưa thử/thiếu ⇒ NOT_ASSESSED; đo không tin cậy ⇒ UNRELIABLE.
 */
public final class ProgressionLadderEngine {

    private enum Raw { PASS, FAIL, NOT_ASSESSED, UNRELIABLE }

    public LadderResult evaluate(Ladder ladder, LadderInput input) {
        List<Stage> stages = ladder.stages().stream().sorted(Comparator.comparingInt(Stage::rank)).toList();
        Map<String, Stage> byCode = new HashMap<>();
        stages.forEach(s -> byCode.put(s.code(), s));

        Map<String, Raw> raw = new LinkedHashMap<>();
        Map<String, Double> values = new HashMap<>();
        for (Stage s : stages) {
            Observation o = input.byStage().get(s.code());
            if (o == null || o.kind() == Measurement.NOT_TRIED || (o.kind() == Measurement.MEASURED && o.value() == null)) raw.put(s.code(), Raw.NOT_ASSESSED);
            else if (o.kind() == Measurement.UNRELIABLE) raw.put(s.code(), Raw.UNRELIABLE);
            else {
                values.put(s.code(), o.value());
                raw.put(s.code(), o.value() >= s.passValue() ? Raw.PASS : Raw.FAIL);
            }
        }

        Map<String, StageStatus> status = new LinkedHashMap<>();
        Map<String, String> reason = new HashMap<>();
        Map<String, String> origin = new HashMap<>();

        for (Stage s : stages) {
            switch (raw.get(s.code())) {
                case PASS -> {
                    String blocker = closure(ladder, s.code()).stream().filter(p -> raw.get(p) == Raw.FAIL).findFirst().orElse(null);
                    if (blocker != null) { status.put(s.code(), StageStatus.REJECTED_PREREQ); reason.put(s.code(), "PREREQUISITE_FAILED:" + blocker); }
                    else status.put(s.code(), StageStatus.PASS);
                }
                case FAIL -> { status.put(s.code(), StageStatus.FAIL); reason.put(s.code(), "BELOW_PASS_VALUE"); }
                case UNRELIABLE -> { status.put(s.code(), StageStatus.UNRELIABLE); reason.put(s.code(), "UNRELIABLE_MEASUREMENT"); }
                case NOT_ASSESSED -> { status.put(s.code(), StageStatus.NOT_ASSESSED); reason.put(s.code(), "NOT_TRIED"); }
            }
        }

        // Suy luận: tiên quyết bắc cầu chưa được hỏi của một stage PASS đã chấp nhận => INFERRED_PASS (không bắt user trả lời lại bài dễ)
        for (Stage s : stages) {
            if (status.get(s.code()) != StageStatus.PASS) continue;
            for (String p : closure(ladder, s.code())) {
                if (raw.get(p) == Raw.NOT_ASSESSED && status.get(p) == StageStatus.NOT_ASSESSED) {
                    status.put(p, StageStatus.INFERRED_PASS);
                    origin.put(p, "INFERRED");
                    reason.put(p, "INFERRED_FROM:" + s.code());
                }
            }
        }

        Stage highest = stages.stream().filter(s -> status.get(s.code()) == StageStatus.PASS).max(Comparator.comparingInt(Stage::rank)).orElse(null);

        Double ratio = null, score = null;
        EvidenceState state;
        if (highest != null) {
            ratio = highest.targetValue() <= 0 ? 0 : Math.min(1, values.get(highest.code()) / highest.targetValue());
            score = highest.baseScore() + highest.spanScore() * ratio;
            state = EvidenceState.ACHIEVED;
        } else if (input.explicitNoneAchieved() || (!stages.isEmpty() && raw.get(stages.get(0).code()) == Raw.FAIL)) {
            // Chỉ khi có bằng chứng TIÊU CỰC tường minh ở nấc thấp nhất mới coi là "chưa đạt nấc nào" (điểm 0).
            score = 0.0;
            state = EvidenceState.NONE_ACHIEVED;
        } else if (raw.containsValue(Raw.UNRELIABLE)) {
            state = EvidenceState.UNRELIABLE;       // điểm null: không suy diễn từ dữ liệu không tin cậy
        } else {
            state = EvidenceState.NO_EVIDENCE;      // điểm null (KHÔNG phải 0)
        }

        List<StageEvaluation> evaluations = stages.stream().map(s -> new StageEvaluation(s.code(), s.rank(), status.get(s.code()),
                origin.getOrDefault(s.code(), "DIRECT"), values.get(s.code()), reason.get(s.code()))).toList();
        return new LadderResult(ladder.code(), highest == null ? null : highest.code(), highest == null ? null : highest.rank(), ratio, score, state, evaluations);
    }

    /** Tiên quyết bắt buộc bắc cầu của một stage (bỏ qua cạnh allowBypass và nhánh dưới nó). */
    static Set<String> closure(Ladder ladder, String stage) {
        Set<String> out = new LinkedHashSet<>();
        Deque<String> todo = new ArrayDeque<>(List.of(stage));
        while (!todo.isEmpty()) {
            String cur = todo.pop();
            for (Prerequisite p : ladder.prerequisites()) {
                if (p.stage().equals(cur) && p.mandatory() && !p.allowBypass() && out.add(p.prerequisite())) todo.push(p.prerequisite());
            }
        }
        return out;
    }
}
