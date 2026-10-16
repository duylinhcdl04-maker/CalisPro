package com.calishealth.api.entity;

import java.io.Serializable;
import java.util.Objects;

public class ExerciseMuscleId implements Serializable {
 private Long exercise;
 private Long muscle;

 public ExerciseMuscleId(){}
 public ExerciseMuscleId(Long exercise, Long muscle){ this.exercise = exercise; this.muscle = muscle; }

 @Override public boolean equals(Object o){
   if(this == o) return true;
   if(!(o instanceof ExerciseMuscleId that)) return false;
   return Objects.equals(exercise, that.exercise) && Objects.equals(muscle, that.muscle);
 }
 @Override public int hashCode(){ return Objects.hash(exercise, muscle); }
}
