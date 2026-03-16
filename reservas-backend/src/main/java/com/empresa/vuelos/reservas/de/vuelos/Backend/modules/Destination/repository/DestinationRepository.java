package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Destination.repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Destination.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
    Optional<Destination> findByCountryCode(String countryCode);
}
