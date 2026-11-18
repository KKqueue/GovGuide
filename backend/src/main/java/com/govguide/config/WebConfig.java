package com.govguide.config;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.frontend.dir:}")
    private String frontendDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (frontendDir != null && !frontendDir.isBlank()) {
            registry.addResourceHandler("/**")
                    .addResourceLocations("file:" + frontendDir + "/")
                    .resourceChain(true)
                    .addResolver(new SpaPathResourceResolver());
        }
    }

    private static class SpaPathResourceResolver extends PathResourceResolver {
        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource resource = location.createRelative(resourcePath);
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            if (!resourcePath.startsWith("api/")) {
                resource = location.createRelative("index.html");
                if (resource.exists() && resource.isReadable()) {
                    return resource;
                }
            }
            return null;
        }
    }
}
