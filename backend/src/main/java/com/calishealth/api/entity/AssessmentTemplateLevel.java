package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Mức trình độ theo khoảng điểm tổng của 1 bài đánh giá (vd. 0-39 Beginner). */
@Entity @Table(name = "assessment_template_levels")
public class AssessmentTemplateLevel {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "template_id", nullable = false) private AssessmentTemplate template;
 @Column(nullable = false, length = 30) private String code;
 @Column(nullable = false, length = 100) private String name;
 @Column(name = "min_score", nullable = false, precision = 6, scale = 2) private BigDecimal minScore;
 @Column(name = "max_score", nullable = false, precision = 6, scale = 2) private BigDecimal maxScore;
 @Column(columnDefinition = "text") private String description;
 @Column(columnDefinition = "text") private String recommendation;
 @Column(name = "color_scheme", length = 20) private String colorScheme;
 @Column(name = "badge_label", length = 50) private String badgeLabel;
 @Column(name = "sort_order", nullable = false) private int sortOrder;

 public Long getId(){return id;}
 public AssessmentTemplate getTemplate(){return template;} public void setTemplate(AssessmentTemplate v){template=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public BigDecimal getMinScore(){return minScore;} public void setMinScore(BigDecimal v){minScore=v;}
 public BigDecimal getMaxScore(){return maxScore;} public void setMaxScore(BigDecimal v){maxScore=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getRecommendation(){return recommendation;} public void setRecommendation(String v){recommendation=v;}
 public String getColorScheme(){return colorScheme;} public void setColorScheme(String v){colorScheme=v;}
 public String getBadgeLabel(){return badgeLabel;} public void setBadgeLabel(String v){badgeLabel=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
}
