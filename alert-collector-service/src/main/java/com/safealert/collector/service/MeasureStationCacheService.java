package com.safealert.collector.service;

import org.springframework.stereotype.Service;

@Service
public class MeasureStationCacheService {

    public String getSigungu(String stationName) {
        if (stationName == null || stationName.isBlank()) return null;
        if (stationName.endsWith("시") ||
            stationName.endsWith("군") ||
            stationName.endsWith("구")) {
            return stationName;
        }
        return null;
    }
}
