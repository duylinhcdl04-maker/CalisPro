package com.calishealth.api.engine.v2;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/** Kiểm tra kiến trúc bằng quét mã nguồn (không thêm ArchUnit): I3 (safety độc lập), Gemini không quyết định, I-config (không số cứng). */
class V2ArchitectureTest {
    private static final Path ROOT = Path.of("src/main/java/com/calishealth/api");

    private static List<Path> javaFiles(String sub) throws IOException {
        try (Stream<Path> s = Files.walk(ROOT.resolve(sub))) { return s.filter(p -> p.toString().endsWith(".java")).collect(Collectors.toList()); }
    }

    private static String imports(Path p) throws IOException {
        return Files.readAllLines(p).stream().filter(l -> l.startsWith("import ")).collect(Collectors.joining("\n"));
    }

    @Test
    void enginesV2DoNotDependOnSafety() throws IOException {
        for (Path p : javaFiles("engine/v2")) assertFalse(imports(p).contains("com.calishealth.api.safety"), p + " import safety (vi phạm I3)");
    }

    @Test
    void safetyDoesNotDependOnEnginesOrScoring() throws IOException {
        for (Path p : javaFiles("safety")) {
            String imp = imports(p);
            assertFalse(imp.contains("com.calishealth.api.engine"), p + " import engine");
            assertFalse(imp.toLowerCase().contains("competency") || imp.toLowerCase().contains("level"), p + " import năng lực/level");
        }
    }

    @Test
    void enginesV2ArePureDomainCode() throws IOException {
        for (Path p : javaFiles("engine/v2")) {
            String imp = imports(p);
            for (String banned : List.of("org.springframework", "jakarta.persistence", ".repository.", ".entity.", ".service.", ".controller.", "Gemini"))
                assertFalse(imp.contains(banned), p + " import " + banned);
        }
    }

    @Test
    void noGroupWeightLiteralsInCompetencyEngine() throws IOException {
        for (Path p : javaFiles("engine/v2/competency")) {
            String code = Files.readString(p);
            assertFalse(code.contains("0.75") || code.contains("0.25"), p + " chứa trọng số nhóm viết cứng (phải lấy từ rule set)");
        }
    }

    @Test
    void competencyEngineHasNoExperienceOrSafetyInput() throws IOException {
        String code = Files.readString(ROOT.resolve("engine/v2/competency/CompetencyScoringEngine.java"));
        assertFalse(code.contains("CONTEXT_EXPERIENCE"));
        assertFalse(imports(ROOT.resolve("engine/v2/competency/CompetencyScoringEngine.java")).toLowerCase().contains("safety"));
    }
}
