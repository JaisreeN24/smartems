package com.smartems.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.smartems.model.Emergency;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyNewEmergency(Emergency emergency) {
        messagingTemplate.convertAndSend("/topic/emergencies", emergency);
    }
}