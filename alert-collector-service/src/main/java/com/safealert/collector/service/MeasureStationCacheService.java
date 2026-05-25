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

    @Value("${subscription.service.url}")
    private String subscriptionServiceUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final Map<String, String> stationToSigungu = new HashMap<>();
    private final Map<String, String> stationToSigunguName = new HashMap<>();

    private static final Map<String, String> SIDO_NAME_TO_CODE = Map.ofEntries(
        Map.entry("서울특별시", "11"), Map.entry("부산광역시", "26"),
        Map.entry("대구광역시", "27"), Map.entry("인천광역시", "28"),
        Map.entry("광주광역시", "29"), Map.entry("대전광역시", "30"),
        Map.entry("울산광역시", "31"), Map.entry("세종특별자치시", "36"),
        Map.entry("경기도", "41"),    Map.entry("강원도", "42"),
        Map.entry("강원특별자치도", "42"), Map.entry("충청북도", "43"),
        Map.entry("충청남도", "44"),  Map.entry("전라북도", "45"),
        Map.entry("전북특별자치도", "45"), Map.entry("전라남도", "46"),
        Map.entry("경상북도", "47"),  Map.entry("경상남도", "48"),
        Map.entry("제주특별자치도", "50")
    );

    private final Map<String, String> sigunguKeyToCode = new HashMap<>();

    @PostConstruct
    public void init() {
        loadRegionCodes();
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
                    stationToSigunguName.put(stationName, parseSigunguName(addr));
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
        String sidoCode = SIDO_NAME_TO_CODE.get(parts[0]);
        if (sidoCode == null) return null;
        String code = sigunguKeyToCode.get(sidoCode + ":" + parts[1]);
        if (code != null) return code;
        if (parts.length >= 3) {
            code = sigunguKeyToCode.get(sidoCode + ":" + parts[2]);
            if (code != null) return code;
        }
        return null;
    }

    private String parseSigunguName(String addr) {
        if (addr == null || addr.isBlank()) return null;
        String[] parts = addr.split(" ");
        if (parts.length < 2) return null;
        if (parts[1].endsWith("시") || parts[1].endsWith("군") || parts[1].endsWith("구")) {
            return parts[1];
        }
        if (parts.length >= 3 &&
            (parts[2].endsWith("시") || parts[2].endsWith("군") || parts[2].endsWith("구"))) {
            return parts[2];
        }
        return null;
    }

    public String getSigungu(String stationName) {
        if (stationName == null || stationName.isBlank()) return null;
        return stationToSigungu.get(stationName);
    }

    public String getSigunguName(String stationName) {
        if (stationName == null || stationName.isBlank()) return null;
        return stationToSigunguName.get(stationName);
    }

    private void loadRegionCodes() {
        try {
            String url = subscriptionServiceUrl + "/api/subscriptions/regions/available";
            JsonNode body = restTemplate.getForObject(url, JsonNode.class);
            if (body == null) return;
            JsonNode data = body.path("data");
            for (JsonNode sido : data) {
                String sidoCode = sido.path("code").asText();
                for (JsonNode sigungu : sido.path("children")) {
                    String name = sigungu.path("name").asText();
                    String code = sigungu.path("code").asText();
                    sigunguKeyToCode.put(sidoCode + ":" + name, code);
                }
            }
            log.info("[시군구 코드 캐시] {}개 로딩 완료", sigunguKeyToCode.size());
        } catch (Exception e) {
            log.warn("[시군구 코드 캐시] 로딩 실패: {}", e.getMessage());
        }
    }
}
