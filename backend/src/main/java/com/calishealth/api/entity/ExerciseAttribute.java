package com.calishealth.api.entity;

import jakarta.persistence.*;

/**
 * Thuộc tính dạng danh sách của động tác, dùng để lọc/tìm kiếm:
 * TAG, EQUIPMENT, SAFETY_CUE (lưu ý an toàn), STOP_CONDITION (dấu hiệu phải dừng tập).
 */
@Entity @Table(name = "exercise_attributes", indexes = {
        @Index(name = "idx_exercise_attributes_exercise", columnList = "exercise_id"),
        @Index(name = "idx_exercise_attributes_type_value", columnList = "attribute_type, attribute_value")
})
public class ExerciseAttribute {
 public static final String TAG = "TAG";
 public static final String EQUIPMENT = "EQUIPMENT";
 public static final String SAFETY_CUE = "SAFETY_CUE";
 public static final String STOP_CONDITION = "STOP_CONDITION";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "attribute_type", nullable = false, length = 30) private String attributeType;
 @Column(name = "sort_order", nullable = false) private int sortOrder;
 @Column(name = "attribute_value", nullable = false, length = 500) private String attributeValue;

 public Long getId(){return id;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public String getAttributeType(){return attributeType;} public void setAttributeType(String v){attributeType=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public String getAttributeValue(){return attributeValue;} public void setAttributeValue(String v){attributeValue=v;}
}
