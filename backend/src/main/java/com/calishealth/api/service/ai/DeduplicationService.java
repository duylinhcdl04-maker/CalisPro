package com.calishealth.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Deduplication Engine:
 * Validates and ensures zero duplicates for:
 * 1. Exercises and Workout Plans (semantic & slug matching)
 * 2. Biomechanical Motion Rules (Joint + Phase + Condition unique signatures)
 */
@Service
public class DeduplicationService {

    private static final Logger log = LoggerFactory.getLogger(DeduplicationService.class);

    /**
     * Compute a deterministic biomechanical signature for a joint angle rule.
     * Example: "ELBOW_ANGLE_BOTTOM_LESS_THAN"
     */
    public String generateRuleSignature(String measurement, String phase, String condition) {
        String cleanMeasurement = normalizeJointName(measurement);
        String cleanPhase = (phase != null && !phase.isBlank()) ? phase.toUpperCase().trim() : "GENERAL";
        String cleanCond = (condition != null && !condition.isBlank()) ? condition.toUpperCase().trim() : "CONDITION";
        return String.format("%s_%s_%s", cleanMeasurement, cleanPhase, cleanCond);
    }

    /**
     * Check if a candidate rule signature already exists in the given set of existing signatures.
     */
    public boolean isRuleDuplicate(String signature, Collection<String> existingSignatures) {
        if (signature == null || existingSignatures == null || existingSignatures.isEmpty()) {
            return false;
        }
        for (String exist : existingSignatures) {
            if (exist == null) continue;
            if (exist.equalsIgnoreCase(signature) || isFuzzySignatureMatch(signature, exist)) {
                log.info("Detected duplicate rule signature: [{}] matched with [{}]", signature, exist);
                return true;
            }
        }
        return false;
    }

    /**
     * Check if an exercise name is a duplicate or too similar to existing exercises.
     */
    public boolean isExerciseDuplicate(String candidateName, List<String> existingNames, double similarityThreshold) {
        if (candidateName == null || existingNames == null || existingNames.isEmpty()) {
            return false;
        }
        String candidateSlug = toSlug(candidateName);

        for (String exist : existingNames) {
            if (exist == null) continue;
            String existSlug = toSlug(exist);
            if (candidateSlug.equals(existSlug)) {
                return true;
            }
            double sim = calculateStringSimilarity(candidateSlug, existSlug);
            if (sim >= similarityThreshold) {
                log.info("Candidate exercise [{}] is {:.1f}% similar to existing [{}]", candidateName, sim * 100, exist);
                return true;
            }
        }
        return false;
    }

    public record PlanDuplicateCheckResult(
            boolean isDuplicate,
            double similarityScore,
            String conflictingPlanName,
            String suggestedUniqueTitle,
            String message
    ) {}

    /**
     * Check if a workout plan title is duplicate or excessively similar to existing plans.
     */
    public PlanDuplicateCheckResult checkPlanDuplicates(String candidateTitle, String goal, String level, List<String> existingNames, double threshold) {
        if (candidateTitle == null || candidateTitle.isBlank() || existingNames == null || existingNames.isEmpty()) {
            return new PlanDuplicateCheckResult(false, 0.0, null, candidateTitle != null ? candidateTitle : "", "Tên giáo án độc nhất, chưa có trong hệ thống.");
        }

        String candidateClean = candidateTitle.trim();
        String candidateSlug = toSlug(candidateClean);

        double maxSimilarity = 0.0;
        String bestMatch = null;

        for (String exist : existingNames) {
            if (exist == null || exist.isBlank()) continue;
            String existClean = exist.trim();
            String existSlug = toSlug(existClean);

            if (candidateSlug.equals(existSlug) || candidateClean.equalsIgnoreCase(existClean)) {
                maxSimilarity = 1.0;
                bestMatch = existClean;
                break;
            }

            double sim = calculateStringSimilarity(candidateSlug, existSlug);
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                bestMatch = existClean;
            }
        }

        boolean isDup = maxSimilarity >= threshold;
        String suggestedName = candidateClean;
        if (isDup) {
            String suffix = " (Biến thể V2)";
            if (candidateClean.endsWith("V2)")) {
                suffix = " (Biến thể V3)";
            } else if (level != null && !level.isBlank()) {
                suffix = " - " + level + " Edition";
            }
            suggestedName = candidateClean + suffix;
        }

        String message = isDup
                ? String.format("Cảnh báo trùng lặp: Độ tương đồng %.0f%% với giáo án '%s'. Đề xuất đổi tên để đảm bảo tính độc nhất.", maxSimilarity * 100, bestMatch)
                : "Tên giáo án đảm bảo tính duy nhất và không bị xung đột.";

        return new PlanDuplicateCheckResult(isDup, maxSimilarity, bestMatch, suggestedName, message);
    }

    /**
     * Convert Vietnamese diacritics string to alphanumeric slug.
     */
    public String toSlug(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noDiacritics = pattern.matcher(normalized).replaceAll("").replace("đ", "d").replace("Đ", "D");
        return noDiacritics.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }

    private String normalizeJointName(String measurement) {
        if (measurement == null) return "JOINT";
        String lower = measurement.toLowerCase();
        if (lower.contains("elbow") || lower.contains("khuỷu")) return "ELBOW";
        if (lower.contains("shoulder") || lower.contains("vai")) return "SHOULDER";
        if (lower.contains("knee") || lower.contains("gối")) return "KNEE";
        if (lower.contains("spine") || lower.contains("hip") || lower.contains("hông") || lower.contains("lưng")) return "SPINE_HIP";
        if (lower.contains("ankle") || lower.contains("cổ chân")) return "ANKLE";
        if (lower.contains("wrist") || lower.contains("cổ tay")) return "WRIST";
        return toSlug(measurement).toUpperCase().replace("-", "_");
    }

    private boolean isFuzzySignatureMatch(String sig1, String sig2) {
        String[] parts1 = sig1.split("_");
        String[] parts2 = sig2.split("_");
        if (parts1.length >= 2 && parts2.length >= 2) {
            // Same joint and same condition
            return parts1[0].equalsIgnoreCase(parts2[0]) && parts1[parts1.length - 1].equalsIgnoreCase(parts2[parts2.length - 1]);
        }
        return false;
    }

    private double calculateStringSimilarity(String s1, String s2) {
        if (s1.equals(s2)) return 1.0;
        int maxLen = Math.max(s1.length(), s2.length());
        if (maxLen == 0) return 1.0;
        int distance = levenshteinDistance(s1, s2);
        return 1.0 - ((double) distance / maxLen);
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[s1.length()][s2.length()];
    }
}
