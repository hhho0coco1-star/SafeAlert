package com.safealert.subscription.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.subscription.domain.RegionCode;
import com.safealert.subscription.repository.RegionCodeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegionCodeSyncService {

    @Value("${api.region.key}") // application 내 경로
    private String apiKey;

    private final RegionCodeRepository regionCodeRepository;
    private final ObjectMapper objectMapper;

    private static final String API_URL = "http://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList";

    @PostConstruct // @Value 객체가 생성되고 의존성 주입이 끝난 후, 스프링이 이 메서드를 자동 실행
    public void sync() {
        try {
            log.info("[RegionCodeSync] 법정동코드 동기화 시작");
            List<RegionCode> codes = fetchAllRegionCodes();
            regionCodeRepository.saveAll(codes); // DB에 저장
            log.info("[RegionCodeSync] 동기화 완료 - {}개 저장", codes.size());
        } catch (Exception e) {
            log.error("[RegionCodeSync] 동기화 실패 - data.sql 시드 유지", e);
        }
    }

    private List<RegionCode> fetchAllRegionCodes() throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        List<RegionCode> result = new ArrayList<>();
        int pageNo = 1; // 1 페이지부터 조회 반복문을 돌면서 2 -> 3 증가
        int numOfRows = 5000;
        int totalCount = Integer.MAX_VALUE; // 데이터의 개수를 알 수 없으므로 정수의 맥스값을 지정

        while ((pageNo - 1) * numOfRows < totalCount) {
            String url = UriComponentsBuilder.fromHttpUrl(API_URL)
                    .queryParam("serviceKey", apiKey)
                    .queryParam("pageNo", pageNo)
                    .queryParam("numOfRows", numOfRows)
                    .queryParam("type", "json")
                    .encode()
                    .build()
                    .toUriString();

            String json = restTemplate.getForObject(url, String.class);
            // URL로 GET 요청을 보내고 응답을 문자열 받음
            JsonNode stanReginCd = objectMapper.readTree(json).path("StanReginCd");

            if (pageNo == 1) {
                totalCount = stanReginCd.get(0).path("head").get(0).path("totalCount").asInt(0);
                log.info("[RegionCodeSync] 전체 법정동코드 {}개", totalCount);
            }

            JsonNode rows = stanReginCd.get(1).path("row");
            for (JsonNode row : rows) {
                RegionCode rc = parseRow(row);
                if (rc != null) result.add(rc);
            }

            pageNo++;
        }
        return result;
    }

    private RegionCode parseRow(JsonNode row) {
        String sidoCd = row.path("sido_cd").asText();
        String sggCd = row.path("sgg_cd").asText();
        String umdCd = row.path("umd_cd").asText();

        if ("000".equals(sggCd) && "000".equals(umdCd)) {
            // 시도 레벨 - code 2자리, parent 없음
            String name = row.path("locatadd_nm").asText().trim();
            return RegionCode.of(sidoCd, name, null);
        }

        if (!"000".equals(sggCd) && "000".equals(umdCd)) {
            // 시군구 레벨 - code 5자리, parent = 시도 2자리
            String code = sidoCd + sggCd;
            String name = row.path("locallow_nm").asText().trim();
            return RegionCode.of(code, name, sidoCd);
        }

        return null; // 읍면동 이하 스킵
    }
}