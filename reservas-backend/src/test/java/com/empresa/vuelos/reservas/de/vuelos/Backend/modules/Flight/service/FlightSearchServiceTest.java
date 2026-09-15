package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.FlightApiProvider;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.MockFlightProvider;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FlightSearchServiceTest {
    @Test
    void delegatesTheProviderNeutralCriteriaToTheProvider() {
        FlightApiProvider provider = mock(FlightApiProvider.class);
        MockFlightProvider mockProvider = mock(MockFlightProvider.class);
        FlightSearchService service = new FlightSearchService(provider, mockProvider);
        FlightSearchCriteria criteria = new FlightSearchCriteria("eze", "mad", LocalDate.of(2026, 12, 10), 2);
        FlightOfferResponse offer = new FlightOfferResponse();
        offer.setExternalId("flightapi:it_123");
        offer.setProvider("flightapi");
        offer.setOrigin("EZE");
        offer.setDestination("MAD");
        offer.setDepartureAt("2026-12-10T10:00:00");
        offer.setSegments(List.of(new com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSegmentResponse()));
        when(provider.search(criteria)).thenReturn(List.of(offer));

        List<FlightOfferResponse> result = service.search(criteria);

        assertThat(result).containsExactly(offer);
        verify(provider).search(criteria);
    }

    @Test
    void usesMockProviderWhenFlightApiFails() {
        FlightApiProvider provider = mock(FlightApiProvider.class);
        MockFlightProvider mockProvider = mock(MockFlightProvider.class);
        FlightSearchService service = new FlightSearchService(provider, mockProvider);
        FlightSearchCriteria criteria = new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 1);
        FlightOfferResponse mockOffer = new FlightOfferResponse();
        mockOffer.setProvider("mock");

        when(provider.search(criteria)).thenThrow(new RuntimeException("provider unavailable"));
        when(mockProvider.search(criteria)).thenReturn(List.of(mockOffer));

        assertThat(service.search(criteria)).containsExactly(mockOffer);
        verify(mockProvider).search(criteria);
    }

    @Test
    void usesMockProviderWhenFlightApiReturnsNoUsableOffers() {
        FlightApiProvider provider = mock(FlightApiProvider.class);
        MockFlightProvider mockProvider = mock(MockFlightProvider.class);
        FlightSearchService service = new FlightSearchService(provider, mockProvider);
        FlightSearchCriteria criteria = new FlightSearchCriteria("EZE", "MAD", LocalDate.of(2026, 12, 10), 1);
        FlightOfferResponse mockOffer = new FlightOfferResponse();
        mockOffer.setProvider("mock");

        when(provider.search(criteria)).thenReturn(List.of());
        when(mockProvider.search(criteria)).thenReturn(List.of(mockOffer));

        assertThat(service.search(criteria)).containsExactly(mockOffer);
        verify(mockProvider).search(criteria);
    }
}
