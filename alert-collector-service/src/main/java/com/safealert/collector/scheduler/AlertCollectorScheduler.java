package com.safealert.collector.scheduler;

import com.safealert.collector.client.DustAlertClient;
import com.safealert.collector.client.WeatherAlertClient;
import com.safealert.collector.kafka.AlertKafkaProducer;
import com.safealert.collector.model.AlertRawMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

// 5분마다 자동으로 WeatherAlertClient와 DustAlertClient를 호출 -> 받아온 데이터를 Kafka로 전송
@Slf4j
@Component
@RequiredArgsConstructor
public class AlertCollectorScheduler {

    private final WeatherAlertClient weatherAlertClient;
    private final DustAlertClient dustAlertClient;
    private final AlertKafkaProducer kafkaProducer;

    @Scheduled(cron = "${scheduler.weather.cron}")
    public void collectWeather() {
        log.info("[스케줄러] 기상청 수집 시작");
        List<AlertRawMessage> messages = weatherAlertClient.fetch();
        messages.forEach(kafkaProducer::send);
        log.info("[스케줄러] 기상청 수집 완료 - {}건", messages.size());
    }

    @Scheduled(cron = "${scheduler.dust.cron}")
    public void collectDust() {
        log.info("[스케줄러] 환경부 수집 시작");
        List<AlertRawMessage> messages = dustAlertClient.fetch();
        messages.forEach(kafkaProducer::send);
        log.info("[스케줄러] 환경부 수집 완료 - {}건", messages.size());
    }
}