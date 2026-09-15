package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.config.DuffelProperties;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class DuffelFlightProviderTest {
    @Test
    void createsTheCurrentDuffelOfferRequestAndMapsItToJetSetterDtos() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://duffel.test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        DuffelProperties properties = new DuffelProperties();
        properties.setApiToken("test-token");
        DuffelFlightProvider provider = new DuffelFlightProvider(builder.build(), properties);

        server.expect(requestTo("http://duffel.test/air/offer_requests?return_offers=true"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-token"))
                .andExpect(header("Duffel-Version", "v2"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {"data":{"slices":[{"origin":"EZE","destination":"MAD","departure_date":"2026-12-10"}],"passengers":[{"type":"adult"},{"type":"adult"}]}}
                        """))
                .andRespond(withSuccess("""
                        {"data":{"offers":[{"id":"off_123","total_amount":"456.78","total_currency":"USD","expires_at":"2026-12-10T12:00:00Z","slices":[{"segments":[{"departure":{"iata_code":"EZE","at":"2026-12-10T10:00:00"},"arrival":{"iata_code":"MAD","at":"2026-12-10T20:00:00"},"operating_carrier":{"iata_code":"IB","name":"Iberia"},"marketing_carrier_flight_number":"6840"}]}]}]}}
                        """, MediaType.APPLICATION_JSON));

        List<FlightOfferResponse> offers = provider.search(
                new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 2));

        assertThat(offers).hasSize(1);
        FlightOfferResponse offer = offers.get(0);
        assertThat(offer.getProvider()).isEqualTo("duffel");
        assertThat(offer.getExternalId()).isEqualTo("duffel:off_123");
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
}
