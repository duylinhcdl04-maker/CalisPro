package com.calishealth.api.controller;

import com.calishealth.api.dto.AiGeneratorDtos.MediaUploadResponse;
import com.calishealth.api.service.ai.CloudinaryService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
public class MediaUploadController {

    private final CloudinaryService cloudinaryService;

    public MediaUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Upload Image or Video file to Cloudinary (or Local Storage fallback).
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "calishealth_exercises") String folder
    ) {
        MediaUploadResponse resp = cloudinaryService.uploadMedia(file, folder);
        if (resp.success()) {
            return ResponseEntity.ok(resp);
        } else {
            return ResponseEntity.badRequest().body(resp);
        }
    }

    /**
     * Cấp chữ ký để frontend upload trực tiếp lên Cloudinary (nhanh hơn, có tiến trình %).
     */
    @PostMapping("/signature")
    public ResponseEntity<?> createUploadSignature(
            @RequestParam(value = "folder", required = false, defaultValue = "calishealth_exercises") String folder
    ) {
        if (!cloudinaryService.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of("message", "Cloudinary chưa được cấu hình"));
        }
        return ResponseEntity.ok(cloudinaryService.createUploadSignature(folder));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<MediaUploadResponse> handleMaxUploadSizeExceeded(org.springframework.web.multipart.MaxUploadSizeExceededException e) {
        return ResponseEntity.badRequest().body(new MediaUploadResponse(
                false, null, null, null, null, 0, 0, 0, null,
                "Dung lượng tệp tải lên vượt quá giới hạn tối đa cho phép (250MB)."
        ));
    }

    /**
     * Check if Cloudinary credentials are fully configured in the environment.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getMediaStatus() {
        boolean configured = cloudinaryService.isConfigured();
        return ResponseEntity.ok(Map.of(
                "cloudinaryConfigured", configured,
                "storageMode", configured ? "CLOUDINARY_CDN" : "LOCAL_STORAGE_FALLBACK",
                "maxUploadSizeMb", 250
        ));
    }

    /**
     * Serve locally saved media if fallback mode was used.
     */
    @GetMapping("/local/{resourceType}/{filename:.+}")
    public ResponseEntity<Resource> serveLocalMedia(
            @PathVariable String resourceType,
            @PathVariable String filename
    ) {
        try {
            Path filePath = Paths.get("uploads/media/" + resourceType).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = resourceType.equals("video") ? "video/mp4" : "image/jpeg";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
        } catch (java.net.MalformedURLException ignored) {
            // Invalid resource URL
        }

        return ResponseEntity.notFound().build();
    }
}
