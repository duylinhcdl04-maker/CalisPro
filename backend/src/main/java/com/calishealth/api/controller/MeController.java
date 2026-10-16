package com.calishealth.api.controller;
import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.security.oauth2.jwt.Jwt; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/v1/me") public class MeController { @GetMapping public Map<String,Object> me(@AuthenticationPrincipal Jwt jwt){return Map.of("userId",jwt.getSubject(),"email",jwt.getClaimAsString("email"),"role",jwt.getClaimAsString("role"));} }
