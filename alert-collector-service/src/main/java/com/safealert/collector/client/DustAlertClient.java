package com.safealert.collector.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.collector.model.AlertRawMessage;
import com.safealert.collector.service.DuplicateFilterService;
import com.safealert.collector.service.MeasureStationCacheService;
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
import java.util.Map;
import java.util.HashSet;
import java.util.Set;


@Slf4j
@Component
@RequiredArgsConstructor
public class DustAlertClient {

    @Value("${api.dust.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final MeasureStationCacheService stationCache;

    private static final Map<String, String> SIDO_TO_CODE = Map.ofEntries(
            Map.entry("서울", "11"), Map.entry("경기", "41"), Map.entry("인천", "28"),
            Map.entry("강원", "42"), Map.entry("충북", "43"), Map.entry("충남", "44"),
            Map.entry("대전", "30"), Map.entry("세종", "36"), Map.entry("경북", "47"),
            Map.entry("경남", "48"), Map.entry("대구", "27"), Map.entry("울산", "31"),
            Map.entry("부산", "26"), Map.entry("전북", "45"), Map.entry("전남", "46"),
            Map.entry("광주", "29"), Map.entry("제주", "50")
    );

    @CircuitBreaker(name = "dustApi", fallbackMethod = "fetchFallback")
    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        String today = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        for (Map.Entry<String, String> entry : SIDO_TO_CODE.entrySet()) {
            String sido = entry.getKey();
            String code = entry.getValue();
            try {
                URI uri = UriComponentsBuilder
                        .fromHttpUrl("https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty")
                        .queryParam("serviceKey", apiKey)
                        .queryParam("numOfRows", 100)
                        .queryParam("pageNo", 1)
                        .queryParam("sidoName", sido)
                        .queryParam("ver", "1.0")
                        .queryParam("returnType", "json")
                        .encode()
                        .build()
                        .toUri();

                String response = restTemplate.getForObject(uri, String.class);
                log.info("[환경부] {} API 응답 수신 완료", sido);

                JsonNode root = objectMapper.readTree(response);
                JsonNode items = root.path("response").path("body").path("items");
                if (!items.isArray()) continue;

                Set<String> seenSigungu = new HashSet<>();
                for (JsonNode item : items) {
                    String stationName = item.path("stationName").asText("").trim();
                    String sigungu = stationCache.getSigungu(stationName);
                    if (sigungu == null) continue;
                    if (!seenSigungu.add(sigungu)) continue;
                    if (duplicateFilter.isDuplicate("DUST", sigungu, today)) continue;

                    results.add(AlertRawMessage.builder()
                            .source("DUST")
                            .category("DUST")
                            .title("미세먼지 현황")
                            .content(parseDustContent(item, sigungu))
                            .region(code)
                            .issuedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                            .rawData(response)
                            .build());
                }
            } catch (Exception e) {
                log.error("[환경부] {} API 호출 실패 - {}", sido, e.getMessage());
            }
        }

        return results;
    }

    public List<AlertRawMessage> fetchFallback(Exception e) {
        log.warn("[환경부] Circuit Breaker 작동 - API 일시 차단: {}", e.getMessage());
        return List.of();
    }

    private String parseDustContent(JsonNode item, String sigungu) {
        try {
            String pm10 = item.path("pm10Value").asText("-");
            String pm25 = item.path("pm25Value").asText("-");
            String o3   = item.path("o3Value").asText("-");

            return String.format("%s | PM10 %s㎍/㎥(%s) · PM2.5 %s㎍/㎥(%s) · 오존 %sppm(%s)",
                    sigungu,
                    pm10, gradeToText(item.path("pm10Grade").asText()),
                    pm25, gradeToText(item.path("pm25Grade").asText()),
                    o3,   gradeToText(item.path("o3Grade").asText()));
        } catch (Exception e) {
            log.warn("[환경부] content 파싱 실패: {}", e.getMessage());
            return sigungu + " | 미세먼지 현황 수신";
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
