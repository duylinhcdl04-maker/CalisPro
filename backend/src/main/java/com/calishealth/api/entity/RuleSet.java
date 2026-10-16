package com.calishealth.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Bộ quy tắc của Level Engine có version. ACTIVE thì bất biến; muốn sửa phải clone ra DRAFT. */
@Entity @Table(name = "rule_sets", uniqueConstraints = @UniqueConstraint(name = "uk_rule_set", columnNames = {"code", "version"}))
public class RuleSet {
 public static final String DRAFT = "DRAFT", PENDING_REVIEW = "PENDING_REVIEW", ACTIVE = "ACTIVE", ARCHIVED = "ARCHIVED";

 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(nullable = false, length = 80) private String code;
 @Column(nullable = false) private int version;
 @Column(nullable = false, length = 20) private String status = DRAFT;
 @Column(name = "parent_id") private Long parentId;
 @Column(columnDefinition = "text") private String notes;
 @Column(name = "activated_at") private Instant activatedAt;
 @Column(name = "created_by", length = 150) private String createdBy;
 // Tác giả bản DRAFT (id người dùng) và thời điểm gửi duyệt; dùng cho quy tắc "người soạn không tự duyệt"
 @Column(name = "author_id") private Long authorId;
 @Column(name = "submitted_at") private Instant submittedAt;
 @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

 @PrePersist void onCreate(){ createdAt = Instant.now(); }

 public Long getId(){return id;}
 public Long getAuthorId(){return authorId;} public void setAuthorId(Long v){authorId=v;}
 public Instant getSubmittedAt(){return submittedAt;} public void setSubmittedAt(Instant v){submittedAt=v;}
 public String getCode(){return code;} public void setCode(String v){code=v;}
 public int getVersion(){return version;} public void setVersion(int v){version=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public Long getParentId(){return parentId;} public void setParentId(Long v){parentId=v;}
 public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
 public Instant getActivatedAt(){return activatedAt;} public void setActivatedAt(Instant v){activatedAt=v;}
 public String getCreatedBy(){return createdBy;} public void setCreatedBy(String v){createdBy=v;}
 public Instant getCreatedAt(){return createdAt;}
}
