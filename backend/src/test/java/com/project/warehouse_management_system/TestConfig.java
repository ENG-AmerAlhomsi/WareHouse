package com.project.warehouse_management_system;

import com.project.warehouse_management_system.config.keycloakConfig.KeycloakSecurityUtil;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@TestConfiguration
@Profile("test")
public class TestConfig {

    @Bean
    @Primary
    public KeycloakSecurityUtil keycloakSecurityUtil() {
        // Return a mocked version for testing
        return new KeycloakSecurityUtil();
    }
}
