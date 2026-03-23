package com.smartems.security;

import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

private final SecretKey key = Keys.hmacShaKeyFor(
    Base64.getDecoder().decode("c21hcnRlbXMtc2VjcmV0LWtleS0yMDI0LW11c3QtYmUtMzItY2hhcnMh")
);
    private final long EXPIRY = 1000 * 60 * 60 * 10; // 10 hours

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRY))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) getClaims(token).get("role");
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
                    System.out.println("✅ Token valid");

            return true;
        } catch (Exception e) {
                System.out.println("❌ Token invalid: " + e.getMessage()); // ← ADD THIS

            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}