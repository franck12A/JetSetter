package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.MockFlightProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightDemoController {
    private final MockFlightProvider mockFlightProvider;

    public FlightDemoController(MockFlightProvider mockFlightProvider) {
        this.mockFlightProvider = mockFlightProvider;
    }

    @GetMapping("/demo")
    public List<FlightOfferResponse> demo() {
        return mockFlightProvider.demoCatalog();
    }
}