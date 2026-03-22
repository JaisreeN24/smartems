package com.smartems.controller;

import com.smartems.model.Hospital;
import com.smartems.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/hospitals")
@CrossOrigin(origins = "*")
public class HospitalController {
    @Autowired
    private HospitalRepository hospitalRepository;

    @GetMapping
    public List<Hospital> getAll() { return hospitalRepository.findAll(); }

    @PostMapping
    public Hospital create(@RequestBody Hospital hospital) { return hospitalRepository.save(hospital); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { hospitalRepository.deleteById(id); }
}