package com.melodify.melodify.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.melodify.melodify.model.Track;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIRecommendationService {

    private final TrackService trackService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public AIRecommendationService(TrackService trackService) {
        this.trackService = trackService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public List<Track> getRecommendedTracks(String userEmail) {
        try {
            // Get user's liked tracks
            List<Track> likedTracks = trackService.getAllTracks().stream()
                    .filter(Track::isLiked)
                    .collect(Collectors.toList());

            if (likedTracks.isEmpty()) {
                return getDefaultRecommendations();
            }

            // Get all tracks
            List<Track> allTracks = trackService.getAllTracks();
            
            // Get AI recommended genres/artists
            List<String> aiSuggestions = getAISuggestions(likedTracks);
            
            // Find songs in library that match AI suggestions
            List<Track> recommendedTracks = findMatchingTracks(allTracks, aiSuggestions, likedTracks);
            
            return recommendedTracks;
            
        } catch (Exception e) {
            e.printStackTrace();
            return getDefaultRecommendations();
        }
    }
    
    private List<String> getAISuggestions(List<Track> likedTracks) {
        // Build user profile
        Map<String, Object> userProfile = buildUserProfile(likedTracks);
        
        // Build prompt
        String prompt = buildPrompt(userProfile);
        
        // Call Gemini API
        String aiResponse = callGeminiAPI(prompt);
        
        // Parse recommendations
        return parseRecommendations(aiResponse);
    }
    
    private List<Track> findMatchingTracks(List<Track> allTracks, List<String> suggestions, List<Track> likedTracks) {
        Set<Track> recommendations = new LinkedHashSet<>();
        Set<Long> likedIds = likedTracks.stream().map(Track::getId).collect(Collectors.toSet());
        
        for (String suggestion : suggestions) {
            String lowerSuggestion = suggestion.toLowerCase();
            
            for (Track track : allTracks) {
               
                if (likedIds.contains(track.getId())) continue;
                
                if ((track.getGenre() != null && track.getGenre().toLowerCase().contains(lowerSuggestion)) ||
                    (track.getArtist() != null && track.getArtist().toLowerCase().contains(lowerSuggestion)) ||
                    (track.getTitle() != null && track.getTitle().toLowerCase().contains(lowerSuggestion))) {
                    recommendations.add(track);
                    if (recommendations.size() >= 6) break;
                }
            }
            if (recommendations.size() >= 6) break;
        }
        
        if (recommendations.size() < 6) {
            List<Track> unlikedTracks = allTracks.stream()
                    .filter(t -> !likedIds.contains(t.getId()))
                    .collect(Collectors.toList());
            Collections.shuffle(unlikedTracks);
            for (Track track : unlikedTracks) {
                recommendations.add(track);
                if (recommendations.size() >= 6) break;
            }
        }
        
        return new ArrayList<>(recommendations);
    }
    
    private List<Track> getDefaultRecommendations() {
        List<Track> allTracks = trackService.getAllTracks();
        if (allTracks.size() > 6) {
            Collections.shuffle(allTracks);
            return allTracks.subList(0, Math.min(6, allTracks.size()));
        }
        return allTracks;
    }

    private Map<String, Object> buildUserProfile(List<Track> likedTracks) {
        Map<String, Object> profile = new HashMap<>();
        Map<String, Integer> artistCount = new HashMap<>();
        Map<String, Integer> genreCount = new HashMap<>();
        
        for (Track track : likedTracks) {
            if (track.getArtist() != null) {
                artistCount.merge(track.getArtist(), 1, Integer::sum);
            }
            if (track.getGenre() != null) {
                genreCount.merge(track.getGenre(), 1, Integer::sum);
            }
        }
        
        List<String> topArtists = artistCount.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        List<String> topGenres = genreCount.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        profile.put("topArtists", topArtists);
        profile.put("topGenres", topGenres);
        
        return profile;
    }

    private String buildPrompt(Map<String, Object> userProfile) {
        return String.format("""
            You are a music recommendation expert. Based on the user's liked songs, suggest 6 music genres or artists that match their taste.
            
            User's favorite artists: %s
            User's favorite genres: %s
            
            Return ONLY a JSON array of 6 recommendations in this format:
            ["Genre or Artist 1", "Genre or Artist 2", "Genre or Artist 3", "Genre or Artist 4", "Genre or Artist 5", "Genre or Artist 6"]
            
            Make recommendations specific (e.g., "Rock", "Pop", "Taylor Swift", "Electronic").
            """,
            userProfile.get("topArtists"),
            userProfile.get("topGenres")
        );
    }

    private String callGeminiAPI(String prompt) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + geminiApiKey;
            
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", new Object[]{part});
            requestBody.put("contents", new Object[]{content});
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                return jsonResponse.path("candidates")
                        .path(0)
                        .path("content")
                        .path("parts")
                        .path(0)
                        .path("text")
                        .asText();
            }
            
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
        }
        return "[\"Rock\", \"Pop\", \"Electronic\", \"Jazz\", \"Indie\", \"Classical\"]";
    }

    private List<String> parseRecommendations(String aiResponse) {
        try {
            String cleanResponse = aiResponse
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();
            
            JsonNode jsonArray = objectMapper.readTree(cleanResponse);
            List<String> recommendations = new ArrayList<>();
            
            for (JsonNode node : jsonArray) {
                recommendations.add(node.asText());
            }
            
            return recommendations;
            
        } catch (Exception e) {
            return Arrays.asList("Rock", "Pop", "Electronic", "Jazz", "Indie", "Classical");
        }
    }
}