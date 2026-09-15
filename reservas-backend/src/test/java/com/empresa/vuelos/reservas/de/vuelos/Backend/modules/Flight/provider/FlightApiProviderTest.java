package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.config.FlightApiProperties;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class FlightApiProviderTest {
    @Test
    void sendsTheDocumentedOnewayPathAndMapsResults() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://flightapi.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        FlightApiProperties properties = propertiesWithKey();
        FlightApiProvider provider = new FlightApiProvider(builder.build(), properties);

        server.expect(requestTo("http://flightapi.test/onewaytrip/test-key/EZE/MAD/2026-12-10/2/0/0/Economy/USD"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "itineraries": [{
                            "id": "it-123",
                            "leg_ids": ["leg-123"],
                            "pricing_options": [{"price": {"amount": 456.78}}]
                          }],
                          "legs": [{
                            "id": "leg-123",
                            "segment_ids": ["seg-123"]
                          }],
                          "segments": [{
                            "id": "seg-123",
                            "origin_place_id": 1,
                            "destination_place_id": 2,
                            "departure": "2026-12-10T10:00:00",
                            "arrival": "2026-12-10T20:00:00",
                            "marketing_flight_number": "6840",
                            "marketing_carrier_id": 99
                          }],
                          "places": [
                            {"id": 1, "iata_code": "EZE"},
                            {"id": 2, "iata_code": "MAD"}
                          ],
                          "carriers": [{"id": 99, "name": "Iberia", "iata_code": "IB"}]
                        }
                        """, MediaType.APPLICATION_JSON));

        List<FlightOfferResponse> offers = provider.search(
                new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 2));

        assertThat(offers).hasSize(1);
        FlightOfferResponse offer = offers.get(0);
        assertThat(offer.getProvider()).isEqualTo("flightapi");
        assertThat(offer.getExternalId()).isEqualTo("flightapi:it-123");
        assertThat(offer.getTotalAmount()).isEqualTo(456.78);
        assertThat(offer.getCurrency()).isEqualTo("USD");
        assertThat(offer.getOrigin()).isEqualTo("EZE");
        assertThat(offer.getDestination()).isEqualTo("MAD");
        assertThat(offer.getSegments()).singleElement().satisfies(segment -> {
            assertThat(segment.getAirlineName()).isEqualTo("Iberia");
            assertThat(segment.getFlightNumber()).isEqualTo("6840");
        });
        server.verify();
    }

    @Test
    void returnsAnEmptyListWhenFlightApiHasNoItineraries() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://flightapi.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        FlightApiProvider provider = new FlightApiProvider(builder.build(), propertiesWithKey());
        server.expect(requestTo("http://flightapi.test/onewaytrip/test-key/EZE/MAD/2026-12-10/1/0/0/Economy/USD"))
                .andRespond(withSuccess("{\"itineraries\":[]}", MediaType.APPLICATION_JSON));

        assertThat(provider.search(new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 1)))
                .isEmpty();
    }

    @Test
    void convertsProviderHttpErrorsToProviderException() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://flightapi.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        FlightApiProvider provider = new FlightApiProvider(builder.build(), propertiesWithKey());
        server.expect(requestTo("http://flightapi.test/onewaytrip/test-key/EZE/MAD/2026-12-10/1/0/0/Economy/USD"))
                .andRespond(withBadRequest());

        assertThatThrownBy(() -> provider.search(
                new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 1)))
                .isInstanceOf(FlightProviderException.class)
                .hasMessage("El proveedor de vuelos no pudo procesar la búsqueda.");
    }

    @Test
    void rejectsMissingApiKeyWithoutCallingTheProvider() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://flightapi.test");
        FlightApiProperties properties = new FlightApiProperties();
        FlightApiProvider provider = new FlightApiProvider(builder.build(), properties);

        assertThatThrownBy(() -> provider.search(
                new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 1)))
                .isInstanceOf(FlightProviderException.class)
                .hasMessage("La integración de vuelos no está configurada.");
    }

    private FlightApiProperties propertiesWithKey() {
        FlightApiProperties properties = new FlightApiProperties();
        properties.setKey("test-key");
        return properties;
    }
}