package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Ràng buộc tập luyện thực tế của người dùng - giáo án phải nằm trong các ràng buộc này. */
@Entity @Table(name = "user_training_constraints")
public class UserTrainingConstraints {
 @Id @Column(name = "user_id") private Long userId;
 @Column(name = "days_per_week", nullable = false) private int daysPerWeek = 3;
 @Column(name = "session_minutes", nullable = false) private int sessionMinutes = 45;
 // ["PULL_UP_BAR","PARALLEL_BARS"]; [] = không có dụng cụ
 @Column(name = "equipment_json", nullable = false, columnDefinition = "json") private String equipmentJson = "[]";
 @Column(length = 30) private String environment;
 // Có câu trả lời "Có" trong phần sàng lọc an toàn (PAR-Q+) -> giới hạn level, khoá bài lộn ngược/bật nhảy
 @Column(name = "screening_flag", nullable = false) private boolean screeningFlag = false;
 // ["SHOULDER","WRIST",...] vùng đau/chấn thương tự khai
 @Column(name = "limitations_json", columnDefinition = "json") private String limitationsJson;
 // NULL = chưa chọn | SYSTEM = tập theo giáo án hệ thống | SELF = tự tạo (hệ thống không tự đè chu kỳ mới)
 @Column(name = "plan_mode", length = 10) private String planMode;
 // NULL | HEALTH | SKILL: chỉ để gợi ý bài tập, không ảnh hưởng level
 @Column(name = "training_focus", length = 10) private String trainingFocus;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist @PreUpdate void touch(){ updatedAt = Instant.now(); }

 public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
 public int getDaysPerWeek(){return daysPerWeek;} public void setDaysPerWeek(int v){daysPerWeek=v;}
 public int getSessionMinutes(){return sessionMinutes;} public void setSessionMinutes(int v){sessionMinutes=v;}
 public String getEquipmentJson(){return equipmentJson;} public void setEquipmentJson(String v){equipmentJson=v;}
 public String getEnvironment(){return environment;} public void setEnvironment(String v){environment=v;}
 public boolean isScreeningFlag(){return screeningFlag;} public void setScreeningFlag(boolean v){screeningFlag=v;}
 public String getLimitationsJson(){return limitationsJson;} public void setLimitationsJson(String v){limitationsJson=v;}
 public String getPlanMode(){return planMode;} public void setPlanMode(String v){planMode=v;}
 public String getTrainingFocus(){return trainingFocus;} public void setTrainingFocus(String v){trainingFocus=v;}
 public Instant getUpdatedAt(){return updatedAt;}
}
