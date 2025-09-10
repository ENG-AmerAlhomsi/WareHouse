import Keycloak from 'keycloak-js';

export const keycloakConfig = {
  url: 'http://localhost:8081',
  realm: 'warehouse-dev',
  clientId: 'warehouse-frontend',
};

export const keycloak = new Keycloak(keycloakConfig);