package com.smartems.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartems.model.Hospital;

@Service
public class HospitalService {

    public Hospital findNearestHospital(List<Hospital> hospitals,
                                        double lat,
                                        double lon) {

        return hospitals.stream()
                .min(Comparator.comparing(h ->
                        distance(h.getLatitude(), h.getLongitude(), lat, lon)
                ))
                .orElse(null);
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {

        final int R = 6371;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}