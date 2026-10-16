package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "user_goals")
public class UserGoal {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "goal_id", nullable = false) private Goal goal;
 @Column(nullable = false) private int priority = 1;
 @Column(name = "target_value", precision = 10, scale = 2) private BigDecimal targetValue;
 @Column(name = "target_unit", length = 30) private String targetUnit;
 @Column(name = "start_date") private LocalDate startDate;
 @Column(name = "target_date") private LocalDate targetDate;
 @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private UserGoalStatus status = UserGoalStatus.ACTIVE;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public User getUser(){return user;} public void setUser(User v){user=v;}
 public Goal getGoal(){return goal;} public void setGoal(Goal v){goal=v;}
 public int getPriority(){return priority;} public void setPriority(int v){priority=v;}
 public BigDecimal getTargetValue(){return targetValue;} public void setTargetValue(BigDecimal v){targetValue=v;}
 public String getTargetUnit(){return targetUnit;} public void setTargetUnit(String v){targetUnit=v;}
 public LocalDate getStartDate(){return startDate;} public void setStartDate(LocalDate v){startDate=v;}
 public LocalDate getTargetDate(){return targetDate;} public void setTargetDate(LocalDate v){targetDate=v;}
 public UserGoalStatus getStatus(){return status;} public void setStatus(UserGoalStatus v){status=v;}
 public Instant getCreatedAt(){return createdAt;}
}
