package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Cấu hình bài test đầu vào cho người dùng mới (bảng chỉ có 1 dòng, id = 1). */
@Entity @Table(name = "assessment_onboarding_settings")
public class AssessmentOnboardingSettings {
 public static final long SINGLETON_ID = 1L;

 @Id private Long id = SINGLETON_ID;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "active_template_id") private AssessmentTemplate activeTemplate;
 // true = bắt buộc làm trước khi vào app; false = cho phép bỏ qua
 @Column(nullable = false) private boolean mandatory = true;
 // Khi chưa chọn bài: false = cho vào app; true = chặn ở màn chờ
 @Column(name = "block_when_missing", nullable = false) private boolean blockWhenMissing = false;
 // Tăng lên khi admin yêu cầu tất cả làm lại; người dùng đã làm ở vòng cũ sẽ phải làm lại
 @Column(nullable = false) private int round = 1;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;
 @Column(name = "updated_by", length = 150) private String updatedBy;

 @PrePersist @PreUpdate void touch(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public AssessmentTemplate getActiveTemplate(){return activeTemplate;} public void setActiveTemplate(AssessmentTemplate v){activeTemplate=v;}
 public boolean isMandatory(){return mandatory;} public void setMandatory(boolean v){mandatory=v;}
 public boolean isBlockWhenMissing(){return blockWhenMissing;} public void setBlockWhenMissing(boolean v){blockWhenMissing=v;}
 public int getRound(){return round;} public void setRound(int v){round=v;}
 public Instant getUpdatedAt(){return updatedAt;}
 public String getUpdatedBy(){return updatedBy;} public void setUpdatedBy(String v){updatedBy=v;}
}
