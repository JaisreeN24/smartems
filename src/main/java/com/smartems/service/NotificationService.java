package com.smartems.service;

import org.springframework.stereotype.Service;

import com.smartems.model.FirstResponder;

@Service
public class NotificationService {
    public void notifyResponder(FirstResponder responder) {
    System.out.println("🚑 Alert sent to: " + responder.getName());
}
}