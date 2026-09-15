package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.FlightApiProvider;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.MockFlightProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlightSearchService {
    private static final Logger log = LoggerFactory.getLogger(FlightSearchService.class);
    private final FlightApiProvider flightApiProvider;
    private final MockFlightProvider mockFlightProvider;

    public FlightSearchService(FlightApiProvider flightApiProvider, MockFlightProvider mockFlightProvider) {
        this.flightApiProvider = flightApiProvider;
        this.mockFlightProvider = mockFlightProvider;
    }

    public List<FlightOfferResponse> search(FlightSearchCriteria criteria) {
        try {
            List<FlightOfferResponse> offers = flightApiProvider.search(criteria);
            if (hasUsableOffers(offers)) {
                return offers;
            }
            log.warn("FlightAPI devolvio una respuesta vacia o no utilizable; se usara el proveedor mock.");
        } catch (RuntimeException ex) {
            log.warn("FlightAPI no esta disponible; se usara el proveedor mock: {}", ex.getMessage());
        }

        return mockFlightProvider.search(criteria);
    }

    private boolean hasUsableOffers(List<FlightOfferResponse> offers) {
        return offers != null && offers.stream().anyMatch(offer ->
                offer != null
                        && hasText(offer.getProvider())
                        && hasText(offer.getOrigin())
                        && hasText(offer.getDestination())
                        && hasText(offer.getDepartureAt())
                        && offer.getSegments() != null
                        && !offer.getSegments().isEmpty());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
