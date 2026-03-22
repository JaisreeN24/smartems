package com.smartems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartems.model.FirstResponder;

@Repository
public interface ResponderRepository extends JpaRepository<FirstResponder, Long> {}
