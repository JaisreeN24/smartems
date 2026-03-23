package com.smartems.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartems.model.FirstResponder;

@Service
public class ScoringService {

    public FirstResponder findBestResponder(List<FirstResponder> responders,
                                            double emergencyLat,
                                            double emergencyLon) {

        return responders.stream()
                .filter(r -> r.isAvailable())
                .filter(r -> distance(r.getLatitude(), r.getLongitude(), 
                      emergencyLat, emergencyLon) < 50) 
                .min(Comparator.comparing(r ->
                        distance(r.getLatitude(), r.getLongitude(), emergencyLat, emergencyLon)
                ))
                .orElse(null);
    }

    // 🔥 Haversine Formula (REAL DISTANCE)
    private double distance(double lat1, double lon1, double lat2, double lon2) {

        final int R = 6371; // Earth radius (km)

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}