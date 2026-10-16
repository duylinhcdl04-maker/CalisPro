package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Câu hỏi trong 1 bài đánh giá: thứ tự, trọng số, bắt buộc và phần (bước) hiển thị cho học viên. */
@Entity @Table(name = "assessment_template_questions")
public class AssessmentTemplateQuestion {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "template_id", nullable = false) private AssessmentTemplate template;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private AssessmentQuestion question;
 @Column(name = "sort_order", nullable = false) private int sortOrder;
 @Column(nullable = false, precision = 6, scale = 2) private BigDecimal weight = BigDecimal.ZERO;
 @Column(nullable = false) private boolean required = true;
 @Column(name = "section_title", length = 150) private String sectionTitle;

 public Long getId(){return id;}
 public AssessmentTemplate getTemplate(){return template;} public void setTemplate(AssessmentTemplate v){template=v;}
 public AssessmentQuestion getQuestion(){return question;} public void setQuestion(AssessmentQuestion v){question=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
 public BigDecimal getWeight(){return weight;} public void setWeight(BigDecimal v){weight=v;}
 public boolean isRequired(){return required;} public void setRequired(boolean v){required=v;}
 public String getSectionTitle(){return sectionTitle;} public void setSectionTitle(String v){sectionTitle=v;}
}
