package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "assessment_responses")
public class AssessmentResponse {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "assessment_session_id", nullable = false) private AssessmentSession assessmentSession;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "question_id", nullable = false) private AssessmentQuestion question;
 @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "option_id") private AssessmentQuestionOption option;
 @Column(name = "answer_text", columnDefinition = "text") private String answerText;
 @Column(name = "answer_number", precision = 10, scale = 2) private BigDecimal answerNumber;
 @Column(name = "answer_boolean") private Boolean answerBoolean;
 @Column(name = "answer_json", columnDefinition = "json") private String answerJson;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public AssessmentSession getAssessmentSession(){return assessmentSession;} public void setAssessmentSession(AssessmentSession v){assessmentSession=v;}
 public AssessmentQuestion getQuestion(){return question;} public void setQuestion(AssessmentQuestion v){question=v;}
 public AssessmentQuestionOption getOption(){return option;} public void setOption(AssessmentQuestionOption v){option=v;}
 public String getAnswerText(){return answerText;} public void setAnswerText(String v){answerText=v;}
 public BigDecimal getAnswerNumber(){return answerNumber;} public void setAnswerNumber(BigDecimal v){answerNumber=v;}
 public Boolean getAnswerBoolean(){return answerBoolean;} public void setAnswerBoolean(Boolean v){answerBoolean=v;}
 public String getAnswerJson(){return answerJson;} public void setAnswerJson(String v){answerJson=v;}
 public Instant getCreatedAt(){return createdAt;}
}
