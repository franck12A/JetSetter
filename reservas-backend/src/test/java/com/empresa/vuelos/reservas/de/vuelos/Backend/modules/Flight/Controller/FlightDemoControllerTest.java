package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.provider.MockFlightProvider;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FlightDemoControllerTest {
    @Test
    void exposesTheDemoCatalogInMemory() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FlightDemoController(new MockFlightProvider())).build();

        mvc.perform(get("/api/flights/demo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(50)))
                .andExpect(jsonPath("$[0].destinationCity").isNotEmpty())
                .andExpect(jsonPath("$[0].destinationCountry").isNotEmpty())
                .andExpect(jsonPath("$[0].provider").value("mock"));
    }
}