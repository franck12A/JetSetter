package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Amadeus.support;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class FlightIdentityUtils {

    private static final Pattern PREFixed_FLIGHT_PATTERN = Pattern.compile("^([A-Z]{2})(\\d{1,4})$");
    private static final List<String> DEFAULT_CODES = List.of("AR", "IB", "LA", "AF", "AZ", "KL", "LH", "UX");
    private static final Map<String, String> AIRLINE_NAMES_BY_CODE;
    private static final Map<String, String> CODE_BY_NAME;

    static {
        Map<String, String> airlineNames = new LinkedHashMap<>();
        airlineNames.put("AR", "Aerolineas Argentinas");
        airlineNames.put("IB", "Iberia");
        airlineNames.put("LA", "LATAM");
        airlineNames.put("AF", "Air France");
        airlineNames.put("AZ", "ITA Airways");
        airlineNames.put("KL", "KLM");
        airlineNames.put("LH", "Lufthansa");
        airlineNames.put("UX", "Air Europa");
        airlineNames.put("AA", "American Airlines");
        airlineNames.put("DL", "Delta Air Lines");
        airlineNames.put("UA", "United Airlines");
        airlineNames.put("AC", "Air Canada");
        AIRLINE_NAMES_BY_CODE = Collections.unmodifiableMap(airlineNames);

        Map<String, String> codeByName = new LinkedHashMap<>();
        airlineNames.forEach((code, name) -> codeByName.put(normalizeKey(name), code));
        CODE_BY_NAME = Collections.unmodifiableMap(codeByName);
    }

    private FlightIdentityUtils() {
    }

    public static FlightIdentity resolve(Object carrierCandidate, Object airlineCandidate, Object flightNumberCandidate, String seed) {
        String seedValue = safeSeed(seed);
        String carrierCode = resolveCarrierCode(firstNonBlank(carrierCandidate, airlineCandidate, flightNumberCandidate), seedValue);
        String airlineName = resolveAirlineName(firstNonBlank(airlineCandidate, carrierCandidate), carrierCode);
        String flightNumber = resolveFlightNumber(carrierCode, flightNumberCandidate, seedValue);
        return new FlightIdentity(carrierCode, airlineName, flightNumber);
    }

    public static Map<String, Object> normalizeSegment(Map<String, Object> rawSegment, String seed) {
        Map<String, Object> normalized = new LinkedHashMap<>();
        if (rawSegment != null) {
            normalized.putAll(rawSegment);
        }

        FlightIdentity identity = resolve(
                normalized.get("codigoAerolinea"),
                normalized.get("aerolinea"),
                normalized.get("numeroVuelo"),
                seed
        );

        normalized.put("codigoAerolinea", identity.getCarrierCode());
        normalized.put("aerolinea", identity.getAirlineName());
        normalized.put("numeroVuelo", identity.getFlightNumber());
        return normalized;
    }

    public static List<Map<String, Object>> normalizeSegments(List<Map<String, Object>> rawSegments, String seed) {
        List<Map<String, Object>> normalized = new ArrayList<>();
        if (rawSegments == null) {
            return normalized;
        }

        for (int index = 0; index < rawSegments.size(); index++) {
            normalized.add(normalizeSegment(rawSegments.get(index), safeSeed(seed) + ":" + index));
        }

        return normalized;
    }

    public static String resolveCarrierCode(Object candidate, String seed) {
        String normalized = normalizeCarrierCode(candidate);
        if (normalized != null) {
            return normalized;
        }
        return pickCarrierCode(seed);
    }

    public static String resolveAirlineName(Object airlineCandidate, String fallbackCarrierCode) {
        if (airlineCandidate != null) {
            String raw = String.valueOf(airlineCandidate).trim();
            if (!raw.isEmpty()) {
                String resolvedCode = normalizeCarrierCode(raw);
                if (resolvedCode != null) {
                    return AIRLINE_NAMES_BY_CODE.getOrDefault(resolvedCode, raw);
                }
                return raw;
            }
        }

        return AIRLINE_NAMES_BY_CODE.getOrDefault(fallbackCarrierCode, "Aerolinea a confirmar");
    }

    public static String resolveFlightNumber(String carrierCode, Object flightNumberCandidate, String seed) {
        String effectiveCode = resolveCarrierCode(carrierCode, seed);
        String digits = "";

        if (flightNumberCandidate != null) {
            String raw = String.valueOf(flightNumberCandidate).trim().toUpperCase(Locale.ROOT);
            if (!raw.isEmpty()) {
                Matcher prefixed = PREFixed_FLIGHT_PATTERN.matcher(raw);
                if (prefixed.matches()) {
                    effectiveCode = resolveCarrierCode(prefixed.group(1), seed);
                    digits = prefixed.group(2);
                } else {
                    digits = raw.replaceAll("\\D+", "");
                }
            }
        }

        if (digits.length() > 4) {
            digits = digits.substring(digits.length() - 4);
        }

        if (digits.isEmpty()) {
            int hash = Math.abs(Objects.hash(safeSeed(seed), effectiveCode));
            if ((hash & 1) == 0) {
                digits = String.format(Locale.ROOT, "%03d", 100 + (hash % 900));
            } else {
                digits = String.format(Locale.ROOT, "%04d", 1000 + (hash % 9000));
            }
        } else if (digits.length() < 3) {
            digits = String.format(Locale.ROOT, "%03d", Integer.parseInt(digits));
        }

        return effectiveCode + digits;
    }

    private static String normalizeCarrierCode(Object candidate) {
        if (candidate == null) {
            return null;
        }

        String raw = String.valueOf(candidate).trim();
        if (raw.isEmpty()) {
            return null;
        }

        String upper = raw.toUpperCase(Locale.ROOT);
        Matcher prefixed = PREFixed_FLIGHT_PATTERN.matcher(upper);
        if (prefixed.matches()) {
            return prefixed.group(1);
        }

        if (AIRLINE_NAMES_BY_CODE.containsKey(upper)) {
            return upper;
        }

        String normalizedName = normalizeKey(raw);
        if (CODE_BY_NAME.containsKey(normalizedName)) {
            return CODE_BY_NAME.get(normalizedName);
        }

        if (upper.length() == 2 && upper.chars().allMatch(Character::isLetter)) {
            return upper;
        }

        return null;
    }

    private static String pickCarrierCode(String seed) {
        int hash = Math.abs(Objects.hash(safeSeed(seed)));
        return DEFAULT_CODES.get(hash % DEFAULT_CODES.size());
    }

    private static String firstNonBlank(Object... candidates) {
        if (candidates == null) {
            return null;
        }

        for (Object candidate : candidates) {
            if (candidate == null) {
                continue;
            }
            String raw = String.valueOf(candidate).trim();
            if (!raw.isEmpty()) {
                return raw;
            }
        }

        return null;
    }

    private static String normalizeKey(String value) {
        return String.valueOf(value == null ? "" : value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private static String safeSeed(String seed) {
        return seed == null ? "" : seed;
    }

    public static final class FlightIdentity {
        private final String carrierCode;
        private final String airlineName;
        private final String flightNumber;

        public FlightIdentity(String carrierCode, String airlineName, String flightNumber) {
            this.carrierCode = carrierCode;
            this.airlineName = airlineName;
            this.flightNumber = flightNumber;
        }

        public String getCarrierCode() {
            return carrierCode;
        }

        public String getAirlineName() {
            return airlineName;
        }

        public String getFlightNumber() {
            return flightNumber;
        }
    }
}
