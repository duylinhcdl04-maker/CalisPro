package com.calishealth.api.service;

import com.calishealth.api.dto.ExerciseDtos.AiSyncDto;
import com.calishealth.api.dto.ExerciseDtos.ExerciseDetailsDto;
import com.calishealth.api.dto.ExerciseDtos.ExerciseRequest;
import com.calishealth.api.dto.ExerciseDtos.ExerciseResponse;
import com.calishealth.api.entity.Exercise;
import com.calishealth.api.entity.ExerciseAttribute;
import com.calishealth.api.entity.ExerciseCategory;
import com.calishealth.api.entity.MuscleRole;
import com.calishealth.api.repository.ExerciseAttributeRepository;
import com.calishealth.api.repository.ExerciseCategoryRepository;
import com.calishealth.api.repository.ExerciseMuscleRepository;
import com.calishealth.api.repository.ExerciseRepository;
import com.calishealth.api.service.ai.ExerciseAiSyncService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ExerciseService {
    private final ExerciseRepository repo;
    private final ExerciseCategoryRepository categoryRepo;
    private final ExerciseDetailsService detailsService;
    private final ExerciseMuscleRepository exerciseMuscleRepo;
    private final ExerciseAttributeRepository attributeRepo;
    private final ExerciseAiSyncService aiSyncService;

    public ExerciseService(
            ExerciseRepository repo,
            ExerciseCategoryRepository categoryRepo,
            ExerciseDetailsService detailsService,
            ExerciseMuscleRepository exerciseMuscleRepo,
            ExerciseAttributeRepository attributeRepo,
            ExerciseAiSyncService aiSyncService
    ) {
        this.repo = repo;
        this.categoryRepo = categoryRepo;
        this.detailsService = detailsService;
        this.exerciseMuscleRepo = exerciseMuscleRepo;
        this.attributeRepo = attributeRepo;
        this.aiSyncService = aiSyncService;
    }

    /**
     * Danh sách động tác, lọc tùy chọn theo danh mục, cấp độ, nhóm cơ (mã cơ + vai trò), tag, dụng cụ.
     */
    public List<ExerciseResponse> list(
            Long categoryId,
            String difficultyLevel,
            String muscleCode,
            String muscleRole,
            String tag,
            String equipment,
            boolean includeUnpublished
    ) {
        List<Exercise> exercises = categoryId != null ? repo.findByCategoryId(categoryId) : repo.findAll();
        // Học viên chỉ thấy bài đã xuất bản; bản nháp và bài đã xóa mềm chỉ Coach/Admin thấy
        if (!includeUnpublished) exercises = exercises.stream().filter(Exercise::isActive).toList();

        if (difficultyLevel != null && !difficultyLevel.isBlank()) {
            exercises = exercises.stream()
                    .filter(e -> difficultyLevel.equalsIgnoreCase(e.getDifficultyLevel()))
                    .toList();
        }
        if (muscleCode != null && !muscleCode.isBlank()) {
            MuscleRole role = parseRoleOrNull(muscleRole);
            Set<Long> ids = new HashSet<>(exerciseMuscleRepo.findExerciseIdsByMuscle(muscleCode.trim().toUpperCase(), role));
            exercises = exercises.stream().filter(e -> ids.contains(e.getId())).toList();
        }
        if (tag != null && !tag.isBlank()) {
            Set<Long> ids = new HashSet<>(attributeRepo.findExerciseIdsByAttribute(ExerciseAttribute.TAG, tag.trim()));
            exercises = exercises.stream().filter(e -> ids.contains(e.getId())).toList();
        }
        if (equipment != null && !equipment.isBlank()) {
            Set<Long> ids = new HashSet<>(attributeRepo.findExerciseIdsByAttribute(ExerciseAttribute.EQUIPMENT, equipment.trim()));
            exercises = exercises.stream().filter(e -> ids.contains(e.getId())).toList();
        }

        Map<Long, ExerciseDetailsDto> details = detailsService.loadDetails(exercises);
        return exercises.stream().map(e -> toResponse(e, details.get(e.getId()))).toList();
    }

    public ExerciseResponse getById(Long id, boolean includeUnpublished) {
        Exercise e = repo.findById(id)
                .filter(x -> includeUnpublished || x.isActive())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập với ID: " + id));
        return toResponseWithDetails(e);
    }

    /** Tùy chọn: thông báo cho Admin khi Coach gửi bài và cho Coach khi bài được xuất bản. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.notification.NotificationService notifications;

    /** canPublish=false (Coach): bài mới luôn là bản nháp; Admin xem lại rồi xuất bản. actorId là người thao tác. */
    @Transactional
    public ExerciseResponse create(ExerciseRequest req, boolean canPublish, Long actorId) {
        if (req.name() == null || req.name().isBlank()) {
            throw new IllegalArgumentException("Tên bài tập không được để trống");
        }

        String exerciseCode = (req.code() != null && !req.code().isBlank())
                ? req.code().trim().toLowerCase().replaceAll("[^a-z0-9_-]", "-")
                : req.name().trim().toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + (System.currentTimeMillis() % 10000);

        if (repo.findByCode(exerciseCode).isPresent()) {
            exerciseCode = exerciseCode + "-" + (System.currentTimeMillis() % 10000);
        }

        Long targetCatId = req.categoryId() != null ? req.categoryId() : 1L;
        ExerciseCategory category = categoryRepo.findById(targetCatId)
                .orElseGet(() -> categoryRepo.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục bài tập")));

        Exercise e = new Exercise();
        e.setCategory(category);
        e.setCode(exerciseCode);
        e.setName(req.name().trim());
        e.setDescription(req.description());
        e.setDifficultyLevel(req.difficultyLevel());
        e.setMovementPattern(req.movementPattern());
        e.setEquipmentRequired(Boolean.TRUE.equals(req.equipmentRequired()));
        e.setInstructions(req.instructions());
        e.setSafetyNotes(req.safetyNotes());
        e.setVideoUrl(req.videoUrl());
        e.setThumbnailUrl(req.thumbnailUrl());
        e.setActive(canPublish && (req.active() == null || req.active()));
        if (!canPublish) { e.setAuthorId(actorId); e.setSubmittedAt(java.time.Instant.now()); }
        e = repo.save(e);
        if (!canPublish && notifications != null)
            notifications.notifyRole("ADMIN", "EXERCISE_DRAFT_SUBMITTED", "Coach gửi động tác mới chờ xuất bản", "Động tác “" + e.getName() + "” đang là bản nháp, cần Admin xem lại và xuất bản.", "EXERCISE", e.getId());

        return saveDetailsAndSyncAi(e, req);
    }

    /** canPublish=false (Coach): sửa được nội dung nhưng không đổi trạng thái xuất bản của bài. */
    @Transactional
    public ExerciseResponse update(Long id, ExerciseRequest req, boolean canPublish, Long actorId) {
        Exercise e = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập với ID: " + id));
        boolean wasActive = e.isActive();

        if (req.name() != null && !req.name().isBlank()) {
            e.setName(req.name().trim());
        }
        if (req.categoryId() != null) {
            ExerciseCategory category = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục bài tập ID: " + req.categoryId()));
            e.setCategory(category);
        }
        if (req.description() != null) e.setDescription(req.description());
        if (req.difficultyLevel() != null) e.setDifficultyLevel(req.difficultyLevel());
        if (req.movementPattern() != null) e.setMovementPattern(req.movementPattern());
        if (req.equipmentRequired() != null) e.setEquipmentRequired(req.equipmentRequired());
        if (req.instructions() != null) e.setInstructions(req.instructions());
        if (req.safetyNotes() != null) e.setSafetyNotes(req.safetyNotes());
        if (req.videoUrl() != null) e.setVideoUrl(req.videoUrl());
        if (req.thumbnailUrl() != null) e.setThumbnailUrl(req.thumbnailUrl());
        if (canPublish && req.active() != null) e.setActive(req.active());
        if (!canPublish && !wasActive && e.getAuthorId() == null) { e.setAuthorId(actorId); e.setSubmittedAt(java.time.Instant.now()); }   // Coach nhận bản nháp chưa có tác giả
        boolean justPublished = canPublish && !wasActive && e.isActive();
        Long author = e.getAuthorId();
        if (justPublished) e.setSubmittedAt(null);
        e = repo.save(e);
        if (justPublished && author != null && notifications != null)
            notifications.notifyUsers(java.util.List.of(author), "EXERCISE_PUBLISHED", "Động tác của bạn đã được xuất bản", "Admin đã xuất bản động tác “" + e.getName() + "” vào Thư viện.", "EXERCISE", e.getId());

        return saveDetailsAndSyncAi(e, req);
    }

    /** canPublish=false (Coach): chỉ xóa được bản nháp; bài đã xuất bản đang có học viên dùng nên chỉ Admin gỡ. */
    /** Bài đang xuất bản? (Coach sửa bài đã xuất bản thì đi qua bước duyệt chỉnh sửa.) */
    public boolean isPublished(Long id) {
        return repo.findById(id).map(Exercise::isActive).orElse(false);
    }

    @Transactional
    public void delete(Long id, boolean canPublish) {
        Exercise e = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập với ID: " + id));
        if (!canPublish && e.isActive())
            throw new org.springframework.security.access.AccessDeniedException("Bài này đã xuất bản nên chỉ Admin được xóa. Hãy nhờ Admin gỡ bài.");
        // Soft-delete to preserve workout history
        e.setActive(false);
        e.setAuthorId(null);          // bài đã xóa không còn nằm trong hàng chờ xuất bản
        e.setSubmittedAt(null);
        repo.save(e);
    }

    /**
     * Lưu dữ liệu chi tiết (nếu có) và - khi động tác ở trạng thái xuất bản (active) - đồng bộ cấu hình AI
     * của Builder sang hồ sơ AI runtime. Bản nháp không đồng bộ để engine không chạy cấu hình dang dở.
     */
    private ExerciseResponse saveDetailsAndSyncAi(Exercise e, ExerciseRequest req) {
        AiSyncDto aiSync = null;
        if (req.details() != null) {
            detailsService.replaceDetails(e, req.details());
            if (e.isActive()) {
                ExerciseAiSyncService.SyncResult r = aiSyncService.syncFromBuilder(e);
                if (r != null) {
                    aiSync = new AiSyncDto(r.profileId(), r.profileVersion(), r.changed(), r.rulesSynced(), r.rulesSkipped(), r.landmarksSynced());
                }
            }
        }
        return toResponse(e, detailsService.loadDetails(List.of(e)).get(e.getId()), aiSync);
    }

    private ExerciseResponse toResponseWithDetails(Exercise e) {
        return toResponse(e, detailsService.loadDetails(List.of(e)).get(e.getId()));
    }

    private ExerciseResponse toResponse(Exercise e, ExerciseDetailsDto details) {
        return toResponse(e, details, null);
    }

    private ExerciseResponse toResponse(Exercise e, ExerciseDetailsDto details, AiSyncDto aiSync) {
        Long categoryId = (e.getCategory() != null) ? e.getCategory().getId() : null;
        String categoryName = (e.getCategory() != null) ? e.getCategory().getName() : "Chưa phân loại";

        return new ExerciseResponse(
                e.getId(),
                e.getCode(),
                e.getName(),
                e.getDescription(),
                categoryId,
                categoryName,
                e.getDifficultyLevel(),
                e.getMovementPattern(),
                e.isEquipmentRequired(),
                e.getInstructions(),
                e.getSafetyNotes(),
                e.getVideoUrl(),
                e.getThumbnailUrl(),
                e.isActive(),
                details,
                aiSync
        );
    }

    private static MuscleRole parseRoleOrNull(String role) {
        if (role == null || role.isBlank()) return null;
        try {
            return MuscleRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
