package com.calishealth.api.dto;
import java.util.*;
public final class AssessmentDtos {
 private AssessmentDtos(){}
 public record Answer(String questionCode,String value){}
 public record CreateAssessmentRequest(String assessmentTypeCode,List<Answer> answers){}
 public record AssessmentSessionResponse(String sessionId,String status,String message){}
}
