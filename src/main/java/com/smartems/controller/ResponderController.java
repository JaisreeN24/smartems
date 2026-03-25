package com.smartems.controller;

import java.util.List;

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

import com.smartems.model.FirstResponder;
import com.smartems.repository.ResponderRepository;

@RestController
@RequestMapping("/responders")
@CrossOrigin(origins = "*")
public class ResponderController {
    @Autowired
    private ResponderRepository responderRepository;

    @GetMapping
    public List<FirstResponder> getAll() { return responderRepository.findAll(); }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        return responderRepository.findByUsername(authentication.getName())
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public FirstResponder create(@RequestBody FirstResponder responder) { return responderRepository.save(responder); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { responderRepository.deleteById(id); }
}
