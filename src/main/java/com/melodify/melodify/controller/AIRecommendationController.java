package com.melodify.melodify.controller;

import com.melodify.melodify.model.Track;
import com.melodify.melodify.service.AIRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIRecommendationController {

    private final AIRecommendationService recommendationService;

    public AIRecommendationController(AIRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String userEmail = userDetails.getUsername();
        List<Track> recommendedTracks = recommendationService.getRecommendedTracks(userEmail);
        
        Map<String, Object> response = new HashMap<>();
        response.put("recommendations", recommendedTracks);
        response.put("count", recommendedTracks.size());
        
        return ResponseEntity.ok(response);
    }
}