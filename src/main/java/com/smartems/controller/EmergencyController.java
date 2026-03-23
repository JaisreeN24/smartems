package com.smartems.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartems.model.Emergency;
import com.smartems.model.FirstResponder;
import com.smartems.repository.EmergencyRepository;
import com.smartems.repository.HospitalRepository;
import com.smartems.repository.ResponderRepository;
import com.smartems.service.AIService;
import com.smartems.service.HospitalService;
import com.smartems.service.NotificationService;
import com.smartems.service.ScoringService;
import com.smartems.service.WebSocketService;

@RestController
@RequestMapping("/emergencies")
@CrossOrigin(origins = "*")
public class EmergencyController {

    @Autowired
    private EmergencyRepository emergencyRepository;

    @Autowired
    private ResponderRepository responderRepository;

    @Autowired
    private ScoringService scoringService;

    @Autowired
    private NotificationService notificationService;
    @Autowired
private HospitalRepository hospitalRepository;

@Autowired
private HospitalService hospitalService;

@Autowired
private AIService aiService;
@Autowired
private WebSocketService webSocketService;
    @GetMapping
    public List<Emergency> getAll() {
        return emergencyRepository.findAll();
    }

    @PostMapping
public Emergency create(@RequestBody Emergency emergency) {

    emergency.setStatus("PENDING");
String description = emergency.getType();
String severity = aiService.classifySeverity(description);
emergency.setSeverity(severity);
    List<FirstResponder> responders = responderRepository.findAll();

    FirstResponder bestResponder =
            scoringService.findBestResponder(
                    responders,
                    emergency.getLatitude(),
                    emergency.getLongitude()
            );

    if (bestResponder != null) {

        emergency.setStatus("ASSIGNED");

        bestResponder.setAvailable(false);
        responderRepository.save(bestResponder);

        notificationService.notifyResponder(bestResponder);

    } else {
        emergency.setStatus("NO RESPONDER AVAILABLE");
    }


    var hospitals = hospitalRepository.findAll();

    var bestHospital = hospitalService.findNearestHospital(
            hospitals,
            emergency.getLatitude(),
            emergency.getLongitude()
    );

    if (bestHospital != null) {
        System.out.println("🏥 Assigned Hospital: " + bestHospital.getName());

        emergency.setHospitalName(bestHospital.getName());
    }

    Emergency saved = emergencyRepository.save(emergency);

    webSocketService.notifyNewEmergency(saved);

    return saved;
}

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        emergencyRepository.deleteById(id);
    }
}