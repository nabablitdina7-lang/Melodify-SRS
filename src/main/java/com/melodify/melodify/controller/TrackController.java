package com.melodify.melodify.controller;

import com.melodify.melodify.model.Track;
import com.melodify.melodify.service.TrackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracks")
public class TrackController {

    private final TrackService trackService;

    public TrackController(TrackService trackService) {
        this.trackService = trackService;
    }

    // Add new track (metadata only for now)
    @PostMapping
    public ResponseEntity<Track> addTrack(@RequestBody Track track) {
        Track saved = trackService.saveTrack(track);
        return ResponseEntity.ok(saved);
    }

    // Get all tracks
    @GetMapping
    public ResponseEntity<List<Track>> getAllTracks() {
        return ResponseEntity.ok(trackService.getAllTracks());
    }

    // Search by title
    @GetMapping("/search/title")
    public ResponseEntity<List<Track>> searchByTitle(@RequestParam String title) {
        return ResponseEntity.ok(trackService.searchByTitle(title));
    }

    // Search by artist
    @GetMapping("/search/artist")
    public ResponseEntity<List<Track>> searchByArtist(@RequestParam String artist) {
        return ResponseEntity.ok(trackService.searchByArtist(artist));
    }
}