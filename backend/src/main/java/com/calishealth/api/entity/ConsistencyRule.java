package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Luật phát hiện câu trả lời mâu thuẫn / phi thực tế trong bài tự khai báo. */
@Entity @Table(name = "consistency_rules")
public class ConsistencyRule {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "rule_set_id", nullable = false) private Long ruleSetId;
 @Column(nullable = false, length = 30) private String code;
 // {"all":[{"question":"EXPERIENCE","op":"EQ","value":"NONE"},{"node":"pull-up","op":"GTE","value":10}]}
 @Column(name = "condition_json", nullable = false, columnDefinition = "json") private String conditionJson;
 // WARNING | CONFLICT
 @Column(nullable = false, length = 20) private String severity;
 @Column(name = "affected_competencies", nullable = false, columnDefinition = "json") private String affectedCompetencies;
 @Column(nullable = false, columnDefinition = "text") private String message;

 public Long getId(){return id;}
 public Long getRuleSetId(){return ruleSetId;} public void setRuleSetId(Long v){ruleSetId=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public String getConditionJson(){return conditionJson;} public void setConditionJson(String v){conditionJson=v;}
 public String getSeverity(){return severity;} public void setSeverity(String v){severity=v;}
 public String getAffectedCompetencies(){return affectedCompetencies;} public void setAffectedCompetencies(String v){affectedCompetencies=v;}
 public String getMessage(){return message;} public void setMessage(String v){message=v;}
}
