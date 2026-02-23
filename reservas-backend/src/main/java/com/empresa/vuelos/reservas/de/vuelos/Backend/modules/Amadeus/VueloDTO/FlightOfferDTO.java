package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.VueloDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class FlightOfferDTO {

    private String id;
    private String origen;
    private String destino;


    private String paisDestino;
    private Long productId;// carpeta país final

    private String fechaSalida;
    private String fechaLlegada;
    private List<Map<String, Object>> segmentos = new ArrayList<>();

    private String aerolinea;
    private String numeroVuelo;

    private double precioTotal;

    private String country;       // código ISO del país

    private List<String> categorias = new ArrayList<>();
    private List<String> caracteristicas = new ArrayList<>();

    private List<String> imagenesUrls = new ArrayList<>();
    private String imagenPrincipal;
    private List<String> imagenesPais;


    // ------------------------
    //    GETTERS & SETTERS
    // ------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public String getPaisDestino() { return paisDestino; }
    public void setPaisDestino(String paisDestino) { this.paisDestino = paisDestino; }

    public String getFechaSalida() { return fechaSalida; }
    public void setFechaSalida(String fechaSalida) { this.fechaSalida = fechaSalida; }

    public String getFechaLlegada() { return fechaLlegada; }
    public void setFechaLlegada(String fechaLlegada) { this.fechaLlegada = fechaLlegada; }

    public String getAerolinea() { return aerolinea; }
    public void setAerolinea(String aerolinea) { this.aerolinea = aerolinea; }

    public String getNumeroVuelo() { return numeroVuelo; }
    public void setNumeroVuelo(String numeroVuelo) { this.numeroVuelo = numeroVuelo; }

    public double getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(double precioTotal) { this.precioTotal = precioTotal; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }



    // ------------------------
    //        CATEGORÍAS
    // ------------------------

    public List<String> getCategorias() { return categorias; }

    public void setCategorias(List<String> categorias) {
        this.categorias = (categorias != null) ? categorias : new ArrayList<>();
    }

    // 👉 Tu controller usa este método
    public void setCategoria(String categoria) {
        if (categoria != null && !categoria.isBlank()) {
            this.categorias.add(categoria);
        }
    }


    // ------------------------
    //     CARACTERÍSTICAS
    // ------------------------

    public List<String> getCaracteristicas() { return caracteristicas; }

    public void setCaracteristicas(List<String> caracteristicas) {
        this.caracteristicas = (caracteristicas != null) ? caracteristicas : new ArrayList<>();
    }


    // ------------------------
    //          IMÁGENES
    // ------------------------

    public List<String> getImagenesUrls() {
        return imagenesUrls;
    }

    public void setImagenesUrls(List<String> imagenesUrls) {
        this.imagenesUrls = (imagenesUrls != null) ? imagenesUrls : new ArrayList<>();

        // actualizar principal
        if (!this.imagenesUrls.isEmpty()) {
            this.imagenPrincipal = this.imagenesUrls.get(0);
        }
    }

    // 👉 Tu controller llamaba a setImagenes(imagenes)
    public void setImagenes(List<String> imagenes) {
        setImagenesUrls(imagenes);
    }

    public String getImagenPrincipal() {
        if (imagenPrincipal != null) return imagenPrincipal;

        return (imagenesUrls == null || imagenesUrls.isEmpty())
                ? "https://via.placeholder.com/400x300?text=Sin+Imagen"
                : imagenesUrls.get(0);
    }

    public void setImagenPrincipal(String imagenPrincipal) {
        this.imagenPrincipal = imagenPrincipal;
    }


    public List<Map<String, Object>> getSegmentos() {
        return segmentos;
    }

    public void setSegmentos(List<Map<String, Object>> segmentos) {
        this.segmentos = segmentos;
    }

    public List<String> getImagenesPais() {
        return imagenesPais;
    }

    public void setImagenesPais(List<String> imagenesPais) {
        this.imagenesPais = imagenesPais;
    }

}
