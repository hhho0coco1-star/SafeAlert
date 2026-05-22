package com.safealert.collector.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.collector.model.AlertRawMessage;
import com.safealert.collector.service.DuplicateFilterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
public class DustAlertClient {

    @Value("${api.dust.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @CircuitBreaker(name = "dustApi", fallbackMethod = "fetchFallback")
    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty")
                .queryParam("serviceKey", apiKey)
                .queryParam("numOfRows", 10)
                .queryParam("pageNo", 1)
                .queryParam("sidoName", "서울")
                .queryParam("ver", "1.0")
                .queryParam("returnType", "json")
                .build(false)
                .encode()
                .toUri();

        try {
            String response = restTemplate.getForObject(uri, String.class);
            log.info("[환경부] API 응답 수신 완료");

            AlertRawMessage message = AlertRawMessage.builder()
                    .source("DUST")
                    .category("DUST")
                    .title("미세먼지 현황")
                    .content(parseDustContent(response))
                    .region("전국")
                    .issuedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .rawData(response)
                    .build();

            if (!duplicateFilter.isDuplicate("DUST", "미세먼지 현황", message.getIssuedAt())) {
                results.add(message);
            }
        } catch (Exception e) {
            log.error("[환경부] API 호출 실패 - {}", e.getMessage());
        }

        return results;
    }

    public List<AlertRawMessage> fetchFallback(Exception e) {
        log.warn("[환경부] Circuit Breaker 작동 - API 일시 차단: {}", e.getMessage());
        return List.of();
    }

    private String parseDustContent(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("response").path("body").path("items");
            if (!items.isArray() || items.isEmpty()) return "미세먼지 정보 없음";

            JsonNode item = items.get(0);
            String sido    = item.path("sidoName").asText("");
            String station = item.path("stationName").asText("");
            String pm10    = item.path("pm10Value").asText("-");
            String pm25    = item.path("pm25Value").asText("-");
            String o3      = item.path("o3Value").asText("-");

            return String.format("%s %s | PM10 %s㎍/㎥(%s) · PM2.5 %s㎍/㎥(%s) · 오존 %sppm(%s)",
                    sido, station, pm10, gradeToText(item.path("pm10Grade").asText()),
                    pm25, gradeToText(item.path("pm25Grade").asText()),
                    o3,   gradeToText(item.path("o3Grade").asText()));
        } catch (Exception e) {
            log.warn("[환경부] content 파싱 실패: {}", e.getMessage());
            return "미세먼지 현황 수신";
        }
    }

    private String gradeToText(String grade) {
        return switch (grade) {
            case "1" -> "좋음";
            case "2" -> "보통";
            case "3" -> "나쁨";
            case "4" -> "매우나쁨";
            default  -> "정보없음";
        };
    }
}
