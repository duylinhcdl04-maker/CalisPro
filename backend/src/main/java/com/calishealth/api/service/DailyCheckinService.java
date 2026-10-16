package com.calishealth.api.service;

import com.calishealth.api.dto.GoalAndTrackingDtos.DailyCheckinRequest;
import com.calishealth.api.dto.GoalAndTrackingDtos.DailyCheckinResponse;
import com.calishealth.api.entity.DailyCheckin;
import com.calishealth.api.entity.User;
import com.calishealth.api.repository.DailyCheckinRepository;
import com.calishealth.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DailyCheckinService {
    private final DailyCheckinRepository checkinRepo;
    private final UserRepository userRepo;

    public DailyCheckinService(DailyCheckinRepository checkinRepo, UserRepository userRepo) {
        this.checkinRepo = checkinRepo;
        this.userRepo = userRepo;
    }

    /** Tùy chọn: điểm danh hằng ngày chính là check-in sức khỏe; ghi EXP khi rule set có bật tính năng EXP. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.calishealth.api.service.exp.ExpService exp;

    public List<DailyCheckinResponse> listUserCheckins(Long userId) {
        return checkinRepo.findByUserIdOrderByCheckinDateDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public DailyCheckinResponse getCheckin(Long userId, Long id) {
        DailyCheckin c = checkinRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dữ liệu check-in với ID: " + id));
        return toResponse(c);
    }

    @Transactional
    public DailyCheckinResponse createOrUpdateCheckin(Long userId, DailyCheckinRequest req) {
        if (req.checkinDate() == null) {
            throw new IllegalArgumentException("Ngày check-in không được để trống");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        // If checkin for this date exists, update it. Otherwise create new.
        DailyCheckin c = checkinRepo.findByUserIdAndCheckinDate(userId, req.checkinDate())
                .orElseGet(() -> {
                    DailyCheckin nc = new DailyCheckin();
                    nc.setUser(user);
                    nc.setCheckinDate(req.checkinDate());
                    return nc;
                });

        c.setSleepHours(req.sleepHours());
        c.setEnergyLevel(req.energyLevel());
        c.setStressLevel(req.stressLevel());
        c.setMuscleSoreness(req.muscleSoreness());
        c.setMotivationLevel(req.motivationLevel());
        c.setNotes(req.notes());

        DailyCheckin saved = checkinRepo.save(c);
        if (exp != null) exp.onCheckin(userId, saved.getCheckinDate());
        return toResponse(saved);
    }

    @Transactional
    public DailyCheckinResponse updateCheckin(Long userId, Long id, DailyCheckinRequest req) {
        DailyCheckin c = checkinRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dữ liệu check-in với ID: " + id));

        if (req.checkinDate() != null) c.setCheckinDate(req.checkinDate());
        if (req.sleepHours() != null) c.setSleepHours(req.sleepHours());
        if (req.energyLevel() != null) c.setEnergyLevel(req.energyLevel());
        if (req.stressLevel() != null) c.setStressLevel(req.stressLevel());
        if (req.muscleSoreness() != null) c.setMuscleSoreness(req.muscleSoreness());
        if (req.motivationLevel() != null) c.setMotivationLevel(req.motivationLevel());
        if (req.notes() != null) c.setNotes(req.notes());

        return toResponse(checkinRepo.save(c));
    }

    @Transactional
    public void deleteCheckin(Long userId, Long id) {
        DailyCheckin c = checkinRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dữ liệu check-in với ID: " + id));
        checkinRepo.delete(c);
    }

    private DailyCheckinResponse toResponse(DailyCheckin c) {
        return new DailyCheckinResponse(
                c.getId(),
                c.getUser().getId(),
                c.getCheckinDate(),
                c.getSleepHours(),
                c.getEnergyLevel(),
                c.getStressLevel(),
                c.getMuscleSoreness(),
                c.getMotivationLevel(),
                c.getNotes(),
                c.getCreatedAt()
        );
    }
}
