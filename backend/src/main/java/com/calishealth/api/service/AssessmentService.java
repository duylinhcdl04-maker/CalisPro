package com.calishealth.api.service;

import com.calishealth.api.dto.AssessmentDtos.*;
import com.calishealth.api.entity.*;
import com.calishealth.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;

@Service
public class AssessmentService {
    private final UserRepository users;
    private final AssessmentTypeRepository assessmentTypes;
    private final AssessmentQuestionRepository questions;
    private final AssessmentSessionRepository sessions;
    private final AssessmentResponseRepository responses;
    private final FitnessProfileRepository fitnessProfiles;

    public AssessmentService(UserRepository users,
                             AssessmentTypeRepository assessmentTypes,
                             AssessmentQuestionRepository questions,
                             AssessmentSessionRepository sessions,
                             AssessmentResponseRepository responses,
                             FitnessProfileRepository fitnessProfiles) {
        this.users = users;
        this.assessmentTypes = assessmentTypes;
        this.questions = questions;
        this.sessions = sessions;
        this.responses = responses;
        this.fitnessProfiles = fitnessProfiles;
    }

    @Transactional
    public AssessmentSessionResponse create(Long userId, CreateAssessmentRequest r) {
        User u = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        AssessmentType type = assessmentTypes.findByCode(r.assessmentTypeCode())
                .orElseThrow(() -> new IllegalArgumentException("Unknown assessment type: " + r.assessmentTypeCode()));

        AssessmentSession session = new AssessmentSession();
        session.setUser(u);
        session.setAssessmentType(type);
        sessions.save(session);

        BigDecimal strengthSum = BigDecimal.ZERO;
        int strengthCount = 0;
        BigDecimal enduranceSum = BigDecimal.ZERO;
        int enduranceCount = 0;
        BigDecimal mobilitySum = BigDecimal.ZERO;
        int mobilityCount = 0;
        BigDecimal balanceSum = BigDecimal.ZERO;
        int balanceCount = 0;
        BigDecimal coreSum = BigDecimal.ZERO;
        int coreCount = 0;

        if (r.answers() != null) {
            for (Answer a : r.answers()) {
                AssessmentQuestion q = questions.findByQuestionCode(a.questionCode())
                        .orElseThrow(() -> new IllegalArgumentException("Unknown question: " + a.questionCode()));
                AssessmentResponse resp = new AssessmentResponse();
                resp.setAssessmentSession(session);
                resp.setQuestion(q);

                BigDecimal numVal = null;
                switch (q.getQuestionType()) {
                    case NUMBER, SCALE -> {
                        numVal = new BigDecimal(a.value());
                        resp.setAnswerNumber(numVal);
                    }
                    case BOOLEAN -> {
                        boolean b = Boolean.parseBoolean(a.value());
                        resp.setAnswerBoolean(b);
                        numVal = b ? BigDecimal.valueOf(80) : BigDecimal.valueOf(40);
                    }
                    default -> resp.setAnswerText(a.value());
                }
                responses.save(resp);

                if (numVal != null) {
                    String cat = q.getCategory() != null ? q.getCategory().toUpperCase() : "GENERAL";
                    if (cat.contains("STRENGTH")) {
                        strengthSum = strengthSum.add(numVal);
                        strengthCount++;
                    } else if (cat.contains("ENDURANCE")) {
                        enduranceSum = enduranceSum.add(numVal);
                        enduranceCount++;
                    } else if (cat.contains("MOBILITY")) {
                        mobilitySum = mobilitySum.add(numVal);
                        mobilityCount++;
                    } else if (cat.contains("BALANCE")) {
                        balanceSum = balanceSum.add(numVal);
                        balanceCount++;
                    } else if (cat.contains("CORE")) {
                        coreSum = coreSum.add(numVal);
                        coreCount++;
                    } else {
                        strengthSum = strengthSum.add(numVal);
                        strengthCount++;
                    }
                }
            }
        }

        session.setStatus(AssessmentSessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        sessions.save(session);

        // Calculate normalized scores
        BigDecimal strengthScore = calculateCategoryScore(strengthSum, strengthCount, 50.0);
        BigDecimal enduranceScore = calculateCategoryScore(enduranceSum, enduranceCount, 50.0);
        BigDecimal mobilityScore = calculateCategoryScore(mobilitySum, mobilityCount, 50.0);
        BigDecimal balanceScore = calculateCategoryScore(balanceSum, balanceCount, 50.0);
        BigDecimal coreScore = calculateCategoryScore(coreSum, coreCount, 50.0);

        BigDecimal overallScore = strengthScore.add(enduranceScore)
                .add(mobilityScore).add(balanceScore).add(coreScore)
                .divide(BigDecimal.valueOf(5), 2, java.math.RoundingMode.HALF_UP);

        String fitnessLevel;
        if (overallScore.compareTo(BigDecimal.valueOf(75)) >= 0) {
            fitnessLevel = "ADVANCED";
        } else if (overallScore.compareTo(BigDecimal.valueOf(45)) >= 0) {
            fitnessLevel = "INTERMEDIATE";
        } else {
            fitnessLevel = "BEGINNER";
        }

        FitnessProfile fp = new FitnessProfile();
        fp.setUser(u);
        fp.setAssessmentSession(session);
        fp.setFitnessLevel(fitnessLevel);
        fp.setStrengthScore(strengthScore);
        fp.setEnduranceScore(enduranceScore);
        fp.setMobilityScore(mobilityScore);
        fp.setBalanceScore(balanceScore);
        fp.setCoreScore(coreScore);
        fp.setOverallScore(overallScore);
        fitnessProfiles.save(fp);

        return new AssessmentSessionResponse(session.getId().toString(), session.getStatus().name(), "Assessment saved with level: " + fitnessLevel);
    }

    private BigDecimal calculateCategoryScore(BigDecimal sum, int count, double fallback) {
        if (count == 0) return BigDecimal.valueOf(fallback).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal avg = sum.divide(BigDecimal.valueOf(count), 2, java.math.RoundingMode.HALF_UP);
        // Clamp between 10.00 and 100.00
        if (avg.compareTo(BigDecimal.valueOf(100)) > 0) return BigDecimal.valueOf(100.00).setScale(2, java.math.RoundingMode.HALF_UP);
        if (avg.compareTo(BigDecimal.valueOf(10)) < 0) return BigDecimal.valueOf(10.00).setScale(2, java.math.RoundingMode.HALF_UP);
        return avg;
    }

    @Transactional(readOnly = true)
    public com.calishealth.api.dto.UserTraineeDtos.FitnessProfileResponse getLatestFitnessProfile(Long userId) {
        FitnessProfile fp = fitnessProfiles.findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElse(null);
        if (fp == null) return null;
        return new com.calishealth.api.dto.UserTraineeDtos.FitnessProfileResponse(
                fp.getId(),
                fp.getUser().getId(),
                fp.getAssessmentSession().getId(),
                fp.getFitnessLevel(),
                fp.getStrengthScore(),
                fp.getEnduranceScore(),
                fp.getMobilityScore(),
                fp.getBalanceScore(),
                fp.getCoreScore(),
                fp.getOverallScore(),
                fp.getCreatedAt()
        );
    }
}
