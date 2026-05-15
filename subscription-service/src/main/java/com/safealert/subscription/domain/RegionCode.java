package com.safealert.subscription.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "region_codes")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class RegionCode {

    @Id
    @Column(length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "parent_code", length = 10)
    private String parentCode;
}