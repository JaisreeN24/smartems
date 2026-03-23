package com.smartems.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartems.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}