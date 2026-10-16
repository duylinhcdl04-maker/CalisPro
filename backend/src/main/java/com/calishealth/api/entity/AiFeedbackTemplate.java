package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_feedback_templates")
public class AiFeedbackTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rule_id", nullable = false)
    private AiMotionRule rule;

    @Column(nullable = false, length = 10)
    private String language = "vi";

    @Column(name = "feedback_type", nullable = false, length = 30)
    private String feedbackType = "FORM_ERROR"; // FORM_ERROR, ENCOURAGEMENT, SETUP_GUIDE, REP_COUNT

    @Column(name = "text_template", nullable = false, columnDefinition = "text")
    private String textTemplate;

    @Column(nullable = false)
    private int priority = 1;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public AiMotionRule getRule() { return rule; }
    public void setRule(AiMotionRule rule) { this.rule = rule; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getFeedbackType() { return feedbackType; }
    public void setFeedbackType(String feedbackType) { this.feedbackType = feedbackType; }
    public String getTextTemplate() { return textTemplate; }
    public void setTextTemplate(String textTemplate) { this.textTemplate = textTemplate; }
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
