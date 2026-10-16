package com.calishealth.api.engine.config;

import java.util.*;

/**
 * Ảnh chụp bất biến của một rule set (đã nạp từ DB). Các engine chỉ đọc cấu hình qua object này,
 * không có ngưỡng nào viết cứng trong code - giá trị mặc định ở đây chỉ dùng khi rule set thiếu tham số.
 */
public record RuleSetConfig(
        Long id,
        String code,
        int version,
        Map<String, Double> params,
        List<CompetencyDef> competencies,
        List<LadderNode> ladderNodes,
        List<LevelDef> levels,
        List<ConsistencyRuleDef> consistencyRules
) {
    public static final String ALGORITHM_VERSION = "LEVEL_ENGINE_V1";
    public static final List<String> BANDS = List.of("FOUNDATION", "BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE");

    public record CompetencyDef(String code, String name, boolean primary, String aggregation) {}

    public record LadderNode(Long exerciseId, String exerciseCode, String exerciseName, String competency, int order,
                             String metric, double base, double span, double target, double entry, double[][] anchors) {
        /** nodeScore = base + span × g(value / target); g mặc định tuyến tính, cắt ở 1. */
        public double score(double value) {
            double x = target <= 0 ? 0 : Math.max(0, value / target);
            return base + span * g(Math.min(1, x));
        }

        private double g(double x) {
            if (anchors == null || anchors.length < 2) return x;
            for (int i = 1; i < anchors.length; i++) {
                double x0 = anchors[i - 1][0], y0 = anchors[i - 1][1], x1 = anchors[i][0], y1 = anchors[i][1];
                if (x <= x1) return x1 == x0 ? y1 : y0 + (y1 - y0) * (x - x0) / (x1 - x0);
            }
            return anchors[anchors.length - 1][1];
        }

        public boolean entered(double value) { return value >= entry; }
    }

    public record RequirementDef(String gate, String competency, Long exerciseId, String exerciseCode, String metric,
                                 String operator, double value, boolean mandatory, String sourceType) {
        public boolean satisfied(double actual) {
            return "LTE".equals(operator) ? actual <= value : actual >= value;
        }
    }

    public record LevelDef(String code, int rank, String name, double promoteMin, double regressBelow, double minConfidence,
                           String description, List<RequirementDef> requirements) {
        public List<RequirementDef> requirements(String gate) {
            return requirements.stream().filter(r -> gate.equals(r.gate())).toList();
        }
    }

    public record ConsistencyRuleDef(String code, String conditionJson, String severity, List<String> affected, String message) {}

    // ============================== Tham số ==============================

    public double param(String key, double defaultValue) {
        Double v = params.get(key);
        return v == null ? defaultValue : v;
    }

    public double overallWeight(String competency) { return param("overall.weight." + competency, 0); }
    public double sourceReliability(String source) { return param("reliability." + source, 0.5); }
    public double qualityFactor(String dataQuality) { return param("quality." + dataQuality, 1); }

    public List<CompetencyDef> primaryCompetencies() {
        return competencies.stream().filter(competencyDef -> competencyDef.primary()).toList();
    }

    public Optional<CompetencyDef> competency(String code) {
        return competencies.stream().filter(c -> c.code().equals(code)).findFirst();
    }

    // ============================== Thang tiến trình ==============================

    public List<LadderNode> ladder(String competency) {
        return ladderNodes.stream().filter(n -> n.competency().equals(competency))
                .sorted(Comparator.comparingInt(ladderNode -> ladderNode.order())).toList();
    }

    public Optional<LadderNode> ladderNode(Long exerciseId) {
        return ladderNodes.stream().filter(n -> n.exerciseId().equals(exerciseId)).findFirst();
    }

    public Optional<LadderNode> ladderNodeByCode(String exerciseCode) {
        return ladderNodes.stream().filter(n -> n.exerciseCode().equalsIgnoreCase(exerciseCode)).findFirst();
    }

    // ============================== Level ==============================

    public List<LevelDef> levelsAsc() {
        return levels.stream().sorted(Comparator.comparingInt(levelDef -> levelDef.rank())).toList();
    }

    public LevelDef level(String code) {
        return levels.stream().filter(l -> l.code().equals(code)).findFirst()
                .orElseGet(() -> levelsAsc().get(0));
    }

    public LevelDef levelByRank(int rank) {
        List<LevelDef> asc = levelsAsc();
        return asc.get(Math.max(0, Math.min(asc.size() - 1, rank)));
    }

    public int maxRank() { return levelsAsc().get(levels.size() - 1).rank(); }

    // ============================== Band năng lực ==============================

    public double bandMin(String band) {
        return switch (band) {
            case "BEGINNER" -> param("band.BEGINNER", 25);
            case "INTERMEDIATE" -> param("band.INTERMEDIATE", 50);
            case "ADVANCED" -> param("band.ADVANCED", 70);
            case "ELITE" -> param("band.ELITE", 85);
            default -> 0;
        };
    }

    /** Band theo điểm, có hysteresis: lên ngay khi đạt mốc; chỉ xuống khi thấp hơn mốc của band hiện tại một khoảng margin. */
    public String band(Double score, String previousBand) {
        if (score == null) return previousBand;
        int raw = 0;
        for (int i = 0; i < BANDS.size(); i++) if (score >= bandMin(BANDS.get(i))) raw = i;
        if (previousBand == null || !BANDS.contains(previousBand)) return BANDS.get(raw);
        int current = BANDS.indexOf(previousBand);
        if (raw >= current) return BANDS.get(raw);
        double margin = param("band.margin", 5);
        while (current > 0 && score < bandMin(BANDS.get(current)) - margin) current--;
        return BANDS.get(current);
    }
}
