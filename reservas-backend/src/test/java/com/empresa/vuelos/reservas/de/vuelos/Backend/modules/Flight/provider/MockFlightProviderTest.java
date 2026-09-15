package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MockFlightProviderTest {
    @Test
    void generatesInMemoryDemoOffersUsingTheSearchCriteria() {
        MockFlightProvider provider = new MockFlightProvider();
        FlightSearchCriteria criteria = new FlightSearchCriteria(
                "EZE", "MAD", LocalDate.of(2026, 12, 10), 3);

        List<FlightOfferResponse> offers = provider.search(criteria);

        assertThat(offers).hasSizeBetween(5, 8);
        assertThat(offers).allSatisfy(offer -> {
            assertThat(offer.getProvider()).isEqualTo("mock");
            assertThat(offer.getOrigin()).isEqualTo("EZE");
            assertThat(offer.getDestination()).isEqualTo("MAD");
            assertThat(offer.getDepartureAt()).startsWith("2026-12-10T");
            assertThat(offer.getCurrency()).isEqualTo("USD");
            assertThat(offer.getSegments()).hasSize(1);
        });
    }
}
