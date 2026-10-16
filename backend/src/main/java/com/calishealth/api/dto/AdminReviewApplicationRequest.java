package com.calishealth.api.dto;

import com.calishealth.api.entity.CoachApplicationStatus;
import jakarta.validation.constraints.NotNull;

public class AdminReviewApplicationRequest {

    @NotNull(message = "Trạng thái phê duyệt không được để trống")
    private CoachApplicationStatus status;

    private String adminNotes;
    private String rejectionReason;

    public CoachApplicationStatus getStatus() { return status; }
    public void setStatus(CoachApplicationStatus status) { this.status = status; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
