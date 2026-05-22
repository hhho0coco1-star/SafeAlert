package com.safealert.collector.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.collector.model.AlertRawMessage;
import com.safealert.collector.service.DuplicateFilterService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherAlertClient {

    @Value("${api.weather.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @CircuitBreaker(name = "weatherApi", fallbackMethod = "fetchFallback")
    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        String url = "http://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList"
                + "?serviceKey=" + apiKey
                + "&numOfRows=20&pageNo=1&dataType=JSON";

        try {
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            String resultCode = root.path("response").path("header").path("resultCode").asText();

            if (!"00".equals(resultCode)) {
                log.warn("[기상청] API 오류 - resultCode: {}", resultCode);
                return results;
            }

            JsonNode items = root.path("response").path("body").path("items").path("item");
            if (!items.isArray() || items.isEmpty()) {
                log.info("[기상청] 현재 발효 중인 기상특보 없음");
                return results;
            }

            for (JsonNode item : items) {
                String title = item.path("title").asText("기상특보");
                String tmFc  = item.path("tmFc").asText();
                String stnId = item.path("stnId").asText();
                String dedupeKey = stnId + "_" + tmFc;

                if (!duplicateFilter.isDuplicate("WEATHER", dedupeKey, tmFc)) {
                    results.add(AlertRawMessage.builder()
                            .source("WEATHER")
                            .category("WEATHER")
                            .title(title)
                            .content(response)
                            .region("전국")
                            .issuedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                            .rawData(response)
                            .build());
                }
            }

            log.info("[기상청] API 응답 수신 완료 - {}건 신규", results.size());

        } catch (Exception e) {
            log.error("[기상청] API 호출 실패 - {}", e.getMessage());
        }

        return results;
    }

    public List<AlertRawMessage> fetchFallback(Exception e) {
        log.warn("[기상청] Circuit Breaker 작동 - API 일시 차단: {}", e.getMessage());
        return List.of();
    }
}
