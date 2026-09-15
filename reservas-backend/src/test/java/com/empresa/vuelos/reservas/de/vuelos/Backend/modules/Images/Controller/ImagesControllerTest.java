package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.DTO.ImageResultDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Service.UnsplashImageService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ImagesControllerTest {
    @Test
    void acceptsExistingCityCountryAndQueryRequests() throws Exception {
        UnsplashImageService service = mock(UnsplashImageService.class);
        ImageResultDTO image = image();
        when(service.getCountryImages("France", "Paris", "Paris France travel", 1)).thenReturn(List.of(image));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ImagesController(service)).build();

        mvc.perform(get("/api/images/country")
                        .param("country", "France")
                        .param("city", "Paris")
                        .param("query", "Paris France travel")
                        .param("count", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].url").value("https://images.example/paris.jpg"));

        verify(service).getCountryImages(eq("France"), eq("Paris"), eq("Paris France travel"), eq(1));
    }

    @Test
    void usesTheCatalogSpecificQueryWhenNoQueryIsProvided() throws Exception {
        UnsplashImageService service = mock(UnsplashImageService.class);
        when(service.getCountryImages("France", "Paris", "Paris France landmark travel", 1)).thenReturn(List.of());
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ImagesController(service)).build();

        mvc.perform(get("/api/images/country")
                        .param("country", "France")
                        .param("city", "Paris")
                        .param("count", "1"))
                .andExpect(status().isOk());

        verify(service).getCountryImages(
                eq("France"), eq("Paris"), eq("Paris France landmark travel"), eq(1));
    }

    @Test
    void displayNamesResolveToCanonicalSearchMetadata() throws Exception {
        UnsplashImageService service = mock(UnsplashImageService.class);
        when(service.getCountryImages("France", "Paris", "Paris France landmark travel", 1)).thenReturn(List.of());
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ImagesController(service)).build();

        mvc.perform(get("/api/images/country")
                        .param("country", "Francia")
                        .param("city", "París")
                        .param("count", "1"))
                .andExpect(status().isOk());

        verify(service).getCountryImages(
                eq("France"), eq("Paris"), eq("Paris France landmark travel"), eq(1));
    }

    @Test
    void remainsCompatibleWithCountryOnlyRequests() throws Exception {
        UnsplashImageService service = mock(UnsplashImageService.class);
        when(service.getCountryImages("France", "France travel", 1)).thenReturn(List.of());
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ImagesController(service)).build();

        mvc.perform(get("/api/images/country")
                        .param("country", "France")
                        .param("query", "France travel")
                        .param("count", "1"))
                .andExpect(status().isOk());

        verify(service).getCountryImages(eq("France"), eq("France travel"), eq(1));
    }

    private ImageResultDTO image() {
        ImageResultDTO image = new ImageResultDTO();
        image.setUrl("https://images.example/paris.jpg");
        return image;
    }
}
