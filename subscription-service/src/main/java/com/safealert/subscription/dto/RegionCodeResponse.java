package com.safealert.subscription.dto;

import com.safealert.subscription.domain.RegionCode;
import lombok.Getter;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL) // 값이 null 인 필드는 JSON 응답에서 제외
public class RegionCodeResponse {

    private String code;
    private String name;
    private List<RegionCodeResponse> children;

    public RegionCodeResponse(RegionCode regionCode) {
        this.code = regionCode.getCode();
        this.name = regionCode.getName();
    }

    public RegionCodeResponse(RegionCode regionCode, List<RegionCodeResponse> children) {
        this.code = regionCode.getCode();
        this.name = regionCode.getName();
        this.children = children;
    }
}