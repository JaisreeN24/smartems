package com.smartems.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
import com.smartems.service.AuditLogService;
import com.smartems.service.HospitalService;
import com.smartems.service.NotificationService;
import com.smartems.service.ScoringService;
import com.smartems.service.WebSocketService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/emergencies")
@CrossOrigin(origins = "*")
public class EmergencyController {
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_ASSIGNED = "ASSIGNED";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_ARRIVED = "ARRIVED";
    private static final String STATUS_CLOSED = "CLOSED";
    private static final String STATUS_NO_RESPONDER = "NO RESPONDER AVAILABLE";

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
    private AuditLogService auditLogService;

    @Autowired
    private WebSocketService webSocketService;

    @GetMapping
    public List<Emergency> getAll() {
        return emergencyRepository.findAll();
    }

    @PostMapping
    public Emergency create(@RequestBody Emergency emergency, Authentication authentication,
                            HttpServletRequest request) {
        Emergency saved = createEmergencyRecord(emergency);
        auditLogService.log(
            actor(authentication),
            "EMERGENCY_CREATED",
            "EMERGENCY",
            String.valueOf(saved.getId()),
            "Emergency created with status " + saved.getStatus(),
            true,
            request.getRemoteAddr()
        );
        webSocketService.notifyNewEmergency(saved);
        return saved;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication authentication, HttpServletRequest request) {
        emergencyRepository.deleteById(id);
        auditLogService.log(
            actor(authentication),
            "EMERGENCY_DELETED",
            "EMERGENCY",
            String.valueOf(id),
            "Emergency deleted",
            true,
            request.getRemoteAddr()
        );
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id, Authentication authentication,
                                    HttpServletRequest request) {
        return updateWorkflowStatus(id, STATUS_ASSIGNED, STATUS_ACCEPTED, authentication, request);
    }

