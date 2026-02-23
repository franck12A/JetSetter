package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.services;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO.FlightOfferDTO;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model.Product;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AmadeusProductMapperService {

    private final ProductRepository productRepository;

    public AmadeusProductMapperService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product saveFromAmadeus(FlightOfferDTO dto) {

        // Si ya existe → devolverlo
        Optional<Product> existente = productRepository.findByExternalId(dto.getId());
        if (existente.isPresent()) {
            return existente.get();
        }

        // Crear nuevo Product
        Product product = new Product();

        product.setExternalId(dto.getId());
        product.setName(dto.getOrigen() + " → " + dto.getDestino());
        product.setDescription("Vuelo automático importado desde Amadeus");

        // Imagen principal
        product.setImage(dto.getImagenPrincipal());

        // Precio total
        product.setPrice(dto.getPrecioTotal());

        // País del destino
        product.setCountry(dto.getPaisDestino());

        // Fecha salida → convertir String -> LocalDateTime
        try {
            product.setDepartureDate(LocalDateTime.parse(dto.getFechaSalida()));
        } catch (Exception e) {
            product.setDepartureDate(LocalDateTime.now());
        }

        // Guardar
        return productRepository.save(product);
    }
}
