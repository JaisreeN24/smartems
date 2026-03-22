package com.smartems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartems.model.Emergency;

@Repository
public interface EmergencyRepository extends JpaRepository<Emergency, Long> {}