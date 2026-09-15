package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(DuffelProperties.class)
public class DuffelConfig {
    @Bean
    RestClient duffelRestClient(RestClient.Builder builder, DuffelProperties properties) {
        return builder.baseUrl(properties.normalizedBaseUrl()).build();
    }
}
