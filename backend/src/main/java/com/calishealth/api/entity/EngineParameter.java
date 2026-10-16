package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/** Tham số số học của engine (trọng số, độ tin cậy, half-life, alpha, biên hysteresis...) theo rule set. */
@Entity @Table(name = "engine_parameters", uniqueConstraints = @UniqueConstraint(name = "uk_param", columnNames = {"rule_set_id", "param_key"}))
public class EngineParameter {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "rule_set_id", nullable = false) private Long ruleSetId;
 @Column(name = "param_key", nullable = false, length = 100) private String paramKey;
 @Column(name = "param_value", nullable = false, precision = 12, scale = 4) private BigDecimal paramValue;
 @Column(name = "source_type", nullable = false, length = 30) private String sourceType;
 @Column(name = "source_reference", length = 500) private String sourceReference;

 public Long getId(){return id;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public String getParamKey(){return paramKey;} public void setParamKey(String v){paramKey=v;}
 public BigDecimal getParamValue(){return paramValue;} public void setParamValue(BigDecimal v){paramValue=v;}
 public String getSourceType(){return sourceType;} public void setSourceType(String v){sourceType=v;}
 public String getSourceReference(){return sourceReference;} public void setSourceReference(String v){sourceReference=v;}
}
