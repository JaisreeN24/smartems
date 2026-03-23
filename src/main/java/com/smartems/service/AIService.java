package com.smartems.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AIService {

    @Value("${anthropic.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String classifySeverity(String description) {
        if (description == null || description.isBlank()) return "MEDIUM";

        System.out.println("🤖 AI Input: " + description);

        try {
            Map<String, Object> requestBody = Map.of(
                "model", "claude-haiku-4-5-20251001",
                "max_tokens", 10,
                "messages", List.of(
                    Map.of("role", "user", "content", buildPrompt(description))
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", "2023-06-01");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.anthropic.com/v1/messages",
                entity,
                String.class
            );

            System.out.println("🔍 Raw Response: " + response.getBody());
            return parseSeverity(response.getBody());

        } catch (Exception e) {
            System.out.println("❌ AI Error: " + e.getMessage());
            e.printStackTrace();
            return fallbackClassify(description);
        }
    }

    private String buildPrompt(String description) {
        return """
            You are a medical emergency triage AI. Classify the severity strictly.
            
            CRITICAL = only true life-threatening emergencies:
            - cardiac arrest, not breathing, unconscious, active stroke, severe trauma
            
            HIGH = serious but stable:
            - high fever, fractures, moderate bleeding, chest pain, allergic reaction
            
            MEDIUM = needs care, not urgent:
            - mild pain, minor cuts, nausea, headache, vomiting, dizziness
            
            LOW = minor, can wait:
            - cold, small bruise, scrapes, minor fall with no injury, routine
            
            STRICT RULE: "bruise", "cold", "minor fall" = LOW. Do NOT over-classify.
            
            Emergency: "%s"
            
            Reply with ONLY one word: CRITICAL, HIGH, MEDIUM, or LOW.
            """.formatted(description);
    }

    private String parseSeverity(String responseBody) throws Exception {
        Map<?, ?> response = objectMapper.readValue(responseBody, Map.class);

        if (response.containsKey("error")) {
            System.out.println("❌ API Error: " + response.get("error"));
            return "MEDIUM";
        }

        List<?> content = (List<?>) response.get("content");
        Map<?, ?> firstBlock = (Map<?, ?>) content.get(0);
        String text = ((String) firstBlock.get("text")).trim().toUpperCase();

        System.out.println("✅ AI Raw Text: [" + text + "]");

        // Direct match first
        if (text.equals("CRITICAL") || text.equals("HIGH") ||
            text.equals("MEDIUM") || text.equals("LOW")) {
            return text;
        }

        // Partial match fallback
        for (String level : List.of("CRITICAL", "HIGH", "MEDIUM", "LOW")) {
            if (text.contains(level)) return level;
        }

        System.out.println("⚠️ Unexpected response: " + text);
        return "MEDIUM";
    }

    private String fallbackClassify(String description) {
        description = description.toLowerCase();
        if (description.contains("cardiac") || description.contains("arrest") ||
            description.contains("stroke") || description.contains("unconscious") ||
            description.contains("not breathing")) {
            return "CRITICAL";
        }
        if (description.contains("fever") || description.contains("bleeding") ||
            description.contains("fracture") || description.contains("chest pain")) {
            return "HIGH";
        }
        if (description.contains("headache") || description.contains("nausea") ||
            description.contains("mild") || description.contains("cut")) {
            return "MEDIUM";
        }
        return "LOW";
    }
}