package com.calishealth.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Gọi Gemini generateContent và trả về chuỗi JSON mà model sinh ra.
 *
 * Thử lần lượt các model trong `app.gemini.models`: model nào quá tải (503/429), lỗi máy chủ, không còn khả dụng (404)
 * hoặc hết thời gian thì chuyển sang model kế tiếp, trong tổng thời gian tối đa TOTAL_BUDGET.
 * Trả về Optional.empty() khi tất cả đều thất bại để nơi gọi dùng dữ liệu dự phòng.
 */
@Component
public class GeminiClient {
    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    // Frontend chờ tối đa 120s cho các API sinh nội dung AI -> giữ tổng thời gian dưới mức đó
    private static final Duration TOTAL_BUDGET = Duration.ofSeconds(100);
    private static final Duration PER_ATTEMPT = Duration.ofSeconds(60);

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    // Thứ tự ưu tiên: chính xác & nhanh trước, bản "lite" cuối cùng
    @Value("${app.gemini.models:gemini-3.5-flash,gemini-flash-latest,gemini-flash-lite-latest}")
    private String models;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public ObjectMapper objectMapper() {
        return objectMapper;
    }

    /**
     * @param prompt      nội dung yêu cầu (đã mô tả cấu trúc JSON cần trả về)
     * @param temperature 0..1, thấp = ổn định / ít "sáng tạo" (phù hợp số liệu sinh cơ học)
     */
    public Optional<String> generateJson(String prompt, double temperature, int maxOutputTokens) {
        if (!isConfigured()) {
            log.warn("Gemini API key chưa được cấu hình (app.gemini.api-key) -> dùng dữ liệu dự phòng");
            return Optional.empty();
        }

        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", temperature,
                            "maxOutputTokens", maxOutputTokens
                    )
            ));
        } catch (Exception e) {
            log.error("Không tạo được request Gemini: {}", e.getMessage());
            return Optional.empty();
        }

        long deadline = System.currentTimeMillis() + TOTAL_BUDGET.toMillis();
        List<String> modelList = Arrays.stream(models.split(",")).map(text -> text.trim()).filter(s -> !s.isEmpty()).toList();

        for (String model : modelList) {
            long remaining = deadline - System.currentTimeMillis();
            if (remaining < 5_000) {
                log.warn("Hết thời gian cho phép khi gọi Gemini, dừng trước model {}", model);
                break;
            }
            Optional<String> result = callModel(model, requestBody, Duration.ofMillis(Math.min(PER_ATTEMPT.toMillis(), remaining)));
            if (result.isPresent()) return result;
        }
        return Optional.empty();
    }

    private Optional<String> callModel(String model, String requestBody, Duration timeout) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(String.format(ENDPOINT, model, apiKey)))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(timeout)
                    .build();

            long start = System.currentTimeMillis();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Gemini {} trả về HTTP {} -> thử model kế tiếp: {}", model, response.statusCode(), errorMessage(response.body()));
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.isNull()) {
                log.warn("Gemini {} không trả nội dung (finishReason={})", model, root.path("candidates").path(0).path("finishReason"));
                return Optional.empty();
            }
            log.info("Gemini {} phản hồi sau {} ms", model, System.currentTimeMillis() - start);
            return Optional.of(stripCodeFence(textNode.asString()));
        } catch (Exception e) {
            log.warn("Gọi Gemini {} thất bại ({}) -> thử model kế tiếp", model, e.getMessage());
            return Optional.empty();
        }
    }

    private String errorMessage(String body) {
        try {
            return objectMapper.readTree(body).path("error").path("message").asString();
        } catch (Exception e) {
            return body == null ? "" : body.substring(0, Math.min(200, body.length()));
        }
    }

    private static String stripCodeFence(String raw) {
        String text = raw.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        else if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
        return text.trim();
    }
}
