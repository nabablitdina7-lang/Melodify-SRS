package com.melodify.melodify.controller;

import com.melodify.melodify.model.Playlist;
import com.melodify.melodify.service.PlaylistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @PostMapping("/create")
    public ResponseEntity<Playlist> create(@RequestBody Playlist playlist) {
        return ResponseEntity.ok(playlistService.createPlaylist(playlist));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Playlist>> getAll() {
        return ResponseEntity.ok(playlistService.getAllPlaylists());
    }

    @GetMapping("/{id}")
public ResponseEntity<Playlist> getPlaylistById(@PathVariable Long id) {
    Playlist playlist = playlistService.getPlaylistById(id);
    return ResponseEntity.ok(playlist);
}

    @PostMapping("/{playlistId}/add/{trackId}")
    public ResponseEntity<Playlist> addTrackToPlaylist(
            @PathVariable Long playlistId,
            @PathVariable Long trackId
    ) {
        return ResponseEntity.ok(playlistService.addTrackToPlaylist(playlistId, trackId));
    }

    // NEW: Remove track from playlist
    @DeleteMapping("/{playlistId}/remove/{trackId}")
public ResponseEntity<Playlist> removeTrackFromPlaylist(
        @PathVariable Long playlistId,
        @PathVariable Long trackId
) {
    return ResponseEntity.ok(playlistService.removeTrackFromPlaylist(playlistId, trackId));
}

    // NEW: Delete entire playlist
    @DeleteMapping("/{playlistId}")
    public ResponseEntity<String> deletePlaylist(@PathVariable Long playlistId) {
        playlistService.deletePlaylist(playlistId);
        return ResponseEntity.ok("Playlist deleted successfully");
    }

    // NEW: Update playlist name
    @PutMapping("/{playlistId}")
    public ResponseEntity<Playlist> updatePlaylistName(
            @PathVariable Long playlistId,
            @RequestBody Map<String, String> request
    ) {
        String newName = request.get("name");
        return ResponseEntity.ok(playlistService.updatePlaylistName(playlistId, newName));
    }
}