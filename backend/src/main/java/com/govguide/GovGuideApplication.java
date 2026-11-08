package com.govguide;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GovGuideApplication {

    public static void main(String[] args) {
        SpringApplication.run(GovGuideApplication.class, args);
    }
}
