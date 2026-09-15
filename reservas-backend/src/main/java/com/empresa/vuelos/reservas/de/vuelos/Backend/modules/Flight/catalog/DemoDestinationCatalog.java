package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Flight.catalog;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Single source of truth for demo airport geography, search metadata and UI labels.
 * City and country are canonical values used for technical integrations; displayCity
 * and displayCountry are Spanish UI metadata.
 */
public final class DemoDestinationCatalog {
    public record Destination(
            String airportCode,
            String airportName,
            String city,
            String country,
            String countryCode,
            String displayCity,
            String displayCountry,
            String imageSearchQuery
    ) {}

    private static final List<Destination> DESTINATIONS = List.of(
            destination("EZE", "Ministro Pistarini International Airport", "Buenos Aires", "Argentina", "AR", "Buenos Aires", "Argentina", null),
            destination("MAD", "Adolfo Suarez Madrid-Barajas Airport", "Madrid", "Spain", "ES", "Madrid", "España", "Madrid Spain landmark travel"),
            destination("CDG", "Charles de Gaulle Airport", "Paris", "France", "FR", "París", "Francia", "Paris France landmark travel"),
            destination("FCO", "Leonardo da Vinci-Fiumicino Airport", "Rome", "Italy", "IT", "Roma", "Italia", "Rome Italy landmark travel"),
            destination("LHR", "Heathrow Airport", "London", "United Kingdom", "GB", "Londres", "Reino Unido", "London United Kingdom landmark travel"),
            destination("FRA", "Frankfurt Airport", "Frankfurt", "Germany", "DE", "Frankfurt", "Alemania", null),
            destination("LIS", "Humberto Delgado Airport", "Lisbon", "Portugal", "PT", "Lisboa", "Portugal", null),
            destination("AMS", "Amsterdam Airport Schiphol", "Amsterdam", "Netherlands", "NL", "Ámsterdam", "Países Bajos", "Amsterdam Netherlands canal travel"),
            destination("ZRH", "Zurich Airport", "Zurich", "Switzerland", "CH", "Zúrich", "Suiza", null),
            destination("VIE", "Vienna International Airport", "Vienna", "Austria", "AT", "Viena", "Austria", "Vienna Austria landmark travel"),
            destination("ATH", "Athens International Airport", "Athens", "Greece", "GR", "Atenas", "Grecia", "Athens Greece landmark travel"),
            destination("IST", "Istanbul Airport", "Istanbul", "Turkey", "TR", "Estambul", "Turquía", "Istanbul Turkey landmark travel"),
            destination("JFK", "John F. Kennedy International Airport", "New York", "United States", "US", "Nueva York", "Estados Unidos", "New York United States landmark travel"),
            destination("YYZ", "Toronto Pearson International Airport", "Toronto", "Canada", "CA", "Toronto", "Canadá", null),
            destination("MEX", "Mexico City International Airport", "Mexico City", "Mexico", "MX", "Ciudad de México", "México", "Mexico City Mexico landmark travel"),
            destination("GRU", "São Paulo-Guarulhos International Airport", "São Paulo", "Brazil", "BR", "São Paulo", "Brasil", "Rio de Janeiro Brazil landmark travel"),
            destination("SCL", "Arturo Merino Benitez International Airport", "Santiago", "Chile", "CL", "Santiago", "Chile", null),
            destination("MVD", "Carrasco International Airport", "Montevideo", "Uruguay", "UY", "Montevideo", "Uruguay", null),
            destination("ASU", "Silvio Pettirossi International Airport", "Asuncion", "Paraguay", "PY", "Asunción", "Paraguay", null),
            destination("LIM", "Jorge Chavez International Airport", "Lima", "Peru", "PE", "Lima", "Perú", null),
            destination("BOG", "El Dorado International Airport", "Bogota", "Colombia", "CO", "Bogotá", "Colombia", null),
            destination("UIO", "Mariscal Sucre International Airport", "Quito", "Ecuador", "EC", "Quito", "Ecuador", null),
            destination("VVI", "Viru Viru International Airport", "Santa Cruz de la Sierra", "Bolivia", "BO", "Santa Cruz de la Sierra", "Bolivia", null),
            destination("SJO", "Juan Santamaria International Airport", "San Jose", "Costa Rica", "CR", "San José", "Costa Rica", null),
            destination("PTY", "Tocumen International Airport", "Panama City", "Panama", "PA", "Ciudad de Panamá", "Panamá", null),
            destination("SDQ", "Las Americas International Airport", "Santo Domingo", "Dominican Republic", "DO", "Santo Domingo", "República Dominicana", null),
            destination("NRT", "Narita International Airport", "Tokyo", "Japan", "JP", "Tokio", "Japón", "Tokyo Japan landmark travel"),
            destination("ICN", "Incheon International Airport", "Seoul", "South Korea", "KR", "Seúl", "Corea del Sur", null),
            destination("PEK", "Beijing Capital International Airport", "Beijing", "China", "CN", "Pekín", "China", "Beijing China landmark travel"),
            destination("BKK", "Suvarnabhumi Airport", "Bangkok", "Thailand", "TH", "Bangkok", "Tailandia", null),
            destination("SIN", "Singapore Changi Airport", "Singapore", "Singapore", "SG", "Singapur", "Singapur", null),
            destination("DPS", "Ngurah Rai International Airport", "Bali", "Indonesia", "ID", "Bali", "Indonesia", "Bali Indonesia beach travel"),
            destination("DEL", "Indira Gandhi International Airport", "New Delhi", "India", "IN", "Nueva Delhi", "India", null),
            destination("DXB", "Dubai International Airport", "Dubai", "United Arab Emirates", "AE", "Dubái", "Emiratos Árabes Unidos", "Dubai United Arab Emirates skyline travel"),
            destination("DOH", "Hamad International Airport", "Doha", "Qatar", "QA", "Doha", "Catar", null),
            destination("TLV", "Ben Gurion Airport", "Tel Aviv", "Israel", "IL", "Tel Aviv", "Israel", null),
            destination("SYD", "Sydney Kingsford Smith Airport", "Sydney", "Australia", "AU", "Sídney", "Australia", null),
            destination("AKL", "Auckland Airport", "Auckland", "New Zealand", "NZ", "Auckland", "Nueva Zelanda", null),
            destination("JNB", "O.R. Tambo International Airport", "Johannesburg", "South Africa", "ZA", "Johannesburgo", "Sudáfrica", null),
            destination("CAI", "Cairo International Airport", "Cairo", "Egypt", "EG", "El Cairo", "Egipto", "Cairo Egypt landmark travel"),
            destination("RAK", "Marrakesh Menara Airport", "Marrakesh", "Morocco", "MA", "Marrakech", "Marruecos", null),
            destination("OSL", "Oslo Airport", "Oslo", "Norway", "NO", "Oslo", "Noruega", null),
            destination("ARN", "Stockholm Arlanda Airport", "Stockholm", "Sweden", "SE", "Estocolmo", "Suecia", null),
            destination("CPH", "Copenhagen Airport", "Copenhagen", "Denmark", "DK", "Copenhague", "Dinamarca", null),
            destination("HEL", "Helsinki Airport", "Helsinki", "Finland", "FI", "Helsinki", "Finlandia", null),
            destination("DUB", "Dublin Airport", "Dublin", "Ireland", "IE", "Dublín", "Irlanda", null),
            destination("WAW", "Warsaw Chopin Airport", "Warsaw", "Poland", "PL", "Varsovia", "Polonia", null),
            destination("PRG", "Vaclav Havel Airport Prague", "Prague", "Czech Republic", "CZ", "Praga", "República Checa", null),
            destination("BUD", "Budapest Ferenc Liszt International Airport", "Budapest", "Hungary", "HU", "Budapest", "Hungría", null),
            destination("ZAG", "Franjo Tudman Airport", "Zagreb", "Croatia", "HR", "Zagreb", "Croacia", null),
            destination("OTP", "Henri Coanda International Airport", "Bucharest", "Romania", "RO", "Bucarest", "Rumania", null)
    );

