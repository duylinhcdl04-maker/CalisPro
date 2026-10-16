package com.calishealth.api.service.ai;

import com.calishealth.api.entity.AiVoiceWarningCache;
import com.calishealth.api.repository.AiVoiceWarningCacheRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

@Service
public class VoiceWarningCacheService {

    private final AiVoiceWarningCacheRepository cacheRepository;

    public VoiceWarningCacheService(AiVoiceWarningCacheRepository cacheRepository) {
        this.cacheRepository = cacheRepository;
    }

    public String computeHash(String text, String language, String voice, String model) {
        String raw = (text != null ? text.trim() : "") + "|" +
                     (language != null ? language.trim() : "vi-VN") + "|" +
                     (voice != null ? voice.trim() : "default") + "|" +
                     (model != null ? model.trim() : "gemini");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(raw.hashCode());
        }
    }

    @Transactional
    public Optional<AiVoiceWarningCache> findInCache(String textHash) {
        Optional<AiVoiceWarningCache> cached = cacheRepository.findByTextHash(textHash);
        if (cached.isPresent()) {
            cached.get().incrementHitCount();
        }
        return cached;
    }

    @Transactional
    public AiVoiceWarningCache saveToCache(String textHash, String rawText, String language, String voiceName, String audioUrl, Double duration) {
        AiVoiceWarningCache cache = new AiVoiceWarningCache();
        cache.setTextHash(textHash);
        cache.setRawText(rawText);
        cache.setLanguage(language);
        cache.setVoiceName(voiceName);
        cache.setAudioUrl(audioUrl);
        cache.setDuration(duration);
        cache.setStatus("READY");
        return cacheRepository.save(cache);
    }
}
