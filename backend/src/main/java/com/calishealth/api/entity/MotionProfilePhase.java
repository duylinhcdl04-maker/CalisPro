package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Pha chuyển động của một Motion Profile (TOP, DESCENDING, BOTTOM, ASCENDING, HOLD...). */
@Entity
@Table(name = "motion_profile_phases", uniqueConstraints = @UniqueConstraint(name = "uk_profile_phase", columnNames = {"ai_profile_id", "code"}))
public class MotionProfilePhase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "ai_profile_id", nullable = false) private Long aiProfileId;
    @Column(nullable = false, length = 30) private String code;
    @Column(nullable = false, length = 100) private String name;
    @Column(columnDefinition = "text") private String description;
    @Column(name = "sort_order", nullable = false) private int sortOrder;

    public Long getId() { return id; }
    public Long getAiProfileId() { return aiProfileId; } public void setAiProfileId(Long v) { aiProfileId = v; }
    public String getCode() { return code; } public void setCode(String v) { code = v; }
    public String getName() { return name; } public void setName(String v) { name = v; }
    public String getDescription() { return description; } public void setDescription(String v) { description = v; }
    public int getSortOrder() { return sortOrder; } public void setSortOrder(int v) { sortOrder = v; }
}
