package com.smartems.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartems.service.AIService;

@RestController
@RequestMapping("/firstaid")
@CrossOrigin(origins = "*")
public class FirstAidController {

    @Autowired
    private AIService aiService;

    @PostMapping("/guide")
    public Map<String, String> getFirstAid(@RequestBody Map<String, String> body) {
        String emergency = body.get("emergency");
        String guide = aiService.getFirstAidGuide(emergency);
        return Map.of("guide", guide);
    }
}