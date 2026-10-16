package com.calishealth.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Service
public class LocalAudioStorageService implements AudioStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalAudioStorageService.class);
    private final Path rootLocation = Paths.get("uploads/ai-audio").toAbsolutePath().normalize();

    public LocalAudioStorageService() {
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize storage directory: {}", e.getMessage());
        }
    }

    @Override
    public String storeAudio(String fileName, byte[] audioBytes) throws IOException {
        if (!fileName.endsWith(".mp3") && !fileName.endsWith(".wav")) {
            fileName += ".mp3";
        }
        Path destination = this.rootLocation.resolve(fileName).normalize();
        Files.write(destination, audioBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        log.info("Stored audio file: {} ({} bytes)", destination, audioBytes.length);
        return "/api/v1/admin/ai/audio/" + fileName;
    }

    @Override
    public Resource loadAsResource(String fileName) {
        try {
            Path file = this.rootLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                return null;
            }
        } catch (MalformedURLException e) {
            log.warn("Malformed URL for audio file: {}", fileName);
            return null;
        }
    }

    @Override
    public byte[] loadAsBytes(String fileName) throws IOException {
        Path file = this.rootLocation.resolve(fileName).normalize();
        if (Files.exists(file)) {
            return Files.readAllBytes(file);
        }
        return new byte[0];
    }

    @Override
    public boolean exists(String fileName) {
        Path file = this.rootLocation.resolve(fileName).normalize();
        return Files.exists(file);
    }
}
