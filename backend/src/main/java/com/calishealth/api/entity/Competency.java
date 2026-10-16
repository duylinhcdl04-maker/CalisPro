package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Năng lực: PUSH, PULL, LEGS, CORE, MOBILITY, SKILL (chính) và các năng lực phụ. */
@Entity @Table(name = "competencies")
public class Competency {
 @Id @Column(length = 30) private String code;
 @Column(nullable = false, length = 100) private String name;
 @Column(columnDefinition = "text") private String description;
 // true = tính vào điểm tổng (Overall)
 @Column(name = "is_primary", nullable = false) private boolean primaryCompetency = true;
 // MAX = điểm = nấc khó nhất làm được; MEAN = trung bình các bài (vd. MOBILITY)
 @Column(nullable = false, length = 10) private String aggregation = "MAX";
 @Column(name = "display_order", nullable = false) private int displayOrder;
 @Column(nullable = false) private boolean active = true;

 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public boolean isPrimaryCompetency(){return primaryCompetency;} public void setPrimaryCompetency(boolean v){primaryCompetency=v;}
 public String getAggregation(){return aggregation;} public void setAggregation(String v){aggregation=v;}
 public int getDisplayOrder(){return displayOrder;} public void setDisplayOrder(int v){displayOrder=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
}
