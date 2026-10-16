package com.calishealth.api.service;

import com.calishealth.api.dto.ExerciseDtos.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Đọc/ghi dữ liệu chi tiết của Exercise Builder trên các bảng con:
 * exercise_phases, exercise_muscles (+ muscles), exercise_coaching_cues, exercise_common_mistakes,
 * exercise_anatomy_images, exercise_attributes và các cột kỹ thuật trên bảng exercises.
 */
@Service
@Transactional(readOnly = true)
public class ExerciseDetailsService {
    private static final Map<String, BigDecimal> ACTIVATION_PERCENT = Map.of(
            "LOW", BigDecimal.valueOf(25),
            "MODERATE", BigDecimal.valueOf(50),
            "HIGH", BigDecimal.valueOf(75),
            "VERY_HIGH", BigDecimal.valueOf(100)
    );

    private final ExercisePhaseRepository phaseRepo;
    private final ExerciseMuscleRepository exerciseMuscleRepo;
    private final MuscleRepository muscleRepo;
    private final ExerciseCoachingCueRepository cueRepo;
    private final ExerciseCommonMistakeRepository mistakeRepo;
    private final ExerciseAnatomyImageRepository anatomyImageRepo;
    private final ExerciseAttributeRepository attributeRepo;

    public ExerciseDetailsService(
            ExercisePhaseRepository phaseRepo,
            ExerciseMuscleRepository exerciseMuscleRepo,
            MuscleRepository muscleRepo,
            ExerciseCoachingCueRepository cueRepo,
            ExerciseCommonMistakeRepository mistakeRepo,
            ExerciseAnatomyImageRepository anatomyImageRepo,
            ExerciseAttributeRepository attributeRepo
    ) {
        this.phaseRepo = phaseRepo;
        this.exerciseMuscleRepo = exerciseMuscleRepo;
        this.muscleRepo = muscleRepo;
        this.cueRepo = cueRepo;
        this.mistakeRepo = mistakeRepo;
        this.anatomyImageRepo = anatomyImageRepo;
        this.attributeRepo = attributeRepo;
    }

    // ============================== WRITE ==============================

