package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Ánh xạ câu hỏi -> năng lực (tách khỏi category để PUSH/PULL không bị gộp).
 *  SCORE        : điểm câu hỏi (0-100) đóng góp vào năng lực với trọng số weight
 *  LADDER_NODE  : câu chọn "bài khó nhất làm được" (mã đáp án = mã bài tập)
 *  LADDER_VALUE : câu nhập số rep/giây tại bài đã chọn ở câu LADDER_NODE cùng năng lực
 *  LADDER_DIRECT: câu nhập số rep/giây của đúng một bài (exercise)
 */
@Entity @Table(name = "question_competency_weights",
        uniqueConstraints = @UniqueConstraint(name = "uk_qc", columnNames = {"question_id", "competency_code"}))
public class QuestionCompetencyMapping {
 public static final String SCORE = "SCORE", LADDER_NODE = "LADDER_NODE", LADDER_VALUE = "LADDER_VALUE", LADDER_DIRECT = "LADDER_DIRECT";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private AssessmentQuestion question;
 @Column(name = "competency_code", nullable = false, length = 30) private String competencyCode;
 @Column(name = "mapping_type", nullable = false, length = 20) private String mappingType = SCORE;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "exercise_id") private Exercise exercise;
 @Column(nullable = false, precision = 6, scale = 2) private BigDecimal weight = BigDecimal.ONE;

 public Long getId(){return id;}
 public AssessmentQuestion getQuestion(){return question;} public void setQuestion(AssessmentQuestion v){question=v;}
 public String getCompetencyCode(){return competencyCode;} public void setCompetencyCode(String v){competencyCode=v;}
 public String getMappingType(){return mappingType;} public void setMappingType(String v){mappingType=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public BigDecimal getWeight(){return weight;} public void setWeight(BigDecimal v){weight=v;}
}
