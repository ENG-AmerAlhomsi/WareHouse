package com.project.warehouse_management_system.config.keycloakConfig;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
class KeycloakSecurityUtilTest {
    
    @Mock
    private KeycloakSecurityUtil keycloakSecurityUtil;
    
    @Test
    void contextLoads() {
        // Just verify the context loads successfully
        assertNotNull(keycloakSecurityUtil);
    }
}
