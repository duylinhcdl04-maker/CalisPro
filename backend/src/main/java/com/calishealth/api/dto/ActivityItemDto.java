package com.calishealth.api.dto;

public class ActivityItemDto {
    private Long id;
    private String activityName;
    private String roleOrAchievement;
    private String organizer;
    private Integer eventYear;
    private String proofImageUrl;
    private String proofLinkUrl;

    public ActivityItemDto() {}

    public ActivityItemDto(Long id, String activityName, String roleOrAchievement, String organizer, Integer eventYear, String proofImageUrl, String proofLinkUrl) {
        this.id = id;
        this.activityName = activityName;
        this.roleOrAchievement = roleOrAchievement;
        this.organizer = organizer;
        this.eventYear = eventYear;
        this.proofImageUrl = proofImageUrl;
        this.proofLinkUrl = proofLinkUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getActivityName() { return activityName; }
    public void setActivityName(String activityName) { this.activityName = activityName; }

    public String getRoleOrAchievement() { return roleOrAchievement; }
    public void setRoleOrAchievement(String roleOrAchievement) { this.roleOrAchievement = roleOrAchievement; }

    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }

    public Integer getEventYear() { return eventYear; }
    public void setEventYear(Integer eventYear) { this.eventYear = eventYear; }

    public String getProofImageUrl() { return proofImageUrl; }
    public void setProofImageUrl(String proofImageUrl) { this.proofImageUrl = proofImageUrl; }

    public String getProofLinkUrl() { return proofLinkUrl; }
    public void setProofLinkUrl(String proofLinkUrl) { this.proofLinkUrl = proofLinkUrl; }
}
