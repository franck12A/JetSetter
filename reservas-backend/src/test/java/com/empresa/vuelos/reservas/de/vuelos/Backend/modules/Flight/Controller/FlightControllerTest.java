package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.config.ApiExceptionHandler;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.api.FlightOfferResponse;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.service.FlightSearchService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FlightControllerTest {
    @Test
    void exposesTheNewSearchEndpointUsingJetSetterDtos() throws Exception {
        FlightSearchService service = mock(FlightSearchService.class);
        FlightOfferResponse offer = new FlightOfferResponse();
        offer.setId("duffel:off_123");
        offer.setProvider("duffel");
        offer.setExternalId("duffel:off_123");
        when(service.search(any())).thenReturn(List.of(offer));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FlightController(service))
                .setControllerAdvice(new ApiExceptionHandler()).build();

        mvc.perform(get("/api/flights/search")
                        .param("origen", "EZE")
                        .param("destino", "MAD")
                        .param("fecha", "2026-12-10")
                        .param("pasajeros", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].provider").value("duffel"))
                .andExpect(jsonPath("$[0].externalId").value("duffel:off_123"));
    }

    @Test
    void rejectsAnInvalidSearchBeforeCallingTheProvider() throws Exception {
        FlightSearchService service = mock(FlightSearchService.class);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FlightController(service))
                .setControllerAdvice(new ApiExceptionHandler()).build();

        mvc.perform(get("/api/flights/search")
                        .param("origen", "EZE")
                        .param("destino", "MAD")
                        .param("fecha", "2026-12-10")
                        .param("pasajeros", "0"))
                .andExpect(status().isBadRequest());
    }
}
