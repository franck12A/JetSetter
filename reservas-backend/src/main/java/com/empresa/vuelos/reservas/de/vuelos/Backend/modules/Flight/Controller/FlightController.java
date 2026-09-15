package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.service.FlightSearchService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightController {
    private final FlightSearchService flightSearchService;

    public FlightController(FlightSearchService flightSearchService) {
        this.flightSearchService = flightSearchService;
    }

    @GetMapping("/search")
    public List<FlightOfferResponse> search(
            @RequestParam(name = "origen", required = false) String origen,
            @RequestParam(name = "origin", required = false) String origin,
            @RequestParam(name = "destino", required = false) String destino,
            @RequestParam(name = "destination", required = false) String destination,
            @RequestParam(name = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(name = "departureDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate,
            @RequestParam(name = "pasajeros", defaultValue = "1") int pasajeros) {
        return flightSearchService.search(new FlightSearchCriteria(
                firstNonBlank(origen, origin),
                firstNonBlank(destino, destination),
                fecha != null ? fecha : departureDate,
                pasajeros));
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }
}
