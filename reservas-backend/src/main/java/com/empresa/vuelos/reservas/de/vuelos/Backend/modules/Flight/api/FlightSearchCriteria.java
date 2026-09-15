package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api;

import java.time.LocalDate;

/** Provider-neutral input used to search flight offers. */
public record FlightSearchCriteria(String origin, String destination, LocalDate departureDate, int passengers) {
    public FlightSearchCriteria {
        origin = normalizeIata(origin, "origen");
        destination = normalizeIata(destination, "destino");
        if (origin.equals(destination)) {
            throw new IllegalArgumentException("El origen y el destino deben ser diferentes.");
        }
        if (departureDate == null) {
            throw new IllegalArgumentException("La fecha de salida es obligatoria.");
        }
        if (passengers < 1 || passengers > 9) {
            throw new IllegalArgumentException("La cantidad de pasajeros debe estar entre 1 y 9.");
        }
    }

    private static String normalizeIata(String value, String field) {
        if (value == null || !value.trim().matches("(?i)[A-Z]{3}")) {
            throw new IllegalArgumentException("El " + field + " debe ser un código IATA de 3 letras.");
        }
        return value.trim().toUpperCase();
    }
}
