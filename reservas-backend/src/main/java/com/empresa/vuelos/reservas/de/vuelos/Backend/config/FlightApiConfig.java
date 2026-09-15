package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(FlightApiProperties.class)
public class FlightApiConfig {
    @Bean
    RestClient flightApiRestClient(RestClient.Builder builder, FlightApiProperties properties) {
        return builder.baseUrl(properties.normalizedBaseUrl()).build();
    }
}