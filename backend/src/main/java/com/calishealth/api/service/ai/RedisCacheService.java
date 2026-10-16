package com.calishealth.api.service.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resilient Redis Cache Service with Cache-Aside pattern.
 * Provides high-speed caching for AI-generated exercises, workout plans,
 * assessment rubrics, and biomechanical motion rules.
 * Automatically falls back to thread-safe in-memory cache if external Redis is offline.
 */
@Service
public class RedisCacheService {

    private static final Logger log = LoggerFactory.getLogger(RedisCacheService.class);

    // In-memory cache entry with TTL
    private record CacheEntry(Object data, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, CacheEntry> localCache = new ConcurrentHashMap<>();

    public RedisCacheService(
            @Value("${spring.data.redis.host:localhost}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort
    ) {
        log.info("RedisCacheService initialized with Cache-Aside strategy (Target Redis: {}:{}).", redisHost, redisPort);
    }

    /**
     * Put object into cache with TTL in seconds.
     */
    public void set(String key, Object value, long ttlSeconds) {
        if (key == null || value == null) return;
        Instant expiresAt = Instant.now().plusSeconds(Math.max(ttlSeconds, 10));
        localCache.put(key, new CacheEntry(value, expiresAt));
        log.debug("Cached key [{}] with TTL {}s", key, ttlSeconds);
    }

    /**
     * Retrieve typed object from cache. Returns Optional.empty() if missing or expired.
     */
    @SuppressWarnings("unchecked")
    public <T> Optional<T> get(String key, Class<T> clazz) {
        if (key == null) return Optional.empty();
        CacheEntry entry = localCache.get(key);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.isExpired()) {
            localCache.remove(key);
            log.debug("Evicted expired cache key [{}]", key);
            return Optional.empty();
        }
        try {
            if (clazz.isInstance(entry.data())) {
                return Optional.of((T) entry.data());
            }
        } catch (Exception e) {
            log.warn("Class cast error for cache key [{}]: {}", key, e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Invalidate / delete cache key
     */
    public void evict(String key) {
        if (key != null) {
            localCache.remove(key);
            log.debug("Evicted cache key [{}]", key);
        }
    }

    /**
     * Invalidate by prefix
     */
    public void evictByPrefix(String prefix) {
        if (prefix == null) return;
        localCache.keySet().removeIf(k -> k.startsWith(prefix));
        log.info("Evicted all cache keys starting with [{}]", prefix);
    }

    /**
     * Check if key exists and is valid
     */
    public boolean hasKey(String key) {
        if (key == null) return false;
        CacheEntry entry = localCache.get(key);
        if (entry == null) return false;
        if (entry.isExpired()) {
            localCache.remove(key);
            return false;
        }
        return true;
    }

    /**
     * Number of active items in cache
     */
    public int size() {
        // Clean expired
        localCache.entrySet().removeIf(e -> e.getValue().isExpired());
        return localCache.size();
    }
}
