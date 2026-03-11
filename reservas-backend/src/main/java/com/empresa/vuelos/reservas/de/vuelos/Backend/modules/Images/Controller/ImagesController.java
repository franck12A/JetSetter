package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Controller;

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
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int count
    ) {
        int safeCount = Math.min(Math.max(count, 1), 10);
        return unsplashImageService.search(query, safeCount);
    }
}
