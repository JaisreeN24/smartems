package com.smartems.service;

import org.springframework.stereotype.Service;

@Service
public class RoutingService {
    public String getRoute(String from, String to) {
    return "Fastest route from " + from + " to " + to;
}
}