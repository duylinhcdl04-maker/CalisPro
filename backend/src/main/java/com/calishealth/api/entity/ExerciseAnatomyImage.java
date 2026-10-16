package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Ảnh minh họa cơ tác động (tối đa 5 ảnh / động tác). */
@Entity @Table(name = "exercise_anatomy_images", indexes = @Index(name = "idx_exercise_anatomy_exercise", columnList = "exercise_id"))
public class ExerciseAnatomyImage {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "sort_order", nullable = false) private int sortOrder;
 @Column(nullable = false, length = 500) private String url;
 @Column(length = 255) private String caption;
 @Column(name = "is_primary", nullable = false) private boolean primaryImage;

 public Long getId(){return id;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public String getUrl(){return url;} public void setUrl(String v){url=v;}
 public String getCaption(){return caption;} public void setCaption(String v){caption=v;}
 public boolean isPrimaryImage(){return primaryImage;} public void setPrimaryImage(boolean v){primaryImage=v;}
}
