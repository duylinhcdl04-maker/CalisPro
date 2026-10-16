package com.calishealth.api.controller;

import com.calishealth.api.service.notification.AdminWorkQueueService;
import com.calishealth.api.service.notification.AdminWorkQueueService.WorkQueue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Hàng chờ việc của Admin (chỉ ADMIN, theo quy tắc chung của /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/work-queue")
public class AdminWorkQueueController {
    private final AdminWorkQueueService service;

    public AdminWorkQueueController(AdminWorkQueueService service) { this.service = service; }

    @GetMapping
    public WorkQueue queue() { return service.queue(); }
}
