package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "assessment_question_options")
public class AssessmentQuestionOption {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private AssessmentQuestion question;
 @Column(name = "option_code", nullable = false, length = 50) private String optionCode;
 @Column(name = "option_label", nullable = false, length = 255) private String optionLabel;
 @Column(name = "numeric_value", precision = 10, scale = 2) private BigDecimal numericValue;
 // Điểm 0-100 khi học viên chọn đáp án này
 @Column(precision = 6, scale = 2) private BigDecimal score;
 @Column(name = "sort_order", nullable = false) private int sortOrder = 0;
 @Column(nullable = false) private boolean active = true;

 public Long getId(){return id;}
 public AssessmentQuestion getQuestion(){return question;} public void setQuestion(AssessmentQuestion v){question=v;}
 public String getOptionCode(){return optionCode;} public void setOptionCode(String v){optionCode=v;}
 public String getOptionLabel(){return optionLabel;} public void setOptionLabel(String v){optionLabel=v;}
 public BigDecimal getNumericValue(){return numericValue;} public void setNumericValue(BigDecimal v){numericValue=v;}
 public BigDecimal getScore(){return score;} public void setScore(BigDecimal v){score=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
}
