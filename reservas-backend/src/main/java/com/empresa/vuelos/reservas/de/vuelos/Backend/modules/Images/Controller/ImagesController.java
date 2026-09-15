package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Controller;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.DTO.ImageResultDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Service.UnsplashImageService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.catalog.DemoDestinationCatalog;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/images")
public class ImagesController {

    private final UnsplashImageService unsplashImageService;

    public ImagesController(UnsplashImageService unsplashImageService) {
        this.unsplashImageService = unsplashImageService;
    }

    @GetMapping("/country")
    public List<ImageResultDTO> getCountryImages(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "6") int count
    ) {
        String safeCountry = country != null && !country.isBlank() ? country.trim() : "";
        String safeCity = city != null && !city.isBlank() ? city.trim() : "";
        DemoDestinationCatalog.Destination destination = DemoDestinationCatalog.findByLocation(safeCountry, safeCity);

        String technicalCountry = destination != null ? destination.country() : safeCountry;
        String technicalCity = destination != null ? destination.city() : safeCity;
        String safeQuery = query != null && !query.isBlank() ? query.trim() : "";
        String searchQuery = !safeQuery.isBlank()
                ? safeQuery
                : destination != null
                        ? destination.imageSearchQuery()
                        : String.join(" ", List.of(technicalCity, technicalCountry, "travel").stream()
                                .filter(value -> !value.isBlank())
                                .toList());

        if (technicalCountry.isBlank() || searchQuery.isBlank()) return List.of();

        int safeCount = Math.min(Math.max(count, 1), 10);
        if (technicalCity.isBlank()) {
            return unsplashImageService.getCountryImages(technicalCountry, searchQuery, safeCount);
        }
        return unsplashImageService.getCountryImages(technicalCountry, technicalCity, searchQuery, safeCount);
    }
}
