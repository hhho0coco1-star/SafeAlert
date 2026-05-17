package com.safealert.collector.client;

import com.safealert.collector.model.AlertRawMessage;
import com.safealert.collector.service.DuplicateFilterService;
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
public class DustAlertClient {

    @Value("${api.dust.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;

    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        String url = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty"
                + "?serviceKey=" + apiKey
                + "&numOfRows=10&pageNo=1&sidoName=서울&ver=1.0&returnType=json";

        try {
            String response = restTemplate.getForObject(url, String.class);
            log.info("[환경부] API 응답 수신 완료");

            AlertRawMessage message = AlertRawMessage.builder()
                    .source("DUST")
                    .category("DUST")
                    .title("미세먼지 현황")
                    .content(response)
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
}
