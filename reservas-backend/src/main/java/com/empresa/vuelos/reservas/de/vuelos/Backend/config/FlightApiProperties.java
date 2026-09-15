package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "flight.api")
public class FlightApiProperties {
    private String baseUrl = "https://api.flightapi.io";
    private String key;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String requireKey() {
        if (key == null || key.isBlank()) {
            throw new IllegalStateException("La integración de vuelos no está configurada.");
        }
        return key.trim();
    }

    public String normalizedBaseUrl() {
        if (baseUrl == null || baseUrl.isBlank()) return "https://api.flightapi.io";
        return baseUrl.replaceFirst("/+$", "");
    }
}