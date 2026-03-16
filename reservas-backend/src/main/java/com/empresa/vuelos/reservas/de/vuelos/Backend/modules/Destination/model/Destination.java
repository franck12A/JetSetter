package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Destination.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "destinations")
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 3)
    private String countryCode; // E.g., CAN, ARG, FRA

    @Column(nullable = false)
    private String name; // E.g., Canada, Argentina

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

}
