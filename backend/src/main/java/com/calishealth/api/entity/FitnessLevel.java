package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Level tổng (L0..L4) theo rule set - khung sản phẩm CalisHealth, không phải chuẩn của ACSM/NSCA. */
@Entity @Table(name = "fitness_levels", uniqueConstraints = @UniqueConstraint(name = "uk_level", columnNames = {"rule_set_id", "code"}))
public class FitnessLevel {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "rule_set_id", nullable = false) private Long ruleSetId;
 @Column(nullable = false, length = 10) private String code;
 @Column(name = "rank_no", nullable = false) private int rankNo;
 @Column(nullable = false, length = 50) private String name;
 @Column(name = "overall_promote_min", nullable = false, precision = 5, scale = 2) private BigDecimal overallPromoteMin;
 @Column(name = "overall_regress_below", nullable = false, precision = 5, scale = 2) private BigDecimal overallRegressBelow;
 @Column(name = "min_competency_confidence", nullable = false, precision = 4, scale = 3) private BigDecimal minCompetencyConfidence = new BigDecimal("0.600");
 @Column(columnDefinition = "text") private String description;
 @Column(name = "color_scheme", length = 20) private String colorScheme;

 public Long getId(){return id;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public int getRankNo(){return rankNo;} public void setRankNo(int v){rankNo=v;}
 public String getName(){return name;} public void setName(String v){name=v;}
 public BigDecimal getOverallPromoteMin(){return overallPromoteMin;} public void setOverallPromoteMin(BigDecimal v){overallPromoteMin=v;}
 public BigDecimal getOverallRegressBelow(){return overallRegressBelow;} public void setOverallRegressBelow(BigDecimal v){overallRegressBelow=v;}
 public BigDecimal getMinCompetencyConfidence(){return minCompetencyConfidence;} public void setMinCompetencyConfidence(BigDecimal v){minCompetencyConfidence=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getColorScheme(){return colorScheme;} public void setColorScheme(String v){colorScheme=v;}
}
