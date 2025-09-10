package com.project.warehouse_management_system.config;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import com.project.warehouse_management_system.config.keycloakConfig.KeycloakPerformanceMonitor;
import io.micrometer.core.instrument.Timer;
import org.keycloak.adapters.authorization.integration.jakarta.ServletPolicyEnforcerFilter;
import org.keycloak.adapters.authorization.spi.ConfigurationResolver;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.util.ContentCachingResponseWrapper;

/**
 * An optimized version of the Keycloak ServletPolicyEnforcerFilter that implements
 * path caching and fast-path handling for public endpoints to improve performance.
 */
@Slf4j
public class OptimizedPolicyEnforcerFilter extends ServletPolicyEnforcerFilter {

    private final CacheManager cacheManager;
    private final Map<String, Boolean> pathMatchCache = new ConcurrentHashMap<>();
    private final Map<Pattern, Boolean> patternCache = new ConcurrentHashMap<>();
    private final KeycloakPerformanceMonitor performanceMonitor;
    
    // Track cache keys by path prefix for targeted invalidation
    private final Map<String, Set<String>> pathPrefixToCacheKeys = new ConcurrentHashMap<>();
    
    // Common public paths that should bypass enforcement
    private static final String[] PUBLIC_PATH_PREFIXES = {
        "/products/get",
        "/public/"
    };

    public OptimizedPolicyEnforcerFilter(ConfigurationResolver configurationResolver, CacheManager cacheManager, KeycloakPerformanceMonitor performanceMonitor) {
        super(configurationResolver);
        this.cacheManager = cacheManager;
        this.performanceMonitor = performanceMonitor;
        
        // Pre-compile patterns for faster matching
        for (String prefix : PUBLIC_PATH_PREFIXES) {
            if (prefix.endsWith("/")) {
                patternCache.put(Pattern.compile("^" + Pattern.quote(prefix) + ".*"), true);
            } else {
                patternCache.put(Pattern.compile("^" + Pattern.quote(prefix) + "$"), true);
            }
        }
        
        log.info("Initialized OptimizedPolicyEnforcerFilter with {} public path patterns", patternCache.size());
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        // Start timing the policy enforcement
        Timer.Sample sample = null;
        if (performanceMonitor != null) {
            sample = performanceMonitor.startPolicyEnforcementTimer();
        }
        
        try {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            String path = httpRequest.getRequestURI().substring(httpRequest.getContextPath().length());
            String cacheKey = generateCacheKey(httpRequest);
            
            // Check cache first for this exact path
            Boolean isPublic = pathMatchCache.get(path);
            
            if (isPublic == null) {
                // Not in cache, check if it matches any public path pattern
                isPublic = isPublicPath(path);
                
                // Cache the result (limit cache size to prevent memory issues)
                if (pathMatchCache.size() < 1000) {
                    pathMatchCache.put(path, isPublic);
                }
            } else if (performanceMonitor != null) {
                // Record cache hit in metrics
                performanceMonitor.recordPathCacheHit();
            }
            
            if (isPublic) {
                // Fast path for public endpoints - bypass enforcement
                log.debug("Public path detected, bypassing policy enforcement: {}", path);
                
                if (performanceMonitor != null) {
                    performanceMonitor.recordPublicRequest();
                }
                
                // Check if we have a cached response for this public path
                Cache responseCache = cacheManager.getCache("publicResponses");
                CachedResponse cachedResponse = responseCache != null ? responseCache.get(cacheKey, CachedResponse.class) : null;
                
                if (cachedResponse != null) {
                    // We have a cached response, return it directly
                    log.debug("Serving cached response for public path: {}", path);
                    cachedResponse.writeTo(httpResponse);
                    return;
                }
                
                // No cached response, wrap the response to capture it
                ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(httpResponse);
                
                // Process the request
                chain.doFilter(request, responseWrapper);
                
                // Only cache successful responses (2xx status codes)
                int status = responseWrapper.getStatus();
                if (status >= 200 && status < 300 && isResponseCacheable(httpRequest, responseWrapper)) {
                    // Create a cached response
                    CachedResponse newCachedResponse = new CachedResponse(
                            status,
                            null,
                            responseWrapper.getContentAsByteArray(),
                            responseWrapper.getContentType()
                    );
                    
                    // Add headers to the cached response
                    for (String headerName : responseWrapper.getHeaderNames()) {
                        // Skip headers that shouldn't be cached
                        if ("Transfer-Encoding".equalsIgnoreCase(headerName) ||
                            "Connection".equalsIgnoreCase(headerName)) {
                            continue;
                        }
                        newCachedResponse.addHeader(headerName, responseWrapper.getHeader(headerName));
                    }
                    
                    // Store in cache
                    if (responseCache != null) {
                        responseCache.put(cacheKey, newCachedResponse);
                        
                        // Track this cache key for invalidation purposes
                        trackCacheKey(path, cacheKey);
                    }
                }
                
                // Complete the response
                responseWrapper.copyBodyToResponse();
                return;
            }
            
            if (performanceMonitor != null) {
                performanceMonitor.recordProtectedRequest();
            }
            
            // For protected paths, proceed with normal enforcement
            super.doFilter(request, response, chain);
        } finally {
            // Stop timing and record the metric
            if (performanceMonitor != null && sample != null) {
                performanceMonitor.stopPolicyEnforcementTimer(sample);
            }
        }
    }
    
