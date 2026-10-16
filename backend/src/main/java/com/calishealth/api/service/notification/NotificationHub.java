package com.calishealth.api.service.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Danh sách kết nối WebSocket đang mở theo người dùng, và đẩy tin xuống các kết nối đó. Một người có thể mở nhiều tab/thiết bị. */
@Component
public class NotificationHub {
    private static final Logger log = LoggerFactory.getLogger(NotificationHub.class);
    private final Map<Long, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    public void add(long userId, WebSocketSession s) {
        sessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(s);
    }

    public void remove(long userId, WebSocketSession s) {
        Set<WebSocketSession> set = sessions.get(userId);
        if (set == null) return;
        set.remove(s);
        if (set.isEmpty()) sessions.remove(userId, set);
    }

    public int connections(long userId) {
        Set<WebSocketSession> set = sessions.get(userId);
        return set == null ? 0 : set.size();
    }

    /** Gửi một khung JSON tới mọi kết nối của người dùng. Lỗi gửi chỉ ghi log: thông báo đã lưu DB, client sẽ thấy khi tải lại/kết nối lại. */
    public void push(long userId, String json) {
        Set<WebSocketSession> set = sessions.get(userId);
        if (set == null) return;
        for (WebSocketSession s : set) {
            try {
                if (!s.isOpen()) { remove(userId, s); continue; }
                synchronized (s) { s.sendMessage(new TextMessage(json)); }   // WebSocketSession không an toàn khi gửi đồng thời
            } catch (IOException | RuntimeException e) {
                log.debug("Không gửi được thông báo tới user {}: {}", userId, e.toString());
                remove(userId, s);
            }
        }
    }
}
