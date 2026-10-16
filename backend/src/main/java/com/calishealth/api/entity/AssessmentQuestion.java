package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "assessment_questions")
public class AssessmentQuestion {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "question_code", nullable = false, unique = true, length = 100) private String questionCode;
 @Column(name = "question_text", nullable = false, columnDefinition = "text") private String questionText;
 @Column(columnDefinition = "text") private String description;
 @Column(columnDefinition = "text") private String instruction;
 // Loại câu hỏi phía Admin Builder (SINGLE_CHOICE, NUMERIC_INPUT, PERFORMANCE_TEST...); questionType là loại lưu trữ chuẩn hóa
 @Column(name = "input_type", length = 30) private String inputType;
 @Column(name = "default_weight", nullable = false, precision = 6, scale = 2) private BigDecimal defaultWeight = BigDecimal.TEN;
 // performanceConfig / measurementConfig / ratingConfig (JSON)
 @Lob @Column(name = "config_json", columnDefinition = "longtext") private String configJson;
 // NULL = câu hỏi trong ngân hàng; có giá trị = câu hỏi riêng của 1 bài đánh giá
 @Column(name = "owner_template_id") private Long ownerTemplateId;
 @Column(nullable = false) private int version = 1;
 @Enumerated(EnumType.STRING) @Column(name = "question_type", nullable = false, length = 30) private QuestionType questionType;
 @Column(length = 50) private String category;
 @Column(length = 30) private String unit;
 @Column(nullable = false) private boolean required = true;
 @Column(name = "min_value", precision = 10, scale = 2) private BigDecimal minValue;
 @Column(name = "max_value", precision = 10, scale = 2) private BigDecimal maxValue;
 @Column(nullable = false) private boolean active = true;
 // Ý nghĩa nghiệp vụ của câu không chấm điểm: DAYS_PER_WEEK | SESSION_MINUTES | EQUIPMENT | PRIMARY_GOAL |
 // EXPERIENCE_MONTHS | SCREENING | LIMITATIONS (admin sửa nội dung câu hỏi không làm mất giá trị này)
 @Column(name = "semantic_key", length = 40) private String semanticKey;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
 @Column(name = "updated_at", nullable = false) private Instant updatedAt;

 @PrePersist void onCreate(){ Instant now = Instant.now(); createdAt = now; updatedAt = now; }
 @PreUpdate void onUpdate(){ updatedAt = Instant.now(); }

 public Long getId(){return id;}
 public String getQuestionCode(){return questionCode;} public void setQuestionCode(String v){questionCode=v;}
 public String getQuestionText(){return questionText;} public void setQuestionText(String v){questionText=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getInstruction(){return instruction;} public void setInstruction(String v){instruction=v;}
 public String getInputType(){return inputType;} public void setInputType(String v){inputType=v;}
 public BigDecimal getDefaultWeight(){return defaultWeight;} public void setDefaultWeight(BigDecimal v){defaultWeight=v;}
 public String getConfigJson(){return configJson;} public void setConfigJson(String v){configJson=v;}
 public Long getOwnerTemplateId(){return ownerTemplateId;} public void setOwnerTemplateId(Long v){ownerTemplateId=v;}
 public int getVersion(){return version;} public void setVersion(int v){version=v;}
 public QuestionType getQuestionType(){return questionType;} public void setQuestionType(QuestionType v){questionType=v;}
 public String getCategory(){return category;} public void setCategory(String v){category=v;}
 public String getUnit(){return unit;} public void setUnit(String v){unit=v;}
 public boolean isRequired(){return required;} public void setRequired(boolean v){required=v;}
 public BigDecimal getMinValue(){return minValue;} public void setMinValue(BigDecimal v){minValue=v;}
 public BigDecimal getMaxValue(){return maxValue;} public void setMaxValue(BigDecimal v){maxValue=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
 public String getSemanticKey(){return semanticKey;} public void setSemanticKey(String v){semanticKey=v;}
 public Instant getCreatedAt(){return createdAt;}
 public Instant getUpdatedAt(){return updatedAt;}
}
