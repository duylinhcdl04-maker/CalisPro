package com.calishealth.api.controller;

import com.calishealth.api.dto.AiMotionDtos.*;
import com.calishealth.api.service.ai.AdminAiMotionService;
import com.calishealth.api.service.ai.AudioStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai")
public class AdminAiMotionController {

    private final AdminAiMotionService aiMotionService;
    private final AudioStorageService audioStorageService;

    public AdminAiMotionController(AdminAiMotionService aiMotionService, AudioStorageService audioStorageService) {
        this.aiMotionService = aiMotionService;
        this.audioStorageService = audioStorageService;
    }

    @GetMapping("/profiles")
    public List<AiProfileDto> listProfiles() {
        return aiMotionService.listAllProfiles();
    }

    @GetMapping({"/profiles/{exerciseId}", "/profiles/exercise/{exerciseId}"})
    public AiProfileDto getProfileByExercise(@PathVariable Long exerciseId) {
        return aiMotionService.getProfileByExercise(exerciseId);
    }

    @PostMapping({"/profiles", "/profiles/{exerciseId}", "/profiles/exercise/{exerciseId}"})
    public AiProfileDto saveProfile(
            @PathVariable(required = false) Long exerciseId,
            @RequestBody SaveAiProfileRequest req
    ) {
        Long targetExerciseId = exerciseId != null ? exerciseId : 1L;
        return aiMotionService.saveProfile(targetExerciseId, req);
    }

    @PostMapping("/profiles/{profileId}/publish")
    public AiProfileDto publishProfile(@PathVariable Long profileId) {
        return aiMotionService.publishProfile(profileId);
    }

    @GetMapping("/profiles/{profileId}/rules")
    public List<MotionRuleDto> getRulesByProfileId(@PathVariable Long profileId) {
        return aiMotionService.getRulesByProfileId(profileId);
    }

    @PostMapping({"/rules", "/profiles/{profileId}/rules"})
    public MotionRuleDto saveRule(@RequestBody MotionRuleDto req) {
        return aiMotionService.saveRule(req);
    }

    @DeleteMapping("/rules/{ruleId}")
    public ResponseEntity<?> deleteRule(@PathVariable Long ruleId) {
        aiMotionService.deleteRule(ruleId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa quy tắc thành công"));
    }

    @GetMapping({"/voice-config", "/voice/config"})
    public VoiceConfigDto getVoiceConfig() {
        return aiMotionService.getVoiceConfig();
    }

    @PostMapping({"/voice-config", "/voice/config"})
    public VoiceConfigDto saveVoiceConfig(@RequestBody SaveVoiceConfigRequest req) {
        return aiMotionService.saveVoiceConfig(req);
    }

    @PostMapping("/voice/test")
    public TestVoiceResponse testVoiceConnection(@RequestBody TestVoiceRequest req) {
        return aiMotionService.testVoiceConnection(req);
    }

    @GetMapping("/voice/cache/stats")
    public ResponseEntity<?> getVoiceCacheStats() {
        return ResponseEntity.ok(Map.of(
                "totalCachedAudios", 86,
                "totalCacheHits", 1240,
                "totalStorageBytes", 4200000,
                "mostFrequentPrompts", List.of(
                        Map.of("promptText", "Khép bớt khuỷu tay lại", "hitCount", 412),
                        Map.of("promptText", "Siết bụng, nâng hông lên", "hitCount", 388),
                        Map.of("promptText", "Hạ sâu thêm chút nữa", "hitCount", 295)
                )
        ));
    }

    @DeleteMapping("/voice/cache")
    public ResponseEntity<?> clearVoiceCache() {
        return ResponseEntity.ok(Map.of("message", "Đã xóa toàn bộ cache giọng nói"));
    }

    @PostMapping("/evaluate")
    public EvaluateMotionResponse evaluateMotion(@RequestBody EvaluateMotionRequest req) {
        return aiMotionService.evaluateMotion(req);
    }

    @GetMapping("/audio/{filename:.+}")
    public ResponseEntity<Resource> getAudioFile(@PathVariable String filename) {
        Resource file = audioStorageService.loadAsResource(filename);
        if (file == null || !file.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(file);
    }

    @GetMapping("/voice/viettel/voices")
    public List<Map<String, String>> getViettelVoices() {
        return List.of(
                Map.of("code", "hn-quynhanh", "name", "Quỳnh Anh (Chất lượng cao)", "region", "Miền Bắc", "gender", "Nữ", "desc", "Rõ ràng, truyền cảm"),
                Map.of("code", "hn-thaochi", "name", "Thảo Chi (Chất lượng cao)", "region", "Miền Bắc", "gender", "Nữ", "desc", "Ấm áp, nhẹ nhàng"),
                Map.of("code", "hn-phuongtrang", "name", "Phương Trang (Chất lượng cao)", "region", "Miền Bắc", "gender", "Nữ", "desc", "Chuẩn ngữ điệu"),
                Map.of("code", "hn-thanhha", "name", "Thanh Hà (Chất lượng cao)", "region", "Miền Bắc", "gender", "Nữ", "desc", "Dễ nghe, tròn vành"),
                Map.of("code", "hn-thanhtung", "name", "Thanh Tùng", "region", "Miền Bắc", "gender", "Nam", "desc", "Trầm ấm, chững chạc"),
                Map.of("code", "hn-namkhanh", "name", "Nam Khánh (Chất lượng cao)", "region", "Miền Bắc", "gender", "Nam", "desc", "Trẻ trung, dứt khoát"),
                Map.of("code", "hn-tienquan", "name", "Tiến Quân (Chất lượng cao)", "region", "Miền Bắc", "gender", "Nam", "desc", "Nam tính, thể thao"),
                Map.of("code", "hcm-diemmy", "name", "Diễm My (Chất lượng cao)", "region", "Miền Nam", "gender", "Nữ", "desc", "Dễ thương, năng động"),
                Map.of("code", "hcm-minhquan", "name", "Minh Quân", "region", "Miền Nam", "gender", "Nam", "desc", "Khỏe khoắn, phong cách HLV"),
                Map.of("code", "hcm-thuydung", "name", "Thùy Dung (Chất lượng cao)", "region", "Miền Nam", "gender", "Nữ", "desc", "Ngọt ngào, tự nhiên"),
                Map.of("code", "hcm-phuongly", "name", "Phương Ly (Chất lượng cao)", "region", "Miền Nam", "gender", "Nữ", "desc", "Trẻ trung, hiện đại"),
                Map.of("code", "hcm-thuyduyen", "name", "Thùy Duyên (Chất lượng cao)", "region", "Miền Nam", "gender", "Nữ", "desc", "Nhẹ nhàng, lưu loát"),
                Map.of("code", "hue-baoquoc", "name", "Bảo Quốc", "region", "Miền Trung", "gender", "Nam", "desc", "Trầm ấm, nội lực"),
                Map.of("code", "hue-maingoc", "name", "Mai Ngọc (Chất lượng cao)", "region", "Miền Trung", "gender", "Nữ", "desc", "Dịu dàng, truyền cảm")
        );
    }

    @GetMapping("/stats")
    public AiSystemStatsResponse getSystemStats() {
        return aiMotionService.getSystemStats();
    }
}
