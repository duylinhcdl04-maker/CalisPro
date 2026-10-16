package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Khẩu lệnh huấn luyện (coaching cue) của động tác. */
@Entity @Table(name = "exercise_coaching_cues", indexes = @Index(name = "idx_exercise_cues_exercise", columnList = "exercise_id"))
public class ExerciseCoachingCue {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "sort_order", nullable = false) private int sortOrder;
 @Column(nullable = false, columnDefinition = "text") private String content;
 @Column(length = 20) private String priority;
 @Column(length = 30) private String category;

 public Long getId(){return id;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public String getContent(){return content;} public void setContent(String v){content=v;}
 public String getPriority(){return priority;} public void setPriority(String v){priority=v;}
 public String getCategory(){return category;} public void setCategory(String v){category=v;}
}
