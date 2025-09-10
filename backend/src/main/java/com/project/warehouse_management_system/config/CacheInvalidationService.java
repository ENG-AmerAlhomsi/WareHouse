package com.project.warehouse_management_system.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for invalidating caches throughout the application.
 * This centralizes cache invalidation logic and provides methods
 * for different parts of the application to trigger cache invalidation.
 */
@Service
@Slf4j
public class CacheInvalidationService {

    @Autowired
    private OptimizedPolicyEnforcerFilter optimizedPolicyEnforcerFilter;
    
    /**
     * Invalidates all product-related caches.
     * This should be called whenever products are created, updated, or deleted.
     */
    public void invalidateProductsCache() {
        log.info("Invalidating products cache");
        optimizedPolicyEnforcerFilter.invalidateCachedResponsesByPathPrefix("/products/get");
    }
    
    /**
     * Invalidates all category-related caches.
     * This should be called whenever categories are created, updated, or deleted.
     */
    public void invalidateCategoriesCache() {
        log.info("Invalidating categories cache");
        optimizedPolicyEnforcerFilter.invalidateCachedResponsesByPathPrefix("/categories/get");
    }
    
    /**
     * Invalidates all order-related caches.
     * This should be called whenever orders are created, updated, or deleted.
     */
    public void invalidateOrdersCache() {
        log.info("Invalidating orders cache");
        optimizedPolicyEnforcerFilter.invalidateCachedResponsesByPathPrefix("/order/user");
    }
    
    /**
     * Invalidates all caches in the application.
     * This should be used sparingly, typically during major data changes or system maintenance.
     */
    public void invalidateAllCaches() {
        log.info("Invalidating all caches");
        optimizedPolicyEnforcerFilter.invalidateAllCachedResponses();
    }
}