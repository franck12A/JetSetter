package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.Controller.AmadeusController;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.DTO.ImageResultDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Service.UnsplashImageService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/images")
public class ImagesController {

    private final UnsplashImageService unsplashImageService;

    public ImagesController(UnsplashImageService unsplashImageService) {
        this.unsplashImageService = unsplashImageService;
    }

    @GetMapping("/country")
    public List<ImageResultDTO> getCountryImages(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "6") int count
    ) {
        String safeQuery = query != null && !query.isBlank() ? query.trim() : "";
        String safeCountry = country != null && !country.isBlank() ? country.trim() : "";

        String countryKey = !safeCountry.isBlank() ? safeCountry : safeQuery;
        String searchQuery = !safeQuery.isBlank() ? safeQuery : safeCountry;

        if (countryKey.isBlank() || searchQuery.isBlank()) return List.of();

        if (searchQuery.length() == 3) {
            String mapped = AmadeusController.PAIS_POR_IATA.get(searchQuery.toUpperCase());
            if (mapped != null && !mapped.isBlank()) {
                searchQuery = mapped;
            }
        }

        int safeCount = Math.min(Math.max(count, 1), 10);
        return unsplashImageService.getCountryImages(countryKey, searchQuery, safeCount);
    }
}
