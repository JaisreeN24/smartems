package com.smartems.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartems.model.User;
import com.smartems.repository.UserRepository;
import com.smartems.security.JwtUtil;
import com.smartems.service.AuditLogService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuditLogService auditLogService;

    // Register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role"); // ADMIN or RESPONDER

        if (userRepository.findByUsername(username).isPresent()) {
            auditLogService.log(
                username,
                "REGISTER",
                "USER",
                username,
                "Registration blocked because username already exists",
                false,
                request.getRemoteAddr()
            );
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role != null ? role.toUpperCase() : "RESPONDER");
        userRepository.save(user);

        auditLogService.log(
            user.getUsername(),
            "REGISTER",
            "USER",
            String.valueOf(user.getId()),
            "Registered with role " + user.getRole(),
            true,
            request.getRemoteAddr()
        );

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String username = body.get("username");
        String password = body.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            auditLogService.log(
                username,
                "LOGIN",
                "USER",
                username,
                "Invalid credentials",
                false,
                request.getRemoteAddr()
            );
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        auditLogService.log(
            user.getUsername(),
            "LOGIN",
            "USER",
            String.valueOf(user.getId()),
            "User logged in successfully",
            true,
            request.getRemoteAddr()
        );

        return ResponseEntity.ok(Map.of(
            "token", token,
            "username", user.getUsername(),
            "role", user.getRole()
        ));
    }
}
