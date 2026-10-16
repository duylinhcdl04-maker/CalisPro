package com.calishealth.api.service.ai;

import org.springframework.core.io.Resource;

import java.io.IOException;

public interface AudioStorageService {
    String storeAudio(String fileName, byte[] audioBytes) throws IOException;
    Resource loadAsResource(String fileName);
    byte[] loadAsBytes(String fileName) throws IOException;
    boolean exists(String fileName);
}
