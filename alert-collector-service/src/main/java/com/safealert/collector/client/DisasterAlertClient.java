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
    private final ObjectMapper objectMapper;

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

            for (JsonNode item : body) {
                String sn = item.path("SN").asText();
                String msgCn = item.path("MSG_CN").asText();
                String region = item.path("RCPTN_RGN_NM").asText().trim();
                String crtDt = item.path("CRT_DT").asText();
                String dstSeNm = item.path("DST_SE_NM").asText();

                if (duplicateFilter.isDuplicate("DISASTER", dstSeNm, sn)) {
                    continue;
                }

                results.add(AlertRawMessage.builder()
                        .source("DISASTER")
                        .category("DISASTER")
                        .title(dstSeNm)
                        .content(msgCn)
                        .region(region)
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
}
