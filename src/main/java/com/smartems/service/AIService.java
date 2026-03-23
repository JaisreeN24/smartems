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

    @Value("${openrouter.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ✅ Common headers for OpenRouter
    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("HTTP-Referer", "http://localhost:3000");
        headers.set("X-Title", "SmartEMS");
        return headers;
    }

    // ✅ Parse OpenRouter response (same as OpenAI format)
    private String parseResponse(String responseBody) throws Exception {
        Map<?, ?> response = objectMapper.readValue(responseBody, Map.class);
        List<?> choices = (List<?>) response.get("choices");
        Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
        Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
        return ((String) message.get("content")).trim();
    }

    // ✅ Classify severity
    public String classifySeverity(String description) {
        if (description == null || description.isBlank()) return "MEDIUM";

        System.out.println("🤖 AI Input: " + description);

        try {
            Map<String, Object> requestBody = Map.of(
                "model", "meta-llama/llama-3-8b-instruct:free", // ✅ Free model
                "max_tokens", 100,
                "messages", List.of(
                    Map.of("role", "user", "content", buildPrompt(description))
                )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, buildHeaders());

            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://openrouter.ai/api/v1/chat/completions",
                entity,
                String.class
            );

            String text = parseResponse(response.getBody()).toUpperCase();
            System.out.println("✅ AI Severity: " + text);

            for (String level : List.of("CRITICAL", "HIGH", "MEDIUM", "LOW")) {
                if (text.contains(level)) return level;
            }
            return "MEDIUM";

        } catch (Exception e) {
            System.out.println("❌ AI Error: " + e.getMessage());
            return fallbackClassify(description);
        }
    }

    // ✅ First Aid Guide
    public String getFirstAidGuide(String emergencyDescription) {
    System.out.println("🏥 FirstAid Request: " + emergencyDescription);

    if (emergencyDescription == null || emergencyDescription.isBlank()) {
        return "Stay calm and call 112 immediately.";
    }

    boolean isFollowUp = emergencyDescription.contains("User question:");

    try {
        List<Map<String, String>> messages;

        if (isFollowUp) {
            String context = emergencyDescription.substring(
                emergencyDescription.indexOf("Context:") + 8,
                emergencyDescription.indexOf("User question:")).trim();
            String question = emergencyDescription.substring(
                emergencyDescription.indexOf("User question:") + 14).trim();

            messages = List.of(
                Map.of("role", "system", "content",
                    "You are a first aid assistant. Emergency context: " + context +
                    ". Answer the user's question directly and concisely. " +
                    "If it's a greeting like 'hello', respond warmly and ask how you can help. " +
                    "Do NOT repeat the initial first aid steps unless asked."),
                Map.of("role", "user", "content", question)
            );
        } else {
            messages = List.of(
                Map.of("role", "system", "content",
                    "You are an emergency first aid assistant. Give exactly 5 numbered steps. End with 'Help is on the way!'"),
                Map.of("role", "user", "content",
                    "Emergency: " + emergencyDescription + ". What should I do right now?")
            );
        }

        Map<String, Object> requestBody = Map.of(
            "model", "meta-llama/llama-3-8b-instruct:free",
            "max_tokens", 500,
            "messages", messages
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, buildHeaders());
        ResponseEntity<String> response = restTemplate.postForEntity(
            "https://openrouter.ai/api/v1/chat/completions",
            entity, String.class
        );

        String result = parseResponse(response.getBody());
        System.out.println("✅ FirstAid Response: " + result);
        return result;

    } catch (Exception e) {
        System.out.println("❌ FirstAid AI Error: " + e.getMessage());
        return fallbackFirstAid(emergencyDescription);
    }
}

    private String buildPrompt(String description) {
        return """
            You are a medical emergency triage AI. Classify the severity strictly.
            
            CRITICAL = life-threatening: cardiac arrest, not breathing, unconscious, stroke, severe trauma
            HIGH = serious but stable: high fever, fractures, moderate bleeding, chest pain
            MEDIUM = needs care: mild pain, minor cuts, nausea, headache
            LOW = minor: cold, small bruise, minor fall
            
            Emergency: "%s"
            
            Reply with ONLY one word: CRITICAL, HIGH, MEDIUM, or LOW.
            """.formatted(description);
    }

    private String buildFirstAidPrompt(String description) {
    boolean isFollowUp = description.contains("User question:");

    if (isFollowUp) {
        // Split context and question properly
        String context = description.substring(description.indexOf("Context:") + 8, 
                         description.indexOf("User question:")).trim();
        String question = description.substring(
                         description.indexOf("User question:") + 14).trim();

        return """
            You are an emergency first aid assistant.
            Emergency context: "%s"
            
            The bystander asks: "%s"
            
            If it's a greeting or unrelated question, respond naturally and briefly,
            then remind them to stay focused on the emergency.
            If it's a first aid question, give 3-5 clear numbered steps specific to their question.
            End with "Stay calm, help is on the way!"
            """.formatted(context, question);
    }

    return """
        You are an emergency first aid assistant. Someone reported this emergency:
        "%s"
        
        Give 5-6 clear numbered first aid steps a bystander can follow RIGHT NOW.
        - Be specific to this emergency
        - Start with most critical action
        - Use simple language
        - End with "Help is on the way!"
        - Format: 1. Step one. 2. Step two.
        """.formatted(description);
}

    private String fallbackClassify(String description) {
        description = description.toLowerCase();
        if (description.contains("cardiac") || description.contains("arrest") ||
            description.contains("stroke") || description.contains("unconscious") ||
            description.contains("not breathing")) return "CRITICAL";
        if (description.contains("fever") || description.contains("bleeding") ||
            description.contains("fracture") || description.contains("chest")) return "HIGH";
        if (description.contains("headache") || description.contains("nausea") ||
            description.contains("mild") || description.contains("cut")) return "MEDIUM";
        return "LOW";
    }

    private String fallbackFirstAid(String description) {
        description = description.toLowerCase();
        if (description.contains("cardiac") || description.contains("arrest") ||
            description.contains("not breathing")) {
            return "1. Call 112 immediately.\n2. Check if person is breathing.\n3. Start CPR: 30 chest compressions.\n4. Press hard and fast in center of chest.\n5. Continue until help arrives.\nHelp is on the way!";
        }
        if (description.contains("unconscious") || description.contains("collapsed")) {
            return "1. Call 112 immediately.\n2. Check for breathing.\n3. Place in recovery position.\n4. Do not give food or water.\n5. Keep them warm and still.\nHelp is on the way!";
        }
        if (description.contains("bleeding") || description.contains("wound")) {
            return "1. Apply firm pressure with clean cloth.\n2. Do not remove cloth if soaked — add more.\n3. Elevate injured area above heart.\n4. Keep person still.\n5. Do not remove embedded objects.\nHelp is on the way!";
        }
        if (description.contains("accident") || description.contains("trauma")) {
            return "1. Do not move the person unless in danger.\n2. Apply pressure to bleeding wounds.\n3. Keep person warm and still.\n4. Talk to keep them conscious.\n5. Wait for help.\nHelp is on the way!";
        }
        if (description.contains("fever") || description.contains("seizure")) {
            return "1. Clear area of hard objects.\n2. Do not restrain the person.\n3. Place something soft under head.\n4. Time the seizure.\n5. After seizure, place in recovery position.\nHelp is on the way!";
        }
        return "1. Stay calm.\n2. Call 112 immediately.\n3. Keep the person still.\n4. Do not give food or water.\n5. Wait for medical help.\nHelp is on the way!";
    }
}