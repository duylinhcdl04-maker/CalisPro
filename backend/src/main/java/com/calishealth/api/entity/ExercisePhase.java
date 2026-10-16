package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Một pha kỹ thuật trong 1 rep (Setup, Eccentric, Bottom, Concentric, Finish...). */
@Entity @Table(name = "exercise_phases", indexes = @Index(name = "idx_exercise_phases_exercise", columnList = "exercise_id"))
public class ExercisePhase {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "sort_order", nullable = false) private int sortOrder;
 @Column(nullable = false, length = 100) private String name;
 @Column(name = "vietnamese_name", length = 150) private String vietnameseName;
 @Column(columnDefinition = "text") private String description;
 @Column(name = "coaching_cue", columnDefinition = "text") private String coachingCue;
 @Column(length = 30) private String breathing;
 @Column(name = "muscle_focus", length = 255) private String muscleFocus;
 @Column(name = "media_url", length = 500) private String mediaUrl;

 public Long getId(){return id;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public String getVietnameseName(){return vietnameseName;} public void setVietnameseName(String v){vietnameseName=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getCoachingCue(){return coachingCue;} public void setCoachingCue(String v){coachingCue=v;}
 public String getBreathing(){return breathing;} public void setBreathing(String v){breathing=v;}
 public String getMuscleFocus(){return muscleFocus;} public void setMuscleFocus(String v){muscleFocus=v;}
 public String getMediaUrl(){return mediaUrl;} public void setMediaUrl(String v){mediaUrl=v;}
}
