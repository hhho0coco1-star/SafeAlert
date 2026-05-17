// 기상청 API를 실제로 호출해서 기상특보 데이터를 가져옴 
// 응답 XML을 파싱해서 AlertRawMessage 형태로 변환

package com.safealert.collector.client;

import com.safealert.collector.model.AlertRawMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import com.safealert.collector.service.DuplicateFilterService;
import lombok.RequiredArgsConstructor;


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

    public List<AlertRawMessage> fetch() {
        List<AlertRawMessage> results = new ArrayList<>();
        String url = "http://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnMsg"
                + "?serviceKey=" + apiKey
                + "&numOfRows=10&pageNo=1&dataType=JSON";

        try {
            String response = restTemplate.getForObject(url, String.class);
            log.info("[기상청] API 응답 수신 완료");

            AlertRawMessage message = AlertRawMessage.builder()
                    .source("WEATHER")
                    .category("WEATHER")
                    .title("기상특보")
                    .content(response)
                    .region("전국")
                    .issuedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .rawData(response)
                    .build();

            if (!duplicateFilter.isDuplicate("WEATHER", "기상특보", message.getIssuedAt())) {
                results.add(message);
            }

        } catch (Exception e) {
            log.error("[기상청] API 호출 실패 - {}", e.getMessage());
        }

        return results;
    }
} 
