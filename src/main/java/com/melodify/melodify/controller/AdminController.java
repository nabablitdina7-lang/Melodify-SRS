package com.melodify.melodify.controller;

import com.melodify.melodify.model.User;
import com.melodify.melodify.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // THIS ENDPOINT MUST HAVE @PreAuthorize
    @GetMapping("/check")
    @PreAuthorize("hasRole('ADMIN')")  // ← ADD THIS LINE
    public ResponseEntity<Map<String, Boolean>> checkAdmin() {
        Map<String, Boolean> response = new HashMap<>();
        response.put("isAdmin", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/make-admin/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> makeAdmin(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole("ADMIN");
        userRepository.save(user);
        return ResponseEntity.ok("User " + user.getEmail() + " is now an ADMIN");
    }
}