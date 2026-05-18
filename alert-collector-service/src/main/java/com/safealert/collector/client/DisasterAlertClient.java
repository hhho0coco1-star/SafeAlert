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
public class DisasterAlertClient {

    @Value("${api.disaster.key}")
    private String apiKey;

    private final DuplicateFilterService duplicateFilter;
    private final RestTemplate restTemplate;

    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        String url = "https://apis.data.go.kr/1741000/DisasterMsg4/getDisasterMsg4List"
                + "?serviceKey=" + apiKey
                + "&numOfRows=10&pageNo=1&type=json";

        try {
            String response = restTemplate.getForObject(url, String.class);
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
}
