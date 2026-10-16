package com.calishealth.api.service;

import java.security.SecureRandom;

/** Mật khẩu tạm cho tài khoản do Admin cấp: ngẫu nhiên mật mã học, bỏ ký tự dễ nhầm (0/O, 1/l/I), đủ chữ hoa, chữ thường, số và ký hiệu. */
public final class TempPasswordGenerator {
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ", LOWER = "abcdefghijkmnpqrstuvwxyz", DIGIT = "23456789", SYMBOL = "@#$%&*?!";
    private static final String ALL = UPPER + LOWER + DIGIT + SYMBOL;
    private static final SecureRandom RANDOM = new SecureRandom();

    private TempPasswordGenerator() {}

    public static String generate() { return generate(14); }

    static String generate(int length) {
        if (length < 8) throw new IllegalArgumentException("Mật khẩu tạm tối thiểu 8 ký tự");
        char[] out = new char[length];
        String[] required = {UPPER, LOWER, DIGIT, SYMBOL};
        for (int i = 0; i < required.length; i++) out[i] = required[i].charAt(RANDOM.nextInt(required[i].length()));
        for (int i = required.length; i < length; i++) out[i] = ALL.charAt(RANDOM.nextInt(ALL.length()));
        for (int i = length - 1; i > 0; i--) {            // xáo trộn để ký tự bắt buộc không luôn đứng đầu
            int j = RANDOM.nextInt(i + 1);
            char t = out[i]; out[i] = out[j]; out[j] = t;
        }
        return new String(out);
    }
}
