package com.smartems.controller;

import com.smartems.model.FirstResponder;
import com.smartems.repository.ResponderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/responders")
@CrossOrigin(origins = "*")
public class ResponderController {
    @Autowired
    private ResponderRepository responderRepository;

    @GetMapping
    public List<FirstResponder> getAll() { return responderRepository.findAll(); }

    @PostMapping
    public FirstResponder create(@RequestBody FirstResponder responder) { return responderRepository.save(responder); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { responderRepository.deleteById(id); }
}
