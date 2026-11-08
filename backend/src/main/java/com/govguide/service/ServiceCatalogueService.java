package com.govguide.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.govguide.content.ServiceContentRepository;
import com.govguide.dto.ServiceSummaryResponse;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ServiceCatalogueService {

    private final ServiceContentRepository contentRepository;

    public ServiceCatalogueService(ServiceContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    public List<ServiceSummaryResponse> listServices() {
        return contentRepository.findAll().stream().map(this::toSummary).toList();
    }

    public JsonNode getService(String serviceCode) {
        return contentRepository.findByCode(serviceCode);
    }

    private static final Set<String> INTERNAL_FIELDS = Set.of("sourceRefs", "evidenceStatus");

    public JsonNode getServiceForApi(String serviceCode) {
        JsonNode original = getService(serviceCode);
        return stripInternalFields(original.deepCopy());
    }

    private static JsonNode stripInternalFields(JsonNode node) {
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            INTERNAL_FIELDS.forEach(obj::remove);
            Iterator<String> fieldNames = obj.fieldNames();
            while (fieldNames.hasNext()) {
                stripInternalFields(obj.get(fieldNames.next()));
            }
        } else if (node.isArray()) {
            for (JsonNode element : node) {
                stripInternalFields(element);
            }
        }
        return node;
    }

    private ServiceSummaryResponse toSummary(JsonNode record) {
        return new ServiceSummaryResponse(
                record.path("serviceCode").asText(),
                record.path("version").asInt(),
                record.path("status").asText(),
                record.path("publicationReadiness").asText(),
                record.path("name").path("en").asText(),
                record.path("authority").asText(),
                record.path("jurisdiction").asText(),
                record.path("category").asText(),
                record.path("description").path("en").asText(),
                record.path("review").path("lastVerifiedDate").asText());
    }
}
