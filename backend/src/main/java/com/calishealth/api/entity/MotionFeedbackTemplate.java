package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Feedback template theo Feedback Code: văn bản hiển thị (UI) + câu đọc ngắn (voice).
 * Rule chỉ tham chiếu feedback_code; giọng đọc / sinh audio do module Voice quản lý (audio cache theo hash văn bản).
 */
@Entity
@Table(name = "motion_feedback_templates", uniqueConstraints = @UniqueConstraint(name = "uk_feedback_code_lang", columnNames = {"feedback_code", "language"}))
public class MotionFeedbackTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "ai_profile_id") private Long aiProfileId;
    @Column(name = "feedback_code", nullable = false, length = 100) private String feedbackCode;
    @Column(nullable = false, length = 10) private String language = "vi";
    @Column(name = "ui_text", nullable = false, columnDefinition = "text") private String uiText;
    @Column(name = "voice_text", length = 200) private String voiceText;
    @Column(nullable = false) private boolean active = true;
    /** Hash (text|voice|tốc độ) của lần tạo audio gần nhất - khác hash hiện tại => audio OUTDATED */
    @Column(name = "audio_text_hash", length = 64) private String audioTextHash;
    @Column(name = "updated_by", length = 150) private String updatedBy;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public Long getAiProfileId() { return aiProfileId; } public void setAiProfileId(Long v) { aiProfileId = v; }
    public String getFeedbackCode() { return feedbackCode; } public void setFeedbackCode(String v) { feedbackCode = v; }
    public String getLanguage() { return language; } public void setLanguage(String v) { language = v; }
    public String getUiText() { return uiText; } public void setUiText(String v) { uiText = v; }
    public String getVoiceText() { return voiceText; } public void setVoiceText(String v) { voiceText = v; }
    public boolean isActive() { return active; } public void setActive(boolean v) { active = v; }
    public String getAudioTextHash() { return audioTextHash; } public void setAudioTextHash(String v) { audioTextHash = v; }
    public String getUpdatedBy() { return updatedBy; } public void setUpdatedBy(String v) { updatedBy = v; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
