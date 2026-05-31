package com.safealert.collector.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DisasterAlertClient {

    @Value("${api.disaster.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

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


    @CircuitBreaker(name = "disasterApi", fallbackMethod = "fetchFallback")
    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        URI uri = UriComponentsBuilder
                .fromHttpUrl("https://www.safetydata.go.kr/V2/api/DSSP-IF-00247")
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

            JsonNode root = objectMapper.readTree(resp.getBody());
            JsonNode body = root.path("body");

            if (!body.isArray()) {
                log.warn("[행정안전부] body 배열 없음 - resultCode: {}",
                        root.path("header").path("resultCode").asText());
                return results;
            }

            LocalDate today = LocalDate.now();
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");

            for (JsonNode item : body) {
                String sn = item.path("SN").asText();
                String msgCn = item.path("MSG_CN").asText();
                String regionRaw = item.path("RCPTN_RGN_NM").asText().trim();
                String crtDt = item.path("CRT_DT").asText();
                String dstSeNm = item.path("DST_SE_NM").asText();

                // 오늘 날짜 데이터만 수집 (과거 재난문자 재수집 방지)
                try {
                    LocalDate msgDate = LocalDate.parse(crtDt, fmt);
                    if (!msgDate.equals(today)) continue;
                } catch (Exception ex) {
                    log.warn("[행정안전부] 날짜 파싱 실패 - crtDt: {}", crtDt);
                    continue;
                }

                if (duplicateFilter.isDuplicate("DISASTER", dstSeNm, sn)) {
                    continue;
                }

                results.add(AlertRawMessage.builder()
                        .source("DISASTER")
                        .category("DISASTER")
                        .title(dstSeNm)
                        .content(msgCn)
                        .region(parseRegionCode(regionRaw))
                        .issuedAt(crtDt)
                        .rawData(item.toString())
                        .build());
            }

            log.info("[행정안전부] 수집 완료 - {}건 신규", results.size());
        } catch (Exception e) {
            log.error("[행정안전부] API 호출 실패 - {}", e.getMessage());
        }

        return results;
    }

    public List<AlertRawMessage> fetchFallback(Exception e) {
        log.warn("[행정안전부] Circuit Breaker 작동 - API 일시 차단: {}", e.getMessage());
        return List.of();
    }

    private String parseRegionCode(String rcptnRgnNm) {
        if (rcptnRgnNm == null || rcptnRgnNm.isBlank()) return "전국";
        String sido = rcptnRgnNm.split(" ")[0];
        return SIDO_NAME_TO_CODE.getOrDefault(sido, "전국");
    }
}
