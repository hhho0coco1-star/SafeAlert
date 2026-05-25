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
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherAlertClient {

    private static final Map<String, String> STN_TO_REGION = Map.ofEntries(
            Map.entry("108", "11"),  // 서울
            Map.entry("232", "28"),  // 인천
            Map.entry("119", "41"),  // 수원(경기)
            Map.entry("101", "42"),  // 춘천(강원)
            Map.entry("133", "43"),  // 청주(충북)
            Map.entry("131", "30"),  // 대전
            Map.entry("140", "44"),  // 서산(충남)
            Map.entry("146", "45"),  // 전주(전북)
            Map.entry("156", "29"),  // 광주
            Map.entry("165", "46"),  // 목포(전남)
            Map.entry("143", "27"),  // 대구
            Map.entry("115", "47"),  // 울진(경북)
            Map.entry("159", "26"),  // 부산
            Map.entry("152", "31"),  // 울산
            Map.entry("192", "48"),  // 진주(경남)
            Map.entry("184", "50"),  // 제주
            Map.entry("136", "36")   // 세종
    );

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
                    String region = STN_TO_REGION.getOrDefault(stnId, "전국");
                    results.add(AlertRawMessage.builder()
                            .source("WEATHER")
                            .category("WEATHER")
                            .title("기상특보")
                            .content(parseWeatherContent(title))
                            .region(region)
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

    // title 예시: "[특보] 제05-28호 : 2026.05.25.16:00 / 강풍주의보·풍랑주의보 발표 (*)"
    private String parseWeatherContent(String title) {
        try {
            int slashIdx = title.indexOf(" / ");
            if (slashIdx < 0) return title;
            String after = title.substring(slashIdx + 3);
            int parenIdx = after.lastIndexOf(" (*)");
            return parenIdx >= 0 ? after.substring(0, parenIdx).trim() : after.trim();
        } catch (Exception e) {
            log.warn("[기상청] content 파싱 실패: {}", e.getMessage());
            return "기상특보 발효";
        }
    }
}
