package com.calishealth.api.entity;

import jakarta.persistence.*;

/** Một bài test trong bộ đánh giá định kỳ (template type = PERIODIC); chọn theo level để test nấc hiện tại và nấc kế tiếp. */
@Entity @Table(name = "assessment_test_items")
public class AssessmentTestItem {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "template_id", nullable = false) private AssessmentTemplate template;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "exercise_id", nullable = false) private Exercise exercise;
 @Column(name = "competency_code", nullable = false, length = 30) private String competencyCode;
 // VALID_REPS | HOLD_SEC | ANGLE_DEG
 @Column(nullable = false, length = 30) private String metric;
 @Column(name = "level_min", nullable = false, length = 10) private String levelMin;
 @Column(name = "level_max", nullable = false, length = 10) private String levelMax;
 // {"restSec":150,"maxDurationSec":120,"capRatio":1.5,"instruction":"..."}
 @Column(name = "protocol_json", columnDefinition = "json") private String protocolJson;
 @Column(nullable = false) private boolean mandatory = true;
 // Có trong bài test rút gọn (Baseline Test) không
 @Column(name = "in_baseline", nullable = false) private boolean inBaseline = false;
 // Thứ tự theo khuyến nghị NSCA: kỹ năng -> sức mạnh tối đa -> sức bền -> linh hoạt
 @Column(name = "sort_order", nullable = false) private int sortOrder;

 public Long getId(){return id;}
 public AssessmentTemplate getTemplate(){return template;} public void setTemplate(AssessmentTemplate v){template=v;}
 public Exercise getExercise(){return exercise;} public void setExercise(Exercise v){exercise=v;}
 public String getCompetencyCode(){return competencyCode;} public void setCompetencyCode(String v){competencyCode=v;}
 public String getMetric(){return metric;} public void setMetric(String v){metric=v;}
 public String getLevelMin(){return levelMin;} public void setLevelMin(String v){levelMin=v;}
 public String getLevelMax(){return levelMax;} public void setLevelMax(String v){levelMax=v;}
 public String getProtocolJson(){return protocolJson;} public void setProtocolJson(String v){protocolJson=v;}
 public boolean isMandatory(){return mandatory;} public void setMandatory(boolean v){mandatory=v;}
 public boolean isInBaseline(){return inBaseline;} public void setInBaseline(boolean v){inBaseline=v;}
 public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
}
