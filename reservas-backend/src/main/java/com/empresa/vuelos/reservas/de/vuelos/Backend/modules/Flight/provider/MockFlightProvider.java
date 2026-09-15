package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSegmentResponse;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.IntStream;

@Component
public class MockFlightProvider implements FlightProvider {
    private static final String PROVIDER = "mock";
    private static final String[] AIRLINES = {
            "JetSetter Demo", "Skyline Airways", "Horizonte Air",
            "Atlas Wings", "Rio Plata Airlines", "Northstar Flights"
    };
    private static final String[] AIRLINE_CODES = { "JS", "SK", "HZ", "AT", "RP", "NS" };
    private static final int[] DEPARTURE_OFFSETS = { 0, 75, 150, 270, 390, 540 };
    private static final int[] DURATIONS_MINUTES = { 145, 180, 215, 260, 320, 390 };

    @Override
    public List<FlightOfferResponse> search(FlightSearchCriteria criteria) {
        String queriedAt = Instant.now().toString();
        return IntStream.range(0, AIRLINES.length)
                .mapToObj(index -> createOffer(criteria, index, queriedAt))
                .toList();
    }

    private FlightOfferResponse createOffer(FlightSearchCriteria criteria, int index, String queriedAt) {
        LocalDateTime departure = criteria.departureDate()
                .atTime(LocalTime.of(6, 0))
                .plusMinutes(DEPARTURE_OFFSETS[index]);
        LocalDateTime arrival = departure.plusMinutes(DURATIONS_MINUTES[index]);
        String flightId = String.format(
                "%s-%s-%s-%d", criteria.origin(), criteria.destination(), criteria.departureDate(), index + 1);
        String airlineCode = AIRLINE_CODES[index];
        String flightNumber = airlineCode + (410 + index * 137);

        FlightSegmentResponse segment = new FlightSegmentResponse();
        segment.setOrigin(criteria.origin());
        segment.setDestination(criteria.destination());
        segment.setDepartureAt(departure.toString());
        segment.setArrivalAt(arrival.toString());
        segment.setAirlineName(AIRLINES[index]);
        segment.setAirlineCode(airlineCode);
        segment.setFlightNumber(flightNumber);

        FlightOfferResponse offer = new FlightOfferResponse();
        offer.setId(PROVIDER + ":" + flightId);
        offer.setProvider(PROVIDER);
        offer.setExternalId(PROVIDER + ":" + flightId);
        offer.setOrigin(criteria.origin());
        offer.setDestination(criteria.destination());
        offer.setDepartureAt(departure.toString());
        offer.setArrivalAt(arrival.toString());
        offer.setAirlineName(AIRLINES[index]);
        offer.setAirlineCode(airlineCode);
        offer.setFlightNumber(flightNumber);
        offer.setTotalAmount(185.0 + (index * 67.5) + (criteria.passengers() * 32.0));
        offer.setCurrency("USD");
        offer.setQueriedAt(queriedAt);
        offer.setExpiresAt(departure.minusHours(2).toString());
        offer.setSegments(List.of(segment));
        return offer;
    }
}
