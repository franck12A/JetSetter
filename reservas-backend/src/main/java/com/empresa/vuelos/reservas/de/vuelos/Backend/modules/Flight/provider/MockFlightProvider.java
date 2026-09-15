package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSegmentResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.catalog.DemoDestinationCatalog;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalDate;
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

    public List<FlightOfferResponse> demoCatalog() {
        LocalDate departureDate = LocalDate.now().plusDays(14);
        List<FlightSearchCriteria> routes = DemoDestinationCatalog.demoDestinations().stream()
                .map(destination -> new FlightSearchCriteria("EZE", destination.airportCode(), departureDate, 1))
                .toList();

        return IntStream.range(0, routes.size())
                .mapToObj(index -> createOffer(routes.get(index), index, Instant.now().toString()))
                .toList();
    }

    private FlightOfferResponse createOffer(FlightSearchCriteria criteria, int index, String queriedAt) {
        int variation = index % AIRLINES.length;
        LocalDateTime departure = criteria.departureDate()
                .atTime(LocalTime.of(6, 0))
                .plusMinutes(DEPARTURE_OFFSETS[variation] + (index / AIRLINES.length) * 20L);
        LocalDateTime arrival = departure.plusMinutes(DURATIONS_MINUTES[variation]);
        String flightId = String.format(
                "%s-%s-%s-%d", criteria.origin(), criteria.destination(), criteria.departureDate(), index + 1);
        String airlineCode = AIRLINE_CODES[variation];
        String flightNumber = airlineCode + (410 + index * 137);

        FlightSegmentResponse segment = new FlightSegmentResponse();
        segment.setOrigin(criteria.origin());
        segment.setDestination(criteria.destination());
        segment.setDepartureAt(departure.toString());
        segment.setArrivalAt(arrival.toString());
        segment.setAirlineName(AIRLINES[variation]);
        segment.setAirlineCode(airlineCode);
        segment.setFlightNumber(flightNumber);

        FlightOfferResponse offer = new FlightOfferResponse();
        offer.setId(PROVIDER + ":" + flightId);
        offer.setProvider(PROVIDER);
        offer.setExternalId(PROVIDER + ":" + flightId);
        offer.setOrigin(criteria.origin());
        offer.setDestination(criteria.destination());
        applyLocationMetadata(offer, criteria.origin(), criteria.destination());
        offer.setDepartureAt(departure.toString());
        offer.setArrivalAt(arrival.toString());
        offer.setAirlineName(AIRLINES[variation]);
        offer.setAirlineCode(airlineCode);
        offer.setFlightNumber(flightNumber);
        offer.setDuration(formatDuration(DURATIONS_MINUTES[variation]));
        offer.setStops(0);
        offer.setTotalAmount(185.0 + (index * 67.5) + (criteria.passengers() * 32.0));
        offer.setCurrency("USD");
        offer.setQueriedAt(queriedAt);
        offer.setExpiresAt(departure.minusHours(2).toString());
        offer.setSegments(List.of(segment));
        return offer;
    }

        private void applyLocationMetadata(FlightOfferResponse offer, String originCode, String destinationCode) {
                applyLocationMetadata(offer, originCode, true);
                applyLocationMetadata(offer, destinationCode, false);
        }

        private void applyLocationMetadata(FlightOfferResponse offer, String airportCode, boolean origin) {
                DemoDestinationCatalog.Destination location = DemoDestinationCatalog.find(airportCode);
                if (location == null) return;
                if (origin) {
                        offer.setOriginCity(location.city());
                        offer.setOriginCountry(location.country());
                        offer.setOriginCountryCode(location.countryCode());
                        offer.setOriginAirport(location.airportName());
                } else {
                        offer.setDestinationCity(location.city());
                        offer.setDestinationCountry(location.country());
                        offer.setDestinationCountryCode(location.countryCode());
                        offer.setDestinationAirport(location.airportName());
                }
        }

        private String formatDuration(int minutes) {
                return (minutes / 60) + "h " + (minutes % 60) + "m";
        }
}
