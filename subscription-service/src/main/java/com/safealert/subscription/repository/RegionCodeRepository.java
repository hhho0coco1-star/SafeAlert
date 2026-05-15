package com.safealert.subscription.repository;

import com.safealert.subscription.domain.RegionCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionCodeRepository extends JpaRepository<RegionCode, String> {
    
}