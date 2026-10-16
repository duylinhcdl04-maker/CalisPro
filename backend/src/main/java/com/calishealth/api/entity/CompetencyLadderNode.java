package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Một nấc trên thang tiến trình của năng lực: nodeScore = base + span × g(perf / target). */
@Entity @Table(name = "competency_ladder_nodes")
public class CompetencyLadderNode {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "rule_set_id", nullable = false) private Long ruleSetId;
 @Column(name = "competency_code", nullable = false, length = 30) private String competencyCode;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "node_order", nullable = false) private int nodeOrder;
 // VALID_REPS | HOLD_SEC | ANGLE_DEG
 @Column(nullable = false, length = 30) private String metric;
 @Column(name = "base_score", nullable = false, precision = 5, scale = 2) private BigDecimal baseScore;
 @Column(name = "span_score", nullable = false, precision = 5, scale = 2) private BigDecimal spanScore;
 @Column(name = "target_value", nullable = false, precision = 10, scale = 2) private BigDecimal targetValue;
 @Column(name = "entry_value", nullable = false, precision = 10, scale = 2) private BigDecimal entryValue = BigDecimal.ONE;
 // [[x, g(x)], ...] với x = perf/target, nội suy tuyến tính từng đoạn (tuỳ chọn)
 @Column(name = "anchors_json", columnDefinition = "json") private String anchorsJson;
 @Column(name = "source_type", nullable = false, length = 30) private String sourceType;
 @Column(name = "source_reference", length = 500) private String sourceReference;

 public Long getId(){return id;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public String getCompetencyCode(){return competencyCode;} public void setCompetencyCode(String v){competencyCode=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public int getNodeOrder(){return nodeOrder;} public void setNodeOrder(int v){nodeOrder=v;}
 public String getMetric(){return metric;} public void setMetric(String v){metric=v;}
 public BigDecimal getBaseScore(){return baseScore;} public void setBaseScore(BigDecimal v){baseScore=v;}
 public BigDecimal getSpanScore(){return spanScore;} public void setSpanScore(BigDecimal v){spanScore=v;}
 public BigDecimal getTargetValue(){return targetValue;} public void setTargetValue(BigDecimal v){targetValue=v;}
 public BigDecimal getEntryValue(){return entryValue;} public void setEntryValue(BigDecimal v){entryValue=v;}
 public String getAnchorsJson(){return anchorsJson;} public void setAnchorsJson(String v){anchorsJson=v;}
 public String getSourceType(){return sourceType;} public void setSourceType(String v){sourceType=v;}
 public String getSourceReference(){return sourceReference;} public void setSourceReference(String v){sourceReference=v;}
}
