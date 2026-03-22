package com.smartems.controller;

import com.smartems.model.Emergency;
import com.smartems.repository.EmergencyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/emergencies")
@CrossOrigin(origins = "*")
public class EmergencyController {
    @Autowired
    private EmergencyRepository emergencyRepository;

    @GetMapping
    public List<Emergency> getAll() { return emergencyRepository.findAll(); }

    @PostMapping
    public Emergency create(@RequestBody Emergency emergency) { return emergencyRepository.save(emergency); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { emergencyRepository.deleteById(id); }
}