    private static final Map<String, Destination> BY_IATA = DESTINATIONS.stream()
            .collect(Collectors.toUnmodifiableMap(destination -> destination.airportCode().toUpperCase(Locale.ROOT), Function.identity()));

    private DemoDestinationCatalog() {}

    public static Destination find(String airportCode) {
        if (airportCode == null) return null;
        return BY_IATA.get(airportCode.trim().toUpperCase(Locale.ROOT));
    }

    public static Destination findByLocation(String country, String city) {
        String normalizedCountry = normalize(country);
        String normalizedCity = normalize(city);
        if (normalizedCountry.isBlank() || normalizedCity.isBlank()) return null;

        return DESTINATIONS.stream()
                .filter(destination -> matches(normalizedCountry, destination.country(), destination.displayCountry()))
                .filter(destination -> matches(normalizedCity, destination.city(), destination.displayCity()))
                .findFirst()
                .orElse(null);
    }

    public static List<Destination> all() {
        return DESTINATIONS;
    }

    public static List<Destination> demoDestinations() {
        return DESTINATIONS.stream()
                .filter(destination -> !"EZE".equals(destination.airportCode()))
                .toList();
    }

    private static Destination destination(
            String airportCode,
            String airportName,
            String city,
            String country,
            String countryCode,
            String displayCity,
            String displayCountry,
            String imageSearchQuery
    ) {
        String resolvedQuery = imageSearchQuery == null || imageSearchQuery.isBlank()
                ? city + " " + country + " travel"
                : imageSearchQuery;
        return new Destination(
                airportCode, airportName, city, country, countryCode,
                displayCity, displayCountry, resolvedQuery
        );
    }

    private static boolean matches(String normalizedValue, String canonicalValue, String displayValue) {
        return normalizedValue.equals(normalize(canonicalValue)) || normalizedValue.equals(normalize(displayValue));
    }

    private static String normalize(String value) {
        String text = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
