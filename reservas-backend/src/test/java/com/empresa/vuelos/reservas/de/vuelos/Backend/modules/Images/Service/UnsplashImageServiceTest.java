package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.Service;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Images.DTO.ImageResultDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UnsplashImageServiceTest {
    @Test
    void returnsEmptyListWhenUnsplashFailsSoTheFrontendCanUseItsFallback() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class), anyMap()))
                .thenThrow(new RestClientException("Unsplash unavailable"));
        UnsplashImageService service = service(restTemplate);

        assertThat(service.getCountryImages("France", "Paris", "Paris France landmark travel", 1)).isEmpty();
    }

    @Test
    void cachesSameDestinationSearch() {
        RestTemplate restTemplate = mockEmptyResponseTemplate();
        UnsplashImageService service = service(restTemplate);

        List<ImageResultDTO> first = service.getCountryImages("France", "Paris", "Paris France landmark travel", 1);
        List<ImageResultDTO> second = service.getCountryImages("France", "Paris", "Paris France landmark travel", 1);

        assertThat(first).isEmpty();
        assertThat(second).isEmpty();
        verifyExchangeCount(restTemplate, 1);
    }

    @Test
    void deduplicatesConcurrentRequestsForTheSameDestinationAndQuery() throws Exception {
        RestTemplate restTemplate = mock(RestTemplate.class);
        CountDownLatch firstHttpCallStarted = new CountDownLatch(1);
        CountDownLatch releaseHttpCall = new CountDownLatch(1);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class), anyMap()))
                .thenAnswer(invocation -> {
                    firstHttpCallStarted.countDown();
                    assertThat(releaseHttpCall.await(2, TimeUnit.SECONDS)).isTrue();
                    return ResponseEntity.ok("{\"results\":[]}");
                });
        UnsplashImageService service = service(restTemplate);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<List<ImageResultDTO>> first = executor.submit(
                    () -> service.getCountryImages("France", "Paris", "Paris France landmark travel", 1));
            assertThat(firstHttpCallStarted.await(1, TimeUnit.SECONDS)).isTrue();

            Future<List<ImageResultDTO>> second = executor.submit(
                    () -> service.getCountryImages("France", "Paris", "Paris France landmark travel", 1));
            assertThrows(TimeoutException.class, () -> second.get(100, TimeUnit.MILLISECONDS));

            releaseHttpCall.countDown();
            assertThat(first.get(1, TimeUnit.SECONDS)).isEmpty();
            assertThat(second.get(1, TimeUnit.SECONDS)).isEmpty();
        } finally {
            releaseHttpCall.countDown();
            executor.shutdownNow();
        }

        verifyExchangeCount(restTemplate, 1);
    }

    @Test
    void usesDifferentCacheKeysForDifferentDestinations() {
        RestTemplate restTemplate = mockEmptyResponseTemplate();
        UnsplashImageService service = service(restTemplate);

        service.getCountryImages("France", "Paris", "France travel", 1);
        service.getCountryImages("France", "Lyon", "France travel", 1);

        verifyExchangeCount(restTemplate, 2);
    }

    private UnsplashImageService service(RestTemplate restTemplate) {
        return new UnsplashImageService(restTemplate, new ObjectMapper(), "test-key", "jetsetter-test");
    }

    private RestTemplate mockEmptyResponseTemplate() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class), anyMap()))
                .thenReturn(ResponseEntity.ok("{\"results\":[]}"));
        return restTemplate;
    }

    private void verifyExchangeCount(RestTemplate restTemplate, int count) {
        verify(restTemplate, times(count)).exchange(
                anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(String.class), anyMap());
    }
}