    /** Ghi đè toàn bộ dữ liệu chi tiết của động tác (exercise phải đã được persist). */
    @Transactional
    public void replaceDetails(Exercise exercise, ExerciseDetailsDto d) {
        exercise.setBuilderVersion(blankToNull(d.version()) != null ? d.version().trim() : "1.0");
        exercise.setDisplayName(blankToNull(d.displayName()));
        exercise.setTrainingCategory(blankToNull(d.trainingCategory()));
        exercise.setAnimationUrl(blankToNull(d.animationUrl()));
        exercise.setSetupInstructions(blankToNull(d.setup()));
        exercise.setExecutionInstructions(blankToNull(d.execution()));
        exercise.setInhaleTiming(blankToNull(d.inhaleTiming()));
        exercise.setExhaleTiming(blankToNull(d.exhaleTiming()));
        exercise.setTempo(blankToNull(d.tempo()));
        exercise.setContraindications(d.safety() != null ? blankToNull(d.safety().contraindications()) : null);
        exercise.setGeneralConsiderations(d.safety() != null ? blankToNull(d.safety().generalConsiderations()) : null);
        exercise.setAiAnalysisData(blankToNull(d.aiAnalysisData()));
        if (d.sessionRoles() != null) exercise.setSessionRoles(joinRoles(d.sessionRoles()));
        if (d.aiEnabled() != null) exercise.setAiEnabled(d.aiEnabled());

        Long exerciseId = exercise.getId();
        deleteDetails(exerciseId);

        int i = 0;
        for (PhaseDto p : nonNull(d.phases())) {
            if (blankToNull(p.name()) == null) continue;
            ExercisePhase e = new ExercisePhase();
            e.setExercise(exercise);
            e.setSortOrder(p.order() != null ? p.order() : ++i);
            e.setName(p.name().trim());
            e.setVietnameseName(blankToNull(p.vietnameseName()));
            e.setDescription(blankToNull(p.description()));
            e.setCoachingCue(blankToNull(p.coachingCue()));
            e.setBreathing(blankToNull(p.breathing()));
            e.setMuscleFocus(blankToNull(p.muscleFocus()));
            e.setMediaUrl(blankToNull(p.mediaUrl()));
            phaseRepo.save(e);
        }

        saveMuscleTargets(exercise, nonNull(d.muscleTargets()));

        i = 0;
        for (CoachingCueDto c : nonNull(d.coachingCues())) {
            if (blankToNull(c.text()) == null) continue;
            ExerciseCoachingCue e = new ExerciseCoachingCue();
            e.setExercise(exercise);
            e.setSortOrder(++i);
            e.setContent(c.text().trim());
            e.setPriority(blankToNull(c.priority()));
            e.setCategory(blankToNull(c.category()));
            cueRepo.save(e);
        }

        i = 0;
        for (CommonMistakeDto m : nonNull(d.commonMistakes())) {
            if (blankToNull(m.name()) == null) continue;
            ExerciseCommonMistake e = new ExerciseCommonMistake();
            e.setExercise(exercise);
            e.setSortOrder(++i);
            e.setName(m.name().trim());
            e.setProblem(blankToNull(m.problem()));
            e.setWhyItHappens(blankToNull(m.whyItHappens()));
            e.setCorrection(blankToNull(m.correction()));
            e.setSeverity(blankToNull(m.severity()));
            e.setMediaUrl(blankToNull(m.mediaUrl()));
            mistakeRepo.save(e);
        }

        i = 0;
        for (AnatomyImageDto img : nonNull(d.anatomyImages())) {
            if (blankToNull(img.url()) == null) continue;
            ExerciseAnatomyImage e = new ExerciseAnatomyImage();
            e.setExercise(exercise);
            e.setSortOrder(++i);
            e.setUrl(img.url().trim());
            e.setCaption(blankToNull(img.caption()));
            e.setPrimaryImage(Boolean.TRUE.equals(img.primary()));
            anatomyImageRepo.save(e);
        }

        saveAttributes(exercise, ExerciseAttribute.TAG, d.tags());
        saveAttributes(exercise, ExerciseAttribute.EQUIPMENT, d.equipment());
        if (d.safety() != null) {
            saveAttributes(exercise, ExerciseAttribute.SAFETY_CUE, d.safety().safetyCues());
            saveAttributes(exercise, ExerciseAttribute.STOP_CONDITION, d.safety().stopConditions());
        }
    }

    /** Xóa toàn bộ dữ liệu chi tiết (dùng khi ghi đè hoặc xóa động tác). */
    @Transactional
    public void deleteDetails(Long exerciseId) {
        phaseRepo.deleteByExerciseId(exerciseId);
        exerciseMuscleRepo.deleteByExerciseId(exerciseId);
        cueRepo.deleteByExerciseId(exerciseId);
        mistakeRepo.deleteByExerciseId(exerciseId);
        anatomyImageRepo.deleteByExerciseId(exerciseId);
        attributeRepo.deleteByExerciseId(exerciseId);
    }

    private void saveMuscleTargets(Exercise exercise, List<MuscleTargetDto> targets) {
        // Gộp trùng theo mã cơ (khóa chính exercise_muscles là exercise_id + muscle_id)
        Map<String, MuscleTargetDto> byCode = new LinkedHashMap<>();
        for (MuscleTargetDto t : targets) {
            String code = normalizeCode(t.muscleCode());
            if (code != null) byCode.putIfAbsent(code, t);
        }
        if (byCode.isEmpty()) return;

        // Danh mục cơ tự đồng bộ theo catalog của frontend: chưa có thì tạo, có rồi thì bổ sung tên/vùng
        Map<String, Muscle> muscles = muscleRepo.findByCodeIn(byCode.keySet()).stream()
                .collect(Collectors.toMap(muscle -> muscle.getCode(), Function.identity()));

        int i = 0;
        for (Map.Entry<String, MuscleTargetDto> entry : byCode.entrySet()) {
            MuscleTargetDto t = entry.getValue();
            Muscle muscle = muscles.get(entry.getKey());
            if (muscle == null) {
                muscle = new Muscle();
                muscle.setCode(entry.getKey());
                muscle.setName(truncate(firstNonBlank(t.muscleName(), t.muscleNameVi(), entry.getKey()), 100));
            }
            if (blankToNull(t.muscleNameVi()) != null) muscle.setNameVi(truncate(t.muscleNameVi().trim(), 100));
            if (blankToNull(t.bodyRegion()) != null) muscle.setBodyRegion(truncate(t.bodyRegion().trim(), 50));
            if (blankToNull(t.side()) != null) muscle.setSide(truncate(t.side().trim(), 10));
            muscle = muscleRepo.save(muscle);

            ExerciseMuscle em = new ExerciseMuscle();
            em.setExercise(exercise);
            em.setMuscle(muscle);
            em.setRole(parseRole(t.role()));
            String level = blankToNull(t.activationLevel()) != null ? t.activationLevel().trim().toUpperCase() : "MODERATE";
            em.setActivationLevel(level);
            em.setActivationPercent(ACTIVATION_PERCENT.getOrDefault(level, BigDecimal.valueOf(50)));
            em.setLaterality(blankToNull(t.laterality()));
            em.setExpectedSensations(truncate(joinCodes(t.expectedSensations()), 255));
            em.setUnexpectedSensations(truncate(joinCodes(t.unexpectedSensations()), 255));
            em.setUserGuidance(truncate(blankToNull(t.userGuidance()), 500));
            em.setSortOrder(++i);
            exerciseMuscleRepo.save(em);
        }
    }

