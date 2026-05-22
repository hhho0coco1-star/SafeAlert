package com.safealert.collector.client;

import com.safealert.collector.model.AlertRawMessage;
import com.safealert.collector.service.DuplicateFilterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

import java.net.URI;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DisasterAlertClient {

    @Value("${api.disaster.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;

    @CircuitBreaker(name = "disasterApi", fallbackMethod = "fetchFallback")
    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://apis.data.go.kr/1741000/DisasterMsg4/getDisasterMsg4List")
                .queryParam("serviceKey", apiKey)
                .queryParam("numOfRows", 10)
                .queryParam("pageNo", 1)
                .queryParam("type", "json")
                .build(true)
                .toUri();

        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(uri, String.class);
            if (!resp.getStatusCode().is2xxSuccessful()) {
                log.warn("[행정안전부] API 응답 오류 - status: {}", resp.getStatusCode());
                return results;
            }
            String response = resp.getBody();
            log.info("[행정안전부] API 응답 수신 완료");

            AlertRawMessage message = AlertRawMessage.builder()
                    .source("DISASTER")
                    .category("DISASTER")
                    .title("긴급재난문자")
                    .content(response)
                    .region("전국")
                    .issuedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .rawData(response)
                    .build();

            if (!duplicateFilter.isDuplicate("DISASTER", "긴급재난문자", message.getIssuedAt())) {
                results.add(message);
            }
        } catch (Exception e) {
            log.error("[행정안전부] API 호출 실패 - {}", e.getMessage());
        }

        return results;
    }

    public List<AlertRawMessage> fetchFallback(Exception e) {
        log.warn("[행정안전부] Circuit Breaker 작동 - API 일시 차단: {}", e.getMessage());
        return List.of();
    }
}
