package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.DTO.ImageResultDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UnsplashImageService {

    private static final String BASE_URL = "https://api.unsplash.com/search/photos";
    private static final int MAX_COUNT = 10;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String accessKey;
    private final String appName;

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Duration cacheTtl = Duration.ofHours(24);

    public UnsplashImageService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${unsplash.access-key:}") String accessKey,
            @Value("${unsplash.app-name:jetsetter}") String appName
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.accessKey = accessKey;
        this.appName = appName;
    }

    public List<ImageResultDTO> search(String query, int count) {
        if (count <= 0) return List.of();
        if (accessKey == null || accessKey.isBlank()) return List.of();

        String trimmedQuery = query == null ? "" : query.trim();
        if (trimmedQuery.isBlank()) return List.of();

        int safeCount = Math.min(Math.max(count, 1), MAX_COUNT);
        String cacheKey = trimmedQuery.toLowerCase(Locale.ROOT) + ":" + safeCount;

        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired(cacheTtl)) {
            return cached.items;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Client-ID " + accessKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = BASE_URL + "?query={query}&per_page={count}&orientation=landscape";
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class,
                    Map.of("query", trimmedQuery, "count", safeCount)
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode results = root.path("results");

            List<ImageResultDTO> items = new ArrayList<>();
            if (results.isArray()) {
                for (JsonNode node : results) {
                    String imageUrl = node.path("urls").path("regular").asText(null);
                    if (imageUrl == null || imageUrl.isBlank()) continue;

                    String authorName = node.path("user").path("name").asText(null);
                    String authorUrl = node.path("user").path("links").path("html").asText(null);

                    ImageResultDTO dto = new ImageResultDTO();
                    dto.setUrl(imageUrl);
                    dto.setAuthor(authorName != null ? authorName : "Unsplash");
                    dto.setAuthorUrl(withUtm(authorUrl));
                    dto.setSourceUrl(withUtm("https://unsplash.com"));
                    items.add(dto);
                }
            }

            List<ImageResultDTO> safeItems = List.copyOf(items);
            cache.put(cacheKey, new CacheEntry(safeItems, Instant.now()));
            return safeItems;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String withUtm(String url) {
        if (url == null || url.isBlank()) return null;
        String utm = "utm_source=" + appName + "&utm_medium=referral";
        if (url.contains("utm_source=")) return url;
        return url + (url.contains("?") ? "&" : "?") + utm;
    }

    private static class CacheEntry {
        private final List<ImageResultDTO> items;
        private final Instant createdAt;

        private CacheEntry(List<ImageResultDTO> items, Instant createdAt) {
            this.items = items;
            this.createdAt = createdAt;
        }

        private boolean isExpired(Duration ttl) {
            return createdAt.plus(ttl).isBefore(Instant.now());
        }
    }
}
