package com.project.warehouse_management_system.config.keycloakConfig;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Keycloak caching to improve performance
 * This class configures caching for Keycloak token validation and policy enforcement
 */
@Configuration
@EnableCaching
public class KeycloakCacheConfig {

    /**
     * Creates a cache manager for Keycloak token validation and policy enforcement
     * This reduces the number of calls to the Keycloak server
     * 
     * @return CacheManager instance
     */
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("keycloakTokens", "keycloakPolicies", "publicResponses");
    }
}