package com.govguide.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.govguide.content.ServiceContentRepository;
import com.govguide.dto.ApiResponse;
import com.govguide.dto.ServiceSummaryResponse;
import com.govguide.service.ServiceCatalogueService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/services")
public class ServiceController {

    private final ServiceCatalogueService catalogueService;
    private final ServiceContentRepository contentRepository;

    public ServiceController(ServiceCatalogueService catalogueService, ServiceContentRepository contentRepository) {
        this.catalogueService = catalogueService;
        this.contentRepository = contentRepository;
    }

    @PostMapping("/_reload")
    public ApiResponse<Map<String, Object>> reloadContent() {
        contentRepository.reload();
        int count = contentRepository.findAll().size();
        return ApiResponse.ok(Map.of("reloaded", true, "serviceCount", count));
    }

    @GetMapping
    public ApiResponse<List<ServiceSummaryResponse>> listServices() {
        return ApiResponse.ok(catalogueService.listServices());
    }

    @GetMapping("/{serviceCode}")
    public ApiResponse<JsonNode> getService(@PathVariable String serviceCode) {
        return ApiResponse.ok(catalogueService.getServiceForApi(serviceCode));
    }
}
