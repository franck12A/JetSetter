package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.config.DuffelProperties;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSegmentResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Duffel Air v2 adapter. Duffel's wire types do not escape this class. */
@lombok.extern.slf4j.Slf4j
@Component
public class DuffelFlightProvider implements FlightProvider {
    private static final String PROVIDER = "duffel";
    private final RestClient restClient;
    private final DuffelProperties properties;

    public DuffelFlightProvider(RestClient duffelRestClient, DuffelProperties properties) {
        this.restClient = duffelRestClient;
        this.properties = properties;
    }

    @Override
    public List<FlightOfferResponse> search(FlightSearchCriteria criteria) {
        JsonNode response;
        try {
            response = restClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/air/offer_requests")
                            .queryParam("return_offers", true).build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        headers.setBearerAuth(properties.requireApiToken());
                        headers.set("Duffel-Version", "v2");
                    })
                    .body(requestBody(criteria))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            log.warn("Duffel rejected a flight search with status {}", ex.getStatusCode().value());
            throw new FlightProviderException("El proveedor de vuelos no pudo procesar la búsqueda.", ex);
        } catch (RestClientException ex) {
            log.warn("Duffel could not be reached while searching flights", ex);
            throw new FlightProviderException("No se pudo contactar al proveedor de vuelos.", ex);
        }

        if (response == null || !response.has("data")) {
            throw new FlightProviderException("El proveedor de vuelos devolvió una respuesta inválida.");
        }
        return mapOffers(response.path("data").path("offers"), Instant.now().toString());
    }

    private Map<String, Object> requestBody(FlightSearchCriteria criteria) {
        List<Map<String, String>> passengers = new ArrayList<>();
        for (int i = 0; i < criteria.passengers(); i++) passengers.add(Map.of("type", "adult"));
        return Map.of("data", Map.of(
                "slices", List.of(Map.of(
                        "origin", criteria.origin(),
                        "destination", criteria.destination(),
                        "departure_date", criteria.departureDate().toString())),
                "passengers", passengers));
    }

    private List<FlightOfferResponse> mapOffers(JsonNode offers, String queriedAt) {
        if (!offers.isArray()) return List.of();
        List<FlightOfferResponse> results = new ArrayList<>();
        for (JsonNode offer : offers) results.add(mapOffer(offer, queriedAt));
        return results;
    }

    private FlightOfferResponse mapOffer(JsonNode offer, String queriedAt) {
        String offerId = requiredText(offer, "id");
        List<FlightSegmentResponse> segments = new ArrayList<>();
        for (JsonNode slice : offer.path("slices")) {
            for (JsonNode segment : slice.path("segments")) segments.add(mapSegment(segment));
        }
        FlightSegmentResponse first = segments.isEmpty() ? null : segments.get(0);
        FlightSegmentResponse last = segments.isEmpty() ? null : segments.get(segments.size() - 1);

        FlightOfferResponse result = new FlightOfferResponse();
        result.setId(PROVIDER + ":" + offerId);
        result.setProvider(PROVIDER);
        result.setExternalId(PROVIDER + ":" + offerId);
        result.setTotalAmount(decimal(offer, "total_amount"));
        result.setCurrency(text(offer, "total_currency"));
        result.setQueriedAt(queriedAt);
        result.setExpiresAt(text(offer, "expires_at"));
        result.setSegments(segments);
        if (first != null) {
            result.setOrigin(first.getOrigin());
            result.setDepartureAt(first.getDepartureAt());
            result.setAirlineName(first.getAirlineName());
            result.setAirlineCode(first.getAirlineCode());
            result.setFlightNumber(first.getFlightNumber());
        }
        if (last != null) {
            result.setDestination(last.getDestination());
            result.setArrivalAt(last.getArrivalAt());
        }
        return result;
    }

    private FlightSegmentResponse mapSegment(JsonNode segment) {
        JsonNode carrier = carrier(segment);
        FlightSegmentResponse result = new FlightSegmentResponse();
        result.setOrigin(text(segment.path("departure"), "iata_code"));
        result.setDestination(text(segment.path("arrival"), "iata_code"));
        result.setDepartureAt(text(segment.path("departure"), "at"));
        result.setArrivalAt(text(segment.path("arrival"), "at"));
        result.setAirlineName(text(carrier, "name"));
        result.setAirlineCode(text(carrier, "iata_code"));
        result.setFlightNumber(text(segment, "marketing_carrier_flight_number"));
        return result;
    }

    private JsonNode carrier(JsonNode segment) {
        JsonNode operating = segment.path("operating_carrier");
        if (!operating.isMissingNode() && !operating.isNull()
                && (operating.hasNonNull("name") || operating.hasNonNull("iata_code"))) {
            return operating;
        }
        return segment.path("marketing_carrier");
    }

    private String requiredText(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) throw new FlightProviderException("El proveedor devolvió una oferta sin identificador.");
        return value;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText(null);
    }

    private double decimal(JsonNode node, String field) {
        try { return Double.parseDouble(text(node, field)); }
        catch (RuntimeException ex) { throw new FlightProviderException("El proveedor devolvió un precio inválido.", ex); }
    }
}