    private void saveAttributes(Exercise exercise, String type, List<String> values) {
        int i = 0;
        Set<String> seen = new HashSet<>();
        for (String v : nonNull(values)) {
            String value = blankToNull(v);
            if (value == null || !seen.add(value.toLowerCase())) continue;
            ExerciseAttribute a = new ExerciseAttribute();
            a.setExercise(exercise);
            a.setAttributeType(type);
            a.setSortOrder(++i);
            a.setAttributeValue(truncate(value.trim(), 500));
            attributeRepo.save(a);
        }
    }

    // ============================== READ ==============================

    /** Nạp dữ liệu chi tiết cho nhiều động tác cùng lúc (mỗi bảng con chỉ 1 query). */
    public Map<Long, ExerciseDetailsDto> loadDetails(Collection<Exercise> exercises) {
        if (exercises.isEmpty()) return Map.of();
        List<Long> ids = exercises.stream().map(exercise -> exercise.getId()).toList();

        Map<Long, List<ExercisePhase>> phases = group(phaseRepo.findByExerciseIdInOrderBySortOrderAsc(ids), x -> x.getExercise().getId());
        Map<Long, List<ExerciseMuscle>> muscles = group(exerciseMuscleRepo.findWithMuscleByExerciseIds(ids), x -> x.getExercise().getId());
        Map<Long, List<ExerciseCoachingCue>> cues = group(cueRepo.findByExerciseIdInOrderBySortOrderAsc(ids), x -> x.getExercise().getId());
        Map<Long, List<ExerciseCommonMistake>> mistakes = group(mistakeRepo.findByExerciseIdInOrderBySortOrderAsc(ids), x -> x.getExercise().getId());
        Map<Long, List<ExerciseAnatomyImage>> images = group(anatomyImageRepo.findByExerciseIdInOrderBySortOrderAsc(ids), x -> x.getExercise().getId());
        Map<Long, List<ExerciseAttribute>> attributes = group(attributeRepo.findByExerciseIdInOrderBySortOrderAsc(ids), x -> x.getExercise().getId());

        Map<Long, ExerciseDetailsDto> result = new HashMap<>();
        for (Exercise e : exercises) {
            Long id = e.getId();
            List<ExerciseAttribute> attrs = attributes.getOrDefault(id, List.of());
            result.put(id, new ExerciseDetailsDto(
                    e.getBuilderVersion(),
                    e.getDisplayName(),
                    e.getTrainingCategory(),
                    e.getAnimationUrl(),
                    attributeValues(attrs, ExerciseAttribute.TAG),
                    attributeValues(attrs, ExerciseAttribute.EQUIPMENT),
                    e.getSetupInstructions(),
                    e.getExecutionInstructions(),
                    e.getInhaleTiming(),
                    e.getExhaleTiming(),
                    e.getTempo(),
                    new SafetyDto(
                            e.getContraindications(),
                            e.getGeneralConsiderations(),
                            attributeValues(attrs, ExerciseAttribute.SAFETY_CUE),
                            attributeValues(attrs, ExerciseAttribute.STOP_CONDITION)
                    ),
                    phases.getOrDefault(id, List.of()).stream().map(p -> new PhaseDto(
                            p.getSortOrder(), p.getName(), p.getVietnameseName(), p.getDescription(),
                            p.getCoachingCue(), p.getBreathing(), p.getMuscleFocus(), p.getMediaUrl()
                    )).toList(),
                    muscles.getOrDefault(id, List.of()).stream().map(m -> new MuscleTargetDto(
                            m.getMuscle().getCode(), m.getMuscle().getName(), m.getMuscle().getNameVi(),
                            m.getMuscle().getBodyRegion(), m.getMuscle().getSide(),
                            m.getRole().name(), m.getActivationLevel(), m.getLaterality(),
                            splitCodes(m.getExpectedSensations()), splitCodes(m.getUnexpectedSensations()),
                            m.getUserGuidance()
                    )).toList(),
                    cues.getOrDefault(id, List.of()).stream()
                            .map(c -> new CoachingCueDto(c.getContent(), c.getPriority(), c.getCategory())).toList(),
                    mistakes.getOrDefault(id, List.of()).stream().map(m -> new CommonMistakeDto(
                            m.getName(), m.getProblem(), m.getWhyItHappens(), m.getCorrection(), m.getSeverity(), m.getMediaUrl()
                    )).toList(),
                    images.getOrDefault(id, List.of()).stream()
                            .map(img -> new AnatomyImageDto(img.getUrl(), img.getCaption(), img.isPrimaryImage())).toList(),
                    e.getAiAnalysisData(),
                    splitRoles(e.getSessionRoles()),
                    e.isAiEnabled()
            ));
        }
        return result;
    }