    /**
     * Determines if a path matches any of the public path patterns
     */
    private boolean isPublicPath(String path) {
        // First check exact matches for common endpoints
        for (String prefix : PUBLIC_PATH_PREFIXES) {
            if (prefix.endsWith("/")) {
                if (path.startsWith(prefix)) {
                    return true;
                }
            } else if (path.equals(prefix)) {
                return true;
            }
        }
        
        // Then check regex patterns for more complex matches
        for (Map.Entry<Pattern, Boolean> entry : patternCache.entrySet()) {
            if (entry.getKey().matcher(path).matches()) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generates a cache key for the request
     */
    private String generateCacheKey(HttpServletRequest request) {
        StringBuilder keyBuilder = new StringBuilder();
        
        // Include the request URI
        keyBuilder.append(request.getRequestURI());
        
        // Include query string if present
        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isEmpty()) {
            keyBuilder.append('?').append(queryString);
        }
        
        // Include accept header for content negotiation
        String acceptHeader = request.getHeader("Accept");
        if (acceptHeader != null && !acceptHeader.isEmpty()) {
            keyBuilder.append("::accept=").append(acceptHeader);
        }
        
        return keyBuilder.toString();
    }
    
    /**
     * Determines if a response is cacheable
     */
    private boolean isResponseCacheable(HttpServletRequest request, ContentCachingResponseWrapper response) {
        // Don't cache responses for non-GET requests
        if (!"GET".equals(request.getMethod())) {
            return false;
        }
        
        // Don't cache responses with Cache-Control: no-store, no-cache, or private
        String cacheControl = response.getHeader("Cache-Control");
        if (cacheControl != null && 
            (cacheControl.contains("no-store") || 
             cacheControl.contains("no-cache") || 
             cacheControl.contains("private"))) {
            return false;
        }
        
        // Don't cache responses with Set-Cookie headers (likely personalized)
        if (response.getHeader("Set-Cookie") != null) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Tracks a cache key for a given path to enable targeted invalidation
     */
    private void trackCacheKey(String path, String cacheKey) {
        // Track by path prefix for more targeted invalidation
        for (String prefix : PUBLIC_PATH_PREFIXES) {
            if (path.startsWith(prefix)) {
                pathPrefixToCacheKeys.computeIfAbsent(prefix, k -> new HashSet<>()).add(cacheKey);
                break;
            }
        }
        
        // Also track by the exact path
        pathPrefixToCacheKeys.computeIfAbsent(path, k -> new HashSet<>()).add(cacheKey);
    }
    
    /**
     * Invalidates all cached responses
     */
    public void invalidateAllCachedResponses() {
        Cache responseCache = cacheManager.getCache("publicResponses");
        if (responseCache != null) {
            responseCache.clear();
            pathPrefixToCacheKeys.clear();
            log.info("Invalidated all cached responses");
        }
    }
    
    /**
     * Invalidates cached responses for a specific path prefix
     * @param pathPrefix The path prefix to invalidate (e.g., "/products/get")
     */
    public void invalidateCachedResponsesByPathPrefix(String pathPrefix) {
        Cache responseCache = cacheManager.getCache("publicResponses");
        if (responseCache != null) {
            Set<String> keysToInvalidate = pathPrefixToCacheKeys.get(pathPrefix);
            if (keysToInvalidate != null) {
                int count = 0;
                for (String key : keysToInvalidate) {
                    responseCache.evict(key);
                    count++;
                }
                keysToInvalidate.clear();
                log.info("Invalidated {} cached responses for path prefix: {}", count, pathPrefix);
            }
        }
    }
    
    /**
     * Invalidates cached responses for a specific URL
     * @param url The exact URL to invalidate
     */
    public void invalidateCachedResponseByUrl(String url) {
        Cache responseCache = cacheManager.getCache("publicResponses");
        if (responseCache != null) {
            // First try exact match
            responseCache.evict(url);
            
            // Then check if we're tracking this URL with query parameters
            Set<String> keysToInvalidate = pathPrefixToCacheKeys.get(url);
            if (keysToInvalidate != null) {
                for (String key : keysToInvalidate) {
                    responseCache.evict(key);
                }
                keysToInvalidate.clear();
                log.info("Invalidated cached responses for URL: {}", url);
            }
        }
    }
    
    /**
     * Scheduled task to periodically clean up expired cache entries
     * Runs every hour by default
     */
    @Scheduled(fixedRateString = "${keycloak.cache.cleanup.interval:3600000}")
    public void cleanupExpiredCacheEntries() {
        // The actual cleanup is handled by EHCache based on TTL settings
        // This method is mainly for logging and metrics
        log.info("Scheduled cache cleanup executed");
        
        // Update metrics if available
        if (performanceMonitor != null) {
            Cache responseCache = cacheManager.getCache("publicResponses");
            if (responseCache != null) {
                // Count remaining entries in our tracking map as an approximation
                int totalTrackedKeys = 0;
                for (Set<String> keys : pathPrefixToCacheKeys.values()) {
                    totalTrackedKeys += keys.size();
                }
                log.info("Current response cache tracking {} entries", totalTrackedKeys);
            }
        }
    }
    
    /**
     * Class to store cached HTTP responses
     */
    private static class CachedResponse {
        private final int status;
        private final Map<String, String> headers;
        private final byte[] body;
        private final String contentType;
        
        public CachedResponse(int status, Iterable<String> headerNames, byte[] body, String contentType) {
            this.status = status;
            this.headers = new ConcurrentHashMap<>();
            this.body = body;
            this.contentType = contentType;
            
            // Note: Headers are not stored in this constructor as we don't have access to the response
            // The content type is stored separately and will be set in the writeTo method
        }
        
        // Add a header to the cached response
        public void addHeader(String name, String value) {
            if (name != null && value != null) {
                headers.put(name, value);
            }
        }
        
        public void writeTo(HttpServletResponse response) throws IOException {
            // Set status
            response.setStatus(status);
            
            // Set content type
            if (contentType != null) {
                response.setContentType(contentType);
            }
            
            // Set headers
            for (Map.Entry<String, String> header : headers.entrySet()) {
                if (header.getValue() != null) {
                    response.setHeader(header.getKey(), header.getValue());
                }
            }
            
            // Write body
            if (body != null && body.length > 0) {
                response.setContentLength(body.length);
                response.getOutputStream().write(body);
                response.getOutputStream().flush();
            }
        }
    }
}