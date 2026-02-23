package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Product.model;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Setter;

@Entity
public class Feature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    private String name;

    @Setter
    private String icon; // URL del icono o nombre de icono

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getIcon() { return icon; }
}