    // ============================== HELPERS ==============================

    private static <T> Map<Long, List<T>> group(List<T> items, Function<T, Long> key) {
        return items.stream().collect(Collectors.groupingBy(key, LinkedHashMap::new, Collectors.toList()));
    }

    private static List<String> attributeValues(List<ExerciseAttribute> attrs, String type) {
        return attrs.stream().filter(a -> type.equals(a.getAttributeType())).map(exerciseAttribute -> exerciseAttribute.getAttributeValue()).toList();
    }

    private static MuscleRole parseRole(String role) {
        try {
            return role == null ? MuscleRole.PRIMARY : MuscleRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return MuscleRole.SECONDARY;
        }
    }

    private static String normalizeCode(String code) {
        String c = blankToNull(code);
        return c == null ? null : truncate(c.trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_"), 50);
    }

    private static String joinCodes(List<String> codes) {
        String joined = nonNull(codes).stream().map(ExerciseDetailsService::blankToNull).filter(Objects::nonNull)
                .map(text -> text.trim()).collect(Collectors.joining(","));
        return joined.isEmpty() ? null : joined;
    }

    private static List<String> splitCodes(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(text -> text.trim()).filter(s -> !s.isEmpty()).toList();
    }

    private static <T> List<T> nonNull(List<T> list) {
        return list == null ? List.of() : list;
    }

    public static final List<String> SESSION_ROLES = List.of("WARMUP", "MAIN", "ACCESSORY", "COOLDOWN");

    /** Chỉ nhận 4 phần của buổi tập, bỏ trùng, giữ thứ tự chuẩn. Giá trị lạ là lỗi để không lưu rác. */
    static String joinRoles(List<String> roles) {
        Set<String> chosen = new HashSet<>();
        for (String r : roles) {
            String v = r == null ? "" : r.trim().toUpperCase();
            if (v.isEmpty()) continue;
            if (!SESSION_ROLES.contains(v)) throw new IllegalArgumentException("Phần của buổi tập không hợp lệ: " + r + " (chỉ nhận WARMUP, MAIN, ACCESSORY, COOLDOWN)");
            chosen.add(v);
        }
        String out = String.join(",", SESSION_ROLES.stream().filter(chosen::contains).toList());
        return out.isEmpty() ? null : out;
    }

    static List<String> splitRoles(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) if (blankToNull(v) != null) return v.trim();
        return null;
    }

    private static String truncate(String s, int max) {
        return (s == null || s.length() <= max) ? s : s.substring(0, max);
    }
}
