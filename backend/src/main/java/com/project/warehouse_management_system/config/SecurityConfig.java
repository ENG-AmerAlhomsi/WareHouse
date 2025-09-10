package com.project.warehouse_management_system.config;

import java.io.IOException;

import com.project.warehouse_management_system.config.keycloakConfig.KeycloakPerformanceMonitor;
import org.keycloak.adapters.authorization.spi.ConfigurationResolver;
import org.keycloak.adapters.authorization.spi.HttpRequest;
import org.keycloak.representations.adapters.config.PolicyEnforcerConfig;
import org.keycloak.util.JsonSerialization;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;



@Configuration
@EnableWebSecurity
@EnableCaching
public class SecurityConfig {

    @Autowired
    private CacheManager cacheManager;
    
    @Autowired
    private KeycloakPerformanceMonitor performanceMonitor;
    
    // Cache for policy enforcer configuration to avoid repeated parsing
    private static PolicyEnforcerConfig cachedConfig;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable);
        http.addFilterAfter(createPolicyEnforcerFilter(),
                BearerTokenAuthenticationFilter.class);
        http.sessionManagement(
                t -> t.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );
        return http.build();
    }

    @Bean
    public OptimizedPolicyEnforcerFilter createPolicyEnforcerFilter() {
        ConfigurationResolver configResolver = new ConfigurationResolver() {
            @Override
            public PolicyEnforcerConfig resolve(HttpRequest httpRequest) {
                // Use cached configuration if available
                if (cachedConfig != null) {
                    return cachedConfig;
                }
                
                try {
                    // Load and cache the configuration
                    cachedConfig = JsonSerialization.
                            readValue(getClass().getResourceAsStream("/policy-enforcer.json"),
                                    PolicyEnforcerConfig.class);
                    return cachedConfig;
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }
        };
        
        // Use our optimized filter implementation with performance monitoring
        return new OptimizedPolicyEnforcerFilter(configResolver, cacheManager, performanceMonitor);
    }
}




