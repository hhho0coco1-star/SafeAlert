package com.safealert.subscription.dto;

import com.safealert.subscription.domain.RegionCode;
import lombok.Getter;

@Getter
public class RegionCodeResponse {

    private String code;
    private String name;

    public RegionCodeResponse(RegionCode regionCode) {
        this.code = regionCode.getCode();
        this.name = regionCode.getName();
    }
}