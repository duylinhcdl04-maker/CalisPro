package com.calishealth.api.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String from;
    private final boolean logOnly;

    public EmailService(JavaMailSender mailSender, @Value("${app.mail.from:duylinhpro04@gmail.com}") String from,
                        @Value("${app.mail.log-only:false}") boolean logOnly) {
        this.mailSender = mailSender;
        this.from = from;
        this.logOnly = logOnly;
    }

    /**
     * Gửi tài khoản Coach do Admin tạo: email đăng nhập + mật khẩu TẠM (bắt buộc đổi ở lần đăng nhập đầu, có hạn dùng).
     * Gửi lỗi ⇒ ném IllegalStateException để bên gọi hoàn tác việc tạo tài khoản (không để lại tài khoản mà Coach không nhận được thông tin).
     * app.mail.log-only=true (CHỈ dev/test): không gửi thật, ghi nội dung vào log.
     */
    public void sendCoachAccountEmail(String toEmail, String fullName, String tempPassword, String loginUrl, int validHours) {
        if (logOnly) {
            log.warn("[MAIL log-only] Coach account -> {} | mật khẩu tạm: {} | hiệu lực {} giờ | {}", toEmail, tempPassword, validHours, loginUrl);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Tài khoản Huấn luyện viên CalisHealth của bạn");
            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
                    <h2 style="color: #0284c7; text-align: center; margin-top: 0;">Chào mừng bạn đến với CalisHealth</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Quản trị viên đã tạo tài khoản <strong>Huấn luyện viên (Coach)</strong> cho bạn. Thông tin đăng nhập tạm thời:</p>
                    <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 8px;">
                        <tr><td style="padding: 10px 14px; color: #64748b;">Email đăng nhập</td><td style="padding: 10px 14px; font-weight: bold;">%s</td></tr>
                        <tr><td style="padding: 10px 14px; color: #64748b;">Mật khẩu tạm</td><td style="padding: 10px 14px; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px;">%s</td></tr>
                    </table>
                    <p style="color: #b45309; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; border-radius: 6px; font-size: 14px;">
                        Bạn <strong>bắt buộc đổi mật khẩu</strong> ở lần đăng nhập đầu tiên. Mật khẩu tạm có hiệu lực trong <strong>%d giờ</strong>; quá hạn bạn cần liên hệ quản trị viên để được cấp lại.
                    </p>
                    <div style="text-align: center; margin: 24px 0;"><a href="%s" style="display: inline-block; padding: 12px 28px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Đăng nhập</a></div>
                    <p style="color: #94a3b8; font-size: 12px;">Không chia sẻ email này cho bất kỳ ai. Nếu bạn không mong đợi email này, hãy bỏ qua và báo cho quản trị viên.</p>
                </div>
                """.formatted(escape(fullName), escape(toEmail), escape(tempPassword), validHours, escape(loginUrl));
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent coach account email to {}", toEmail);
        } catch (jakarta.mail.MessagingException | org.springframework.mail.MailException e) {
            log.error("Failed to send coach account email to {}: {}", toEmail, e.getMessage());
            throw new IllegalStateException("Không thể gửi email tài khoản Coach: " + e.getMessage(), e);
        }
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    public void sendOtpEmail(String toEmail, String otpCode, int expirationMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực OTP đăng ký tài khoản CalisHealth");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #2b6cb0; text-align: center;">Xác thực tài khoản CalisHealth</h2>
                    <p>Xin chào,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại CalisHealth. Dưới đây là mã OTP xác thực của bạn:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a365d; background: #edf2f7; padding: 12px 24px; border-radius: 6px; display: inline-block;">%s</span>
                    </div>
                    <p style="color: #718096; font-size: 14px;">Mã này có hiệu lực trong vòng <strong>%d phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #a0aec0; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
                </div>
                """.formatted(otpCode, expirationMinutes);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent OTP email to {}", toEmail);
        } catch (jakarta.mail.MessagingException | org.springframework.mail.MailException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage(), e);
            throw new IllegalStateException("Không thể gửi email OTP: " + e.getMessage(), e);
        }
    }

    public void sendCoachApprovalEmail(String toEmail, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("🎉 Chúc mừng! Hồ sơ Huấn luyện viên Calisthenics của bạn đã được phê duyệt");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #0284c7; margin: 0;">CalisHealth Platform</h1>
                        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Hệ sinh thái Calisthenics & Street Workout Chuyên Nghiệp</p>
                    </div>
                    <div style="padding: 20px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #166534; margin: 0 0 8px 0;">🎉 CHÚC MỪNG BẠN ĐÃ TRỞ THÀNH COACH CHÍNH THỨC!</h3>
                        <p style="color: #15803d; margin: 0; font-size: 14px;">Xin chào <strong>%s</strong>, Ban Thẩm định Chuyên môn CalisHealth đã xét duyệt toàn diện hồ sơ eKYC, bằng cấp và video thị phạm kỹ năng của bạn.</p>
                    </div>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                        Tài khoản của bạn đã được thăng cấp lên phân quyền <strong>COACH</strong>. Giờ đây bạn có thể:
                    </p>
                    <ul style="color: #334155; font-size: 14px; line-height: 1.8;">
                        <li>Xuất hiện trên danh mục Huấn luyện viên công khai của nền tảng.</li>
                        <li>Tiếp nhận học viên đăng ký kèm 1:1, mở lớp bootcamp kỹ năng (Planche, Front Lever, Handstand).</li>
                        <li>Chấm video sửa form kỹ thuật và xây dựng giáo án cá nhân hóa.</li>
                    </ul>
                    <div style="margin: 30px 0; text-align: center;">
                        <span style="display: inline-block; padding: 12px 28px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Đăng nhập vào Portal Coach</span>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">CalisHealth Team • Vì một cộng đồng Calisthenics chuẩn form & không chấn thương.</p>
                </div>
                """.formatted(fullName);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent Coach Approval email to {}", toEmail);
        } catch (org.springframework.mail.MailException | jakarta.mail.MessagingException e) {
            log.error("Failed to send coach approval email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendCoachRejectionEmail(String toEmail, String fullName, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Thông báo kết quả thẩm định hồ sơ Huấn luyện viên CalisHealth");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
                    <h2 style="color: #334155; text-align: center;">Thông Báo Thẩm Định Hồ Sơ</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Cảm ơn bạn đã quan tâm và gửi hồ sơ tham gia đội ngũ Huấn luyện viên tại CalisHealth.</p>
                    <div style="padding: 16px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; margin: 20px 0;">
                        <h4 style="color: #991b1b; margin: 0 0 6px 0;">Lý do chưa đạt yêu cầu:</h4>
                        <p style="color: #b91c1c; margin: 0; font-size: 14px;">%s</p>
                    </div>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                        Bạn có thể hoàn thiện thêm kỹ năng, bổ sung chứng chỉ và nộp lại hồ sơ bất cứ lúc nào.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">Ban Quản Trị CalisHealth</p>
                </div>
                """.formatted(fullName, reason != null && !reason.isBlank() ? reason : "Hồ sơ chưa đáp ứng đủ tiêu chuẩn kiểm định chuyên môn hiện tại.");

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent Coach Rejection email to {}", toEmail);
        } catch (org.springframework.mail.MailException | jakarta.mail.MessagingException e) {
            log.error("Failed to send coach rejection email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendCoachChangesRequestedEmail(String toEmail, String fullName, String notes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Yêu cầu bổ sung thông tin hồ sơ Huấn luyện viên CalisHealth");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
                    <h2 style="color: #d97706; text-align: center;">Yêu Cầu Bổ Sung Thông Tin Hồ Sơ</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Hồ sơ ứng tuyển Coach của bạn đang được xem xét. Tuy nhiên, Ban Chuyên môn cần bạn làm rõ hoặc cập nhật thêm các thông tin sau:</p>
                    <div style="padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 20px 0;">
                        <h4 style="color: #92400e; margin: 0 0 6px 0;">Yêu cầu chi tiết từ Admin:</h4>
                        <p style="color: #b45309; margin: 0; font-size: 14px;">%s</p>
                    </div>
                    <p style="color: #475569; font-size: 14px;">
                        Vui lòng truy cập trang cá nhân của bạn trên hệ thống để cập nhật lại hồ sơ.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">Ban Quản Trị CalisHealth</p>
                </div>
                """.formatted(fullName, notes != null && !notes.isBlank() ? notes : "Vui lòng chụp lại ảnh CCCD rõ nét hoặc bổ sung video quay form chuẩn.");

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent Coach Changes Requested email to {}", toEmail);
        } catch (org.springframework.mail.MailException | jakarta.mail.MessagingException e) {
            log.error("Failed to send coach changes requested email to {}: {}", toEmail, e.getMessage());
        }
    }
}
