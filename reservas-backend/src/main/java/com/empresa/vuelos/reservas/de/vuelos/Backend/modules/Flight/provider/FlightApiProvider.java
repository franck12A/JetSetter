package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.config.FlightApiProperties;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@lombok.extern.slf4j.Slf4j
@Component
public class FlightApiProvider implements FlightProvider {
    private static final String PROVIDER = "flightapi";
    private final RestClient restClient;
    private final FlightApiProperties properties;

    public FlightApiProvider(RestClient flightApiRestClient, FlightApiProperties properties) {
        this.restClient = flightApiRestClient;
        this.properties = properties;
    }

    @Override
    public List<FlightOfferResponse> search(FlightSearchCriteria criteria) {
        final String apiKey;
        try {
            apiKey = properties.requireKey();
        } catch (IllegalStateException ex) {
            throw new FlightProviderException(ex.getMessage());
        }

        JsonNode response;
        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder.pathSegment(
                            "onewaytrip",
                            apiKey,
                            criteria.origin(),
                            criteria.destination(),
                            criteria.departureDate().toString(),
                            String.valueOf(criteria.passengers()),
                            "0",
                            "0",
                            "Economy",
                            "USD").build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            log.warn("FlightAPI rejected a flight search with status {}", ex.getStatusCode().value());
            throw new FlightProviderException("El proveedor de vuelos no pudo procesar la búsqueda.", ex);
        } catch (RestClientException ex) {
            log.warn("FlightAPI could not be reached while searching flights");
            throw new FlightProviderException("No se pudo contactar al proveedor de vuelos.", ex);
        }

        if (response == null || !response.has("itineraries") || !response.path("itineraries").isArray()) {
            return List.of();
        }
        return mapItineraries(response, response.path("itineraries"), Instant.now().toString());
    }

    private List<FlightOfferResponse> mapItineraries(JsonNode response, JsonNode itineraries, String queriedAt) {
        Map<String, JsonNode> legs = indexById(response.path("legs"));
        Map<String, JsonNode> segments = indexById(response.path("segments"));
        Map<String, JsonNode> places = indexById(response.path("places"));
        Map<String, JsonNode> carriers = indexById(response.path("carriers"));
        List<FlightOfferResponse> results = new ArrayList<>();

        for (JsonNode itinerary : itineraries) {
            String itineraryId = text(itinerary, "id");
            if (itineraryId == null || itineraryId.isBlank()) continue;
                List<FlightSegmentResponse> mappedSegments = mapSegments(
                    itinerary, legs, segments, places, carriers);
            FlightOfferResponse offer = mapOffer(itinerary, mappedSegments, queriedAt);
            results.add(offer);
        }
        return results;
    }

    private FlightOfferResponse mapOffer(JsonNode itinerary, List<FlightSegmentResponse> segments, String queriedAt) {
        JsonNode price = firstPricingPrice(itinerary);
        FlightSegmentResponse first = segments.isEmpty() ? null : segments.get(0);
        FlightSegmentResponse last = segments.isEmpty() ? null : segments.get(segments.size() - 1);
        String itineraryId = text(itinerary, "id");

        FlightOfferResponse result = new FlightOfferResponse();
        result.setId(PROVIDER + ":" + itineraryId);
        result.setProvider(PROVIDER);
        result.setExternalId(PROVIDER + ":" + itineraryId);
        result.setTotalAmount(number(price, "amount"));
        result.setCurrency(firstNonBlank(text(price, "currency"), text(itinerary, "currency"), "USD"));
        result.setQueriedAt(queriedAt);
        result.setExpiresAt(text(itinerary, "expires_at"));
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

    private List<FlightSegmentResponse> mapSegments(
            JsonNode itinerary,
            Map<String, JsonNode> legs,
            Map<String, JsonNode> segments,
            Map<String, JsonNode> places,
            Map<String, JsonNode> carriers) {
        List<FlightSegmentResponse> results = new ArrayList<>();
        JsonNode legIds = itinerary.path("leg_ids");
        if (legIds.isArray()) {
            for (JsonNode legId : legIds) {
                JsonNode leg = legs.get(legId.asText());
                if (leg == null) continue;
                JsonNode segmentIds = leg.path("segment_ids");
                if (segmentIds.isArray()) {
                    for (JsonNode segmentId : segmentIds) {
                        JsonNode segment = segments.get(segmentId.asText());
                        if (segment != null) results.add(mapSegment(segment, places, carriers));
                    }
                }
            }
        }
        return results;
    }

    private FlightSegmentResponse mapSegment(JsonNode segment, Map<String, JsonNode> places, Map<String, JsonNode> carriers) {
        JsonNode originPlace = places.get(value(segment, "origin_place_id"));
        JsonNode destinationPlace = places.get(value(segment, "destination_place_id"));
        JsonNode carrier = carriers.get(value(segment, "marketing_carrier_id"));
        FlightSegmentResponse result = new FlightSegmentResponse();
        result.setOrigin(firstNonBlank(text(originPlace, "iata_code"), text(originPlace, "code")));
        result.setDestination(firstNonBlank(text(destinationPlace, "iata_code"), text(destinationPlace, "code")));
        result.setDepartureAt(text(segment, "departure"));
        result.setArrivalAt(text(segment, "arrival"));
        result.setAirlineName(firstNonBlank(text(carrier, "name"), text(carrier, "title")));
        result.setAirlineCode(firstNonBlank(text(carrier, "iata_code"), text(carrier, "code")));
        result.setFlightNumber(text(segment, "marketing_flight_number"));
        return result;
    }

    private Map<String, JsonNode> indexById(JsonNode values) {
        Map<String, JsonNode> indexed = new HashMap<>();
        if (!values.isArray()) return indexed;
        for (JsonNode value : values) {
            String id = text(value, "id");
            if (id != null) indexed.put(id, value);
        }
        return indexed;
    }

    private JsonNode firstPricingPrice(JsonNode itinerary) {
        JsonNode pricingOptions = itinerary.path("pricing_options");
        if (!pricingOptions.isArray() || pricingOptions.isEmpty()) return itinerary.path("price");
        return pricingOptions.get(0).path("price");
    }

    private String value(JsonNode node, String field) {
        return node == null ? "" : text(node, field, "");
    }

    private String text(JsonNode node, String field) {
        return text(node, field, null);
    }

    private String text(JsonNode node, String field, String fallback) {
        if (node == null || node.isMissingNode() || node.isNull()) return fallback;
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? fallback : value.asText(fallback);
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    private String firstNonBlank(String first, String second, String fallback) {
        String value = firstNonBlank(first, second);
        return value == null || value.isBlank() ? fallback : value;
    }

    private double number(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) return 0;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}