package com.calishealth.api.config;

import com.calishealth.api.service.notification.NotificationHub;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Kênh realtime /ws/notifications. Trình duyệt không gửi được header Authorization khi mở WebSocket,
 * nên JWT truy cập đi theo query (?token=...) và được kiểm tra ở bước bắt tay (sai/hết hạn thì từ chối 401).
 * /ws/** được SecurityConfig cho qua vì việc xác thực làm ở đây. Chỉ có chiều server → client; mọi hành động vẫn đi qua REST.
 */
@Configuration
@EnableWebSocket
public class NotificationWebSocketConfig implements WebSocketConfigurer {
    private static final String USER_ID = "userId";
    private final NotificationHub hub;
    private final JwtDecoder decoder;

    public NotificationWebSocketConfig(NotificationHub hub, JwtDecoder decoder) {
        this.hub = hub; this.decoder = decoder;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler(), "/ws/notifications").addInterceptors(authInterceptor()).setAllowedOriginPatterns("*");
    }

    private HandshakeInterceptor authInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest req, ServerHttpResponse res, WebSocketHandler h, Map<String, Object> attrs) {
                String token = UriComponentsBuilder.fromUri(req.getURI()).build().getQueryParams().getFirst("token");
                if (token == null || token.isBlank()) { res.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED); return false; }
                try {
                    Jwt jwt = decoder.decode(token);
                    attrs.put(USER_ID, Long.parseLong(jwt.getSubject()));
                    return true;
                } catch (RuntimeException e) {
                    res.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                    return false;
                }
            }

            @Override
            public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res, WebSocketHandler h, Exception ex) {}
        };
    }

    private TextWebSocketHandler handler() {
        return new TextWebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession s) { hub.add(userId(s), s); }

            @Override
            protected void handleTextMessage(WebSocketSession s, TextMessage m) throws Exception {
                if ("ping".equals(m.getPayload())) s.sendMessage(new TextMessage("{\"event\":\"pong\"}"));   // giữ kết nối khi qua proxy
            }

            @Override
            public void afterConnectionClosed(WebSocketSession s, CloseStatus status) { hub.remove(userId(s), s); }

            @Override
            public void handleTransportError(WebSocketSession s, Throwable e) throws Exception { hub.remove(userId(s), s); s.close(); }

            private long userId(WebSocketSession s) { return (Long) s.getAttributes().get(USER_ID); }
        };
    }
}