    @PostMapping("/{id}/arrive")
    public ResponseEntity<?> arrive(@PathVariable Long id, Authentication authentication,
                                    HttpServletRequest request) {
        return updateWorkflowStatus(id, STATUS_ACCEPTED, STATUS_ARRIVED, authentication, request);
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<?> close(@PathVariable Long id, Authentication authentication,
                                   HttpServletRequest request) {
        var emergencyOpt = emergencyRepository.findById(id);
        if (emergencyOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Emergency emergency = emergencyOpt.get();
        ResponseEntity<?> accessDenied = validateEmergencyAccess(emergency, authentication);
        if (accessDenied != null) {
            auditLogService.log(
                actor(authentication),
                "EMERGENCY_CLOSE",
                "EMERGENCY",
                String.valueOf(id),
                "Close denied: " + accessDenied.getBody(),
                false,
                request.getRemoteAddr()
            );
            return accessDenied;
        }

        if (!STATUS_ARRIVED.equals(emergency.getStatus())) {
            auditLogService.log(
                actor(authentication),
                "EMERGENCY_CLOSE",
                "EMERGENCY",
                String.valueOf(id),
                "Close denied because emergency is in status " + emergency.getStatus(),
                false,
                request.getRemoteAddr()
            );
            return ResponseEntity.badRequest().body(
                Map.of("error", "Only arrived emergencies can be closed")
            );
        }

        emergency.setStatus(STATUS_CLOSED);
        releaseResponder(emergency.getResponderId());

        Emergency saved = emergencyRepository.save(emergency);
        auditLogService.log(
            actor(authentication),
            "EMERGENCY_CLOSE",
            "EMERGENCY",
            String.valueOf(saved.getId()),
            "Emergency closed",
            true,
            request.getRemoteAddr()
        );
        webSocketService.notifyNewEmergency(saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/sos")
    public Emergency sos(@RequestBody Emergency emergency, HttpServletRequest request) {
        Emergency saved = createEmergencyRecord(emergency);
        auditLogService.log(
            "PUBLIC_SOS",
            "EMERGENCY_SOS",
            "EMERGENCY",
            String.valueOf(saved.getId()),
            "SOS created with status " + saved.getStatus(),
            true,
            request.getRemoteAddr()
        );
        webSocketService.notifyNewEmergency(saved);
        return saved;
    }

    private Emergency createEmergencyRecord(Emergency emergency) {
        emergency.setStatus(STATUS_PENDING);

        String description = emergency.getType();
        String severity = aiService.classifySeverity(description);
        emergency.setSeverity(severity);

        List<FirstResponder> responders = responderRepository.findAll();
        FirstResponder bestResponder = scoringService.findBestResponder(
            responders,
            emergency.getLatitude(),
            emergency.getLongitude()
        );

        if (bestResponder != null) {
            emergency.setStatus(STATUS_ASSIGNED);
            emergency.setResponderId(bestResponder.getId());
            emergency.setResponderName(bestResponder.getName());

            bestResponder.setAvailable(false);
            responderRepository.save(bestResponder);
            notificationService.notifyResponder(bestResponder);
        } else {
            emergency.setStatus(STATUS_NO_RESPONDER);
            emergency.setResponderId(null);
            emergency.setResponderName(null);
        }

        var hospitals = hospitalRepository.findAll();
        var bestHospital = hospitalService.findNearestHospital(
            hospitals,
            emergency.getLatitude(),
            emergency.getLongitude()
        );

        if (bestHospital != null) {
            emergency.setHospitalName(bestHospital.getName());
        }

        return emergencyRepository.save(emergency);
    }

    private ResponseEntity<?> updateWorkflowStatus(Long id, String expectedStatus, String nextStatus,
                                                   Authentication authentication,
                                                   HttpServletRequest request) {
        var emergencyOpt = emergencyRepository.findById(id);
        if (emergencyOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Emergency emergency = emergencyOpt.get();
        ResponseEntity<?> accessDenied = validateEmergencyAccess(emergency, authentication);
        if (accessDenied != null) {
            auditLogService.log(
                actor(authentication),
                "EMERGENCY_" + nextStatus,
                "EMERGENCY",
                String.valueOf(id),
                "Status update denied: " + accessDenied.getBody(),
                false,
                request.getRemoteAddr()
            );
            return accessDenied;
        }

        if (!expectedStatus.equals(emergency.getStatus())) {
            auditLogService.log(
                actor(authentication),
                "EMERGENCY_" + nextStatus,
                "EMERGENCY",
                String.valueOf(id),
                "Status update denied because current status is " + emergency.getStatus(),
                false,
                request.getRemoteAddr()
            );
            return ResponseEntity.badRequest().body(
                Map.of("error", "Emergency must be in " + expectedStatus + " status")
            );
        }

        emergency.setStatus(nextStatus);
        Emergency saved = emergencyRepository.save(emergency);
        auditLogService.log(
            actor(authentication),
            "EMERGENCY_" + nextStatus,
            "EMERGENCY",
            String.valueOf(saved.getId()),
            "Emergency moved from " + expectedStatus + " to " + nextStatus,
            true,
            request.getRemoteAddr()
        );
        webSocketService.notifyNewEmergency(saved);
        return ResponseEntity.ok(saved);
    }

    private void releaseResponder(Long responderId) {
        if (responderId == null) {
            return;
        }

        responderRepository.findById(responderId).ifPresent(responder -> {
            responder.setAvailable(true);
            responderRepository.save(responder);
        });
    }

    private ResponseEntity<?> validateEmergencyAccess(Emergency emergency, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        if (isAdmin(authentication)) {
            return null;
        }

        var responderOpt = responderRepository.findByUsername(authentication.getName());
        if (responderOpt.isEmpty()) {
            return ResponseEntity.status(403).body(
                Map.of("error", "Responder profile not linked to this account")
            );
        }

        FirstResponder responder = responderOpt.get();
        if (emergency.getResponderId() == null || !emergency.getResponderId().equals(responder.getId())) {
            return ResponseEntity.status(403).body(
                Map.of("error", "Only the assigned responder can update this emergency")
            );
        }

        return null;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
            .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private String actor(Authentication authentication) {
        return authentication != null ? authentication.getName() : "ANONYMOUS";
    }
}
