package com.smartems.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartems.model.FirstResponder;

@Repository
public interface ResponderRepository extends JpaRepository<FirstResponder, Long> {
    Optional<FirstResponder> findByUsername(String username);
}
