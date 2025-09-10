package com.project.warehouse_management_system;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@ComponentScan
@EnableJpaAuditing
@SecurityScheme(
		name = "Keycloak",
		openIdConnectUrl = "http://localhost:8081/realms/warehouse-dev/.well-known/openid-configuration",
		scheme = "bearer",
		type = SecuritySchemeType.OPENIDCONNECT,
		in = SecuritySchemeIn.HEADER
)
public class WarehouseManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(WarehouseManagementSystemApplication.class, args);
	}

}
