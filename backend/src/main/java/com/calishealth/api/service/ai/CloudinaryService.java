package com.calishealth.api.service.ai;

import com.calishealth.api.dto.AiGeneratorDtos.MediaUploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${server.port:8080}")
    private String serverPort;

    public boolean isConfigured() {
        return cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }

    /**
     * Upload an image or video to Cloudinary.
     * If Cloudinary credentials are not set in .env, falls back to local storage seamlessly.
     */
    public MediaUploadResponse uploadMedia(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            return new MediaUploadResponse(false, null, null, null, null, 0, 0, 0, null, "File tải lên bị rỗng");
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        boolean isVideo = contentType.startsWith("video/") || (originalFilename != null && originalFilename.matches(".*\\.(mp4|mov|webm|avi|mkv)$"));
        String resourceType = isVideo ? "video" : "image";
        String targetFolder = (folder != null && !folder.isBlank()) ? folder : "calishealth_exercises";

        // If Cloudinary credentials are valid, upload to Cloudinary
        if (isConfigured()) {
            try {
                return uploadToCloudinaryDirect(file, targetFolder, resourceType);
            } catch (Exception e) {
                log.error("Cloudinary upload failed: {}. Falling back to local storage.", e.getMessage());
            }
        }

        // Fallback: Local storage upload
        return saveLocally(file, resourceType);
    }

    /**
     * Upload directly to Cloudinary REST API with HMAC-SHA1 signature
     */
    /**
     * Tạo chữ ký để trình duyệt upload THẲNG lên Cloudinary (không đi vòng qua backend).
     * Upload qua backend phải truyền file 2 lần (browser -> backend -> Cloudinary) nên rất chậm với video.
     */
    public Map<String, Object> createUploadSignature(String folder) {
        if (!isConfigured()) {
            throw new IllegalStateException("Cloudinary chưa được cấu hình");
        }
        String targetFolder = (folder == null || folder.isBlank()) ? "calishealth_exercises" : folder.trim();
        long timestamp = System.currentTimeMillis() / 1000L;
        String publicId = UUID.randomUUID().toString().substring(0, 12);
        String toSign = "folder=" + targetFolder + "&public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
        try {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("cloudName", cloudName);
            result.put("apiKey", apiKey);
            result.put("timestamp", timestamp);
            result.put("folder", targetFolder);
            result.put("publicId", publicId);
            result.put("signature", hmacSha1Hex(toSign));
            return result;
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo chữ ký upload Cloudinary", e);
        }
    }

    private MediaUploadResponse uploadToCloudinaryDirect(MultipartFile file, String folder, String resourceType) throws Exception {
        long timestamp = System.currentTimeMillis() / 1000L;
        String filenameId = UUID.randomUUID().toString().substring(0, 12);

        // Build sorted parameter map for signature
        Map<String, String> params = new TreeMap<>();
        params.put("folder", folder);
        params.put("public_id", filenameId);
        params.put("timestamp", String.valueOf(timestamp));

        StringBuilder toSign = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (toSign.length() > 0) toSign.append("&");
            toSign.append(entry.getKey()).append("=").append(entry.getValue());
        }
        toSign.append(apiSecret);

        String signature = hmacSha1Hex(toSign.toString());

        String endpoint = String.format("https://api.cloudinary.com/v1_1/%s/%s/upload", cloudName, resourceType);
        String boundary = "----CalisHealthCloudinaryBoundary" + System.currentTimeMillis();

        URL url = java.net.URI.create(endpoint).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(180000);
        // Stream trực tiếp thay vì buffer toàn bộ file vào RAM trước khi gửi
        conn.setChunkedStreamingMode(64 * 1024);

        try (OutputStream out = conn.getOutputStream()) {
            // Write form fields
            writeFormField(out, boundary, "api_key", apiKey);
            writeFormField(out, boundary, "timestamp", String.valueOf(timestamp));
            writeFormField(out, boundary, "folder", folder);
            writeFormField(out, boundary, "public_id", filenameId);
            writeFormField(out, boundary, "signature", signature);

            // Write file
            out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            out.write(String.format("Content-Disposition: form-data; name=\"file\"; filename=\"%s\"\r\n", file.getOriginalFilename()).getBytes(StandardCharsets.UTF_8));
            out.write(String.format("Content-Type: %s\r\n\r\n", file.getContentType()).getBytes(StandardCharsets.UTF_8));
            
            try (InputStream in = file.getInputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
            out.write("\r\n".getBytes(StandardCharsets.UTF_8));
            out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            out.flush();
        }

        int responseCode = conn.getResponseCode();
        if (responseCode == 200 || responseCode == 201) {
            try (InputStream respIn = conn.getInputStream()) {
                String responseBody = new String(respIn.readAllBytes(), StandardCharsets.UTF_8);
                // Extract secure_url from JSON
                String secureUrl = extractJsonValue(responseBody, "secure_url");
                String respPublicId = extractJsonValue(responseBody, "public_id");
                if (respPublicId == null || respPublicId.isBlank()) {
                    respPublicId = folder + "/" + filenameId;
                }
                String format = extractJsonValue(responseBody, "format");
                int width = extractJsonInt(responseBody, "width");
                int height = extractJsonInt(responseBody, "height");
                Double duration = null;
                if (resourceType.equals("video")) {
                    String durStr = extractJsonValue(responseBody, "duration");
                    if (durStr != null) {
                        try {
                            duration = Double.valueOf(durStr);
                        } catch (NumberFormatException ignored) {}
                    }
                }

                log.info("Cloudinary upload SUCCESS: {}", secureUrl);
                return new MediaUploadResponse(
                        true,
                        secureUrl,
                        respPublicId,
                        resourceType,
                        format,
                        file.getSize(),
                        width,
                        height,
                        duration,
                        "Upload Cloudinary thành công"
                );
            }
        } else {
            InputStream errIn = conn.getErrorStream();
            String errStr = errIn != null ? new String(errIn.readAllBytes(), StandardCharsets.UTF_8) : "HTTP " + responseCode;
            log.error("Cloudinary upload failed ({}): {}", responseCode, errStr);
            throw new RuntimeException("Cloudinary upload failed: " + errStr);
        }
    }

    private void writeFormField(OutputStream out, String boundary, String name, String value) throws Exception {
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(String.format("Content-Disposition: form-data; name=\"%s\"\r\n\r\n", name).getBytes(StandardCharsets.UTF_8));
        out.write((value + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    private String hmacSha1Hex(String data) throws Exception {
        java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
        byte[] bytes = md.digest(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private MediaUploadResponse saveLocally(MultipartFile file, String resourceType) {
        try {
            String uploadDir = "uploads/media/" + resourceType + "/";
            Path dirPath = Paths.get(uploadDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String ext = "";
            String orig = file.getOriginalFilename();
            if (orig != null && orig.contains(".")) {
                ext = orig.substring(orig.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString().substring(0, 16) + ext;
            Path filePath = dirPath.resolve(filename);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String localUrl = String.format("http://localhost:%s/api/v1/media/local/%s/%s", serverPort, resourceType, filename);
            log.info("Saved file locally at: {}", localUrl);

            return new MediaUploadResponse(
                    true,
                    localUrl,
                    "local_" + filename,
                    resourceType,
                    ext.replace(".", ""),
                    file.getSize(),
                    1920,
                    1080,
                    resourceType.equals("video") ? 45.0 : null,
                    "Đã lưu trữ Media thành công (Local Storage fallback)"
            );
        } catch (java.io.IOException e) {
            log.error("Failed to save media locally: {}", e.getMessage(), e);
            return new MediaUploadResponse(false, null, null, null, null, 0, 0, 0, null, "Lỗi lưu file: " + e.getMessage());
        }
    }

    private String extractJsonValue(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start != -1) {
            start += pattern.length();
            int end = json.indexOf("\"", start);
            if (end != -1) {
                return json.substring(start, end).replace("\\/", "/");
            }
        }
        return null;
    }

    private int extractJsonInt(String json, String key) {
        String pattern = "\"" + key + "\":";
        int start = json.indexOf(pattern);
        if (start != -1) {
            start += pattern.length();
            int end = start;
            while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
                end++;
            }
            try {
                return Integer.parseInt(json.substring(start, end));
            } catch (NumberFormatException ignored) {}
        }
        return 0;
    }
}
