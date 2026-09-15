package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.FlightProvider;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlightSearchService {
    private final FlightProvider flightProvider;

    public FlightSearchService(FlightProvider flightProvider) {
        this.flightProvider = flightProvider;
    }

    public List<FlightOfferResponse> search(FlightSearchCriteria criteria) {
        return flightProvider.search(criteria);
    }
}
