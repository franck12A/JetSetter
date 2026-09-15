package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "duffel")
public class DuffelProperties {
    private String apiToken;
    private String baseUrl = "https://api.duffel.com";

    public String getApiToken() { return apiToken; }
    public void setApiToken(String apiToken) { this.apiToken = apiToken; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String requireApiToken() {
        if (apiToken == null || apiToken.isBlank()) {
            throw new IllegalStateException("La integración de vuelos no está configurada.");
        }
        return apiToken.trim();
    }

    public String normalizedBaseUrl() {
        if (baseUrl == null || baseUrl.isBlank()) return "https://api.duffel.com";
        return baseUrl.replaceFirst("/+$", "");
    }
}
