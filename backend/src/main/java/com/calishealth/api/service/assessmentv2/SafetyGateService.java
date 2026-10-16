package com.calishealth.api.service.assessmentv2;

import com.calishealth.api.safety.SafetyModels.Status;
import com.calishealth.api.service.assessmentv2.SafetyStatusService.View;
import org.springframework.stereotype.Service;

/**
 * Cổng an toàn cho các hành động có điều kiện (sinh Cycle, bắt đầu Periodic...). Trả về Safety Status để bên gọi áp ràng buộc
 * (Eligibility / Load / Participation). Acknowledgement chỉ MỞ KHOÁ hành động nằm trong require_acknowledgement_for; nó không bớt ràng buộc nào.
 */
@Service
public class SafetyGateService {
    private final SafetyStatusService status;
    private final SafetyConfigLoader configs;

    public SafetyGateService(SafetyStatusService status, SafetyConfigLoader configs) { this.status = status; this.configs = configs; }

    public View check(long userId, String action) {
        View v = status.current(userId).orElseThrow(() -> new IllegalStateException("SAFETY_SCREENING_REQUIRED: cần hoàn tất sàng lọc an toàn trước"));
        if (v.status() == Status.CLEARED && v.expired()) throw new IllegalStateException("SAFETY_SCREENING_REQUIRED: kết quả sàng lọc đã hết hạn");
        SafetyConfigLoader.Config cfg = configs.load(v.ruleSetId());
        if (cfg.blockedActions().getOrDefault(v.status(), java.util.Set.of()).contains(action))
            throw new IllegalStateException("ACTION_BLOCKED_BY_SAFETY_POLICY: " + action);
        if (cfg.requireAcknowledgementFor().getOrDefault(v.status(), java.util.Set.of()).contains(action) && !v.acknowledged())
            throw new IllegalStateException("ACKNOWLEDGEMENT_REQUIRED: cần xác nhận đã đọc khuyến nghị an toàn trước khi " + action);
        return v;
    }
}
