package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightSearchCriteria;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.FlightProvider;
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
        FlightProvider provider = mock(FlightProvider.class);
        FlightSearchService service = new FlightSearchService(provider);
        FlightSearchCriteria criteria = new FlightSearchCriteria("eze", "mad", LocalDate.of(2026, 12, 10), 2);
        FlightOfferResponse offer = new FlightOfferResponse();
        offer.setExternalId("flightapi:it_123");
        when(provider.search(criteria)).thenReturn(List.of(offer));

        List<FlightOfferResponse> result = service.search(criteria);

        assertThat(result).containsExactly(offer);
        verify(provider).search(criteria);
    }
}
