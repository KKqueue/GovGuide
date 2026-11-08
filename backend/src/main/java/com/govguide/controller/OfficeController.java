package com.govguide.controller;

import com.govguide.dto.ApiResponse;
import com.govguide.dto.OfficeSearchResponse;
import com.govguide.service.OfficeDiscoveryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/offices")
public class OfficeController {

    private final OfficeDiscoveryService officeDiscoveryService;

    public OfficeController(OfficeDiscoveryService officeDiscoveryService) {
        this.officeDiscoveryService = officeDiscoveryService;
    }

    @GetMapping
    public ApiResponse<OfficeSearchResponse> search(
            @RequestParam String serviceId,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String town,
            @RequestParam(required = false) String pinCode) {
        return ApiResponse.ok(officeDiscoveryService.search(serviceId, district, city, town, pinCode));
    }
}
