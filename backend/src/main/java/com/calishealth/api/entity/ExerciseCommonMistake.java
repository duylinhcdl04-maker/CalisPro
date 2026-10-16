package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Lỗi sai thường gặp: biểu hiện, nguyên nhân, cách sửa. */
@Entity @Table(name = "exercise_common_mistakes", indexes = @Index(name = "idx_exercise_mistakes_exercise", columnList = "exercise_id"))
public class ExerciseCommonMistake {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "sort_order", nullable = false) private int sortOrder;
 @Column(nullable = false, length = 255) private String name;
 @Column(columnDefinition = "text") private String problem;
 @Column(name = "why_it_happens", columnDefinition = "text") private String whyItHappens;
 @Column(columnDefinition = "text") private String correction;
 @Column(length = 20) private String severity;
 @Column(name = "media_url", length = 500) private String mediaUrl;

 public Long getId(){return id;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getProblem(){return problem;} public void setProblem(String v){problem=v;}
 public String getWhyItHappens(){return whyItHappens;} public void setWhyItHappens(String v){whyItHappens=v;}
 public String getCorrection(){return correction;} public void setCorrection(String v){correction=v;}
 public String getSeverity(){return severity;} public void setSeverity(String v){severity=v;}
 public String getMediaUrl(){return mediaUrl;} public void setMediaUrl(String v){mediaUrl=v;}
}
