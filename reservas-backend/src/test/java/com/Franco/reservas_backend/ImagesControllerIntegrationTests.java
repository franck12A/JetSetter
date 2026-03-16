package com.Franco.reservas_backend;

import com.empresa.vuelos.reservas.de.vuelos.ReservasDeVuelosApplication;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.DTO.ImageResultDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Service.UnsplashImageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ReservasDeVuelosApplication.class)
@AutoConfigureMockMvc
class ImagesControllerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UnsplashImageService unsplashImageService;

    @Test
    void getCountryImages_returnsImages_forGalleryFlow() throws Exception {
        ImageResultDTO dto = new ImageResultDTO();
        dto.setUrl("https://example.com/img.jpg");
        dto.setAuthor("Autor");
        dto.setAuthorUrl("https://example.com/autor");
        dto.setSourceUrl("https://unsplash.com");

        when(unsplashImageService.getCountryImages(anyString(), anyString(), anyInt()))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/images/country")
                        .param("country", "ARG")
                        .param("query", "Argentina")
                        .param("count", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].url").value("https://example.com/img.jpg"))
                .andExpect(jsonPath("$[0].author").value("Autor"));
    }

    @Test
    void getCountryImages_withoutQuery_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/images/country"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
