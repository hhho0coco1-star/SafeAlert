package com.safealert.collector.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeasureStationCacheService {

    @Value("${api.dust.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final Map<String, String> stationToSigungu = new HashMap<>();

    @PostConstruct
    public void init() {
        loadAllStations();
    }

    private void loadAllStations() {
        int pageNo = 1;
        int numOfRows = 100;
        int totalLoaded = 0;

        try {
            while (true) {
                URI uri = UriComponentsBuilder
                        .fromHttpUrl("https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getMsrstnList")
                        .queryParam("serviceKey", apiKey)
                        .queryParam("returnType", "json")
                        .queryParam("numOfRows", numOfRows)
                        .queryParam("pageNo", pageNo)
                        .build(true)
                        .toUri();

                String response = restTemplate.getForObject(uri, String.class);
                JsonNode root = objectMapper.readTree(response);
                JsonNode items = root.path("response").path("body").path("items");

                if (!items.isArray() || items.isEmpty()) break;

                for (JsonNode item : items) {
                    String stationName = item.path("stationName").asText("").trim();
                    String addr = item.path("addr").asText("").trim();
                    String sigungu = parseSigungu(addr);
                    if (stationName.isBlank() || sigungu == null) continue;
                    stationToSigungu.put(stationName, sigungu);
                }

                totalLoaded += items.size();
                if (items.size() < numOfRows) break;
                pageNo++;
            }

            log.info("[측정소 캐시] 로딩 완료 — 총 {}개 측정소 매핑됨", totalLoaded);

        } catch (Exception e) {
            log.error("[측정소 캐시] 로딩 실패 — heuristic 모드로 동작합니다: {}", e.getMessage());
        }
    }

    private String parseSigungu(String addr) {
        if (addr == null || addr.isBlank()) return null;
        String[] parts = addr.split(" ");
        if (parts.length < 2) return null;
        String candidate = parts[1];
        if (candidate.endsWith("시") || candidate.endsWith("군") || candidate.endsWith("구")) {
            return candidate;
        }
        return null;
    }

    public String getSigungu(String stationName) {
        if (stationName == null || stationName.isBlank()) return null;
        String cached = stationToSigungu.get(stationName);
        if (cached != null) return cached;

        // fallback: heuristic (API 실패 시 대비)
        if (stationName.endsWith("시") || stationName.endsWith("군") || stationName.endsWith("구")) {
            return stationName;
        }
        return null;
    }
}
