package com.project.warehouse_management_system.config.keycloakConfig;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Monitors Keycloak performance metrics using Micrometer.
 * This class provides methods to track various Keycloak-related operations
 * and their performance characteristics.
 */
@Component
public class KeycloakPerformanceMonitor {

    private final MeterRegistry meterRegistry;
    
    // Counters for tracking request types
    private final Counter publicRequestCounter;
    private final Counter protectedRequestCounter;
    private final Counter cachedPathCounter;
    
    // Timers for measuring performance
    private final Timer policyEnforcementTimer;
    private final Timer tokenValidationTimer;
    
    @Autowired
    public KeycloakPerformanceMonitor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        // Initialize counters
        this.publicRequestCounter = Counter.builder("keycloak.requests.public")
                .description("Number of public requests that bypass policy enforcement")
                .register(meterRegistry);
                
        this.protectedRequestCounter = Counter.builder("keycloak.requests.protected")
                .description("Number of protected requests that require policy enforcement")
                .register(meterRegistry);
                
        this.cachedPathCounter = Counter.builder("keycloak.path.cache.hit")
                .description("Number of path cache hits")
                .register(meterRegistry);
                
        // Initialize timers
        this.policyEnforcementTimer = Timer.builder("keycloak.policy.enforcement.time")
                .description("Time taken for policy enforcement")
                .register(meterRegistry);
                
        this.tokenValidationTimer = Timer.builder("keycloak.token.validation.time")
                .description("Time taken for token validation")
                .register(meterRegistry);
    }
    
    /**
     * Records a public request that bypasses policy enforcement
     */
    public void recordPublicRequest() {
        publicRequestCounter.increment();
    }
    
    /**
     * Records a protected request that requires policy enforcement
     */
    public void recordProtectedRequest() {
        protectedRequestCounter.increment();
    }
    
    /**
     * Records a path cache hit
     */
    public void recordPathCacheHit() {
        cachedPathCounter.increment();
    }
    
    /**
     * Records the time taken for policy enforcement
     * @param timeNanos Time taken in nanoseconds
     */
    public void recordPolicyEnforcementTime(long timeNanos) {
        policyEnforcementTimer.record(timeNanos, TimeUnit.NANOSECONDS);
    }
    
    /**
     * Starts a timer for measuring policy enforcement time
     * @return A timer sample that can be used to stop the timer
     */
    public Timer.Sample startPolicyEnforcementTimer() {
        return Timer.start(meterRegistry);
    }
    
    /**
     * Stops the policy enforcement timer and records the time
     * @param sample The timer sample returned by startPolicyEnforcementTimer()
     */
    public void stopPolicyEnforcementTimer(Timer.Sample sample) {
        sample.stop(policyEnforcementTimer);
    }
    
    /**
     * Records the time taken for token validation
     * @param timeNanos Time taken in nanoseconds
     */
    public void recordTokenValidationTime(long timeNanos) {
        tokenValidationTimer.record(timeNanos, TimeUnit.NANOSECONDS);
    }
}