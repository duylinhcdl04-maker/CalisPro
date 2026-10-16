package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Quy tắc chấm điểm theo khoảng giá trị cho câu hỏi dạng số (vd. 6-12 reps -> 45 điểm).
 * template = NULL: quy tắc mặc định của câu hỏi trong ngân hàng; có giá trị: quy tắc riêng của bài đánh giá.
 */
@Entity @Table(name = "assessment_score_rules")
public class AssessmentScoreRule {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "template_id") private AssessmentTemplate template;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private AssessmentQuestion question;
 // GT | GTE | LT | LTE | BETWEEN | EQ
 @Column(nullable = false, length = 10) private String operator;
 @Column(name = "min_value", precision = 12, scale = 2) private BigDecimal minValue;
 @Column(name = "max_value", precision = 12, scale = 2) private BigDecimal maxValue;
 @Column(name = "exact_value", length = 100) private String exactValue;
 @Column(nullable = false, precision = 6, scale = 2) private BigDecimal score;
 @Column(length = 150) private String label;
 @Column(name = "sort_order", nullable = false) private int sortOrder;

 public Long getId(){return id;}
 public AssessmentTemplate getTemplate(){return template;} public void setTemplate(AssessmentTemplate v){template=v;}
 public AssessmentQuestion getQuestion(){return question;} public void setQuestion(AssessmentQuestion v){question=v;}
 public String getOperator(){return operator;} public void setOperator(String v){operator=v;}
 public BigDecimal getMinValue(){return minValue;} public void setMinValue(BigDecimal v){minValue=v;}
 public BigDecimal getMaxValue(){return maxValue;} public void setMaxValue(BigDecimal v){maxValue=v;}
 public String getExactValue(){return exactValue;} public void setExactValue(String v){exactValue=v;}
 public BigDecimal getScore(){return score;} public void setScore(BigDecimal v){score=v;}
 public String getLabel(){return label;} public void setLabel(String v){label=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
}
