package com.calishealth.api.service;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TempPasswordGeneratorTest {
    @Test
    void hasEnoughLengthAndEveryCharacterClass() {
        for (int i = 0; i < 200; i++) {
            String p = TempPasswordGenerator.generate();
            assertEquals(14, p.length());
            assertTrue(p.chars().anyMatch(Character::isUpperCase), p);
            assertTrue(p.chars().anyMatch(Character::isLowerCase), p);
            assertTrue(p.chars().anyMatch(Character::isDigit), p);
            assertTrue(p.chars().anyMatch(c -> "@#$%&*?!".indexOf(c) >= 0), p);
        }
    }

    @Test
    void avoidsAmbiguousCharacters_andIsNotRepeated() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 500; i++) {
            String p = TempPasswordGenerator.generate();
            assertTrue(p.chars().noneMatch(c -> "0O1lI".indexOf(c) >= 0), "ký tự dễ nhầm: " + p);
            assertTrue(seen.add(p), "trùng mật khẩu: " + p);
        }
    }

    @Test
    void tooShortLengthIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> TempPasswordGenerator.generate(6));
    }
}
