package com.melodify.melodify.controller;

import com.melodify.melodify.config.JwtUtil;
import com.melodify.melodify.model.LoginRequest;
import com.melodify.melodify.model.User;
import com.melodify.melodify.service.UserService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    // Constructor - MAKE SURE THIS EXISTS
    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body("Registration failed: " + e.getMessage());
        }
    }

    @GetMapping("/test")
    public String test() {
        return "AuthController is working";
    }

    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
        User user = userService.login(request.getEmail(), request.getPassword());
        
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
            user.getEmail(), 
            user.getPassword(), 
            new ArrayList<>()
        );
        
        String token = jwtUtil.generateToken(userDetails);
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", user.getEmail());
        response.put("id", user.getId());
        
        return ResponseEntity.ok(response);
        
    } catch (RuntimeException e) {
        // Return proper error message
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", e.getMessage());
        return ResponseEntity.status(401).body(errorResponse);
    }
}
}

