package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Category.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String icon;         // 🔥 Renombrado para coincidir con el front
    private String name;
    private String description;
    private String imageUrl;

    public Category() {}

    public Category(String name, String description, String icon, String imageUrl) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.imageUrl = imageUrl;
    }

    // --- GETTERS / SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
