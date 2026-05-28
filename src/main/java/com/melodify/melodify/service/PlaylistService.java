package com.melodify.melodify.service;

import com.melodify.melodify.model.Playlist;
import com.melodify.melodify.model.Track;
import com.melodify.melodify.repository.PlaylistRepository;
import com.melodify.melodify.repository.TrackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final TrackRepository trackRepository;

    public PlaylistService(PlaylistRepository playlistRepository, TrackRepository trackRepository) {
        this.playlistRepository = playlistRepository;
        this.trackRepository = trackRepository;
    }

    public Playlist createPlaylist(Playlist playlist) {
        return playlistRepository.save(playlist);
    }

    public List<Playlist> getAllPlaylists() {
        return playlistRepository.findAll();
    }

    public Playlist getPlaylistById(Long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));
    }

    public Playlist addTrackToPlaylist(Long playlistId, Long trackId) {
    try {
        System.out.println("=== Adding track to playlist ===");
        System.out.println("Playlist ID: " + playlistId);
        System.out.println("Track ID: " + trackId);
        
        Playlist playlist = getPlaylistById(playlistId);
        System.out.println("Playlist found: " + playlist.getName());
        
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new RuntimeException("Track not found"));
        System.out.println("Track found: " + track.getTitle());
        
        if (!playlist.getTracks().contains(track)) {
            playlist.getTracks().add(track);
            System.out.println("Track added to playlist");
        }
        
        Playlist saved = playlistRepository.save(playlist);
        System.out.println("Saved successfully");
        return saved;
        
    } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException("Error adding track to playlist: " + e.getMessage());
    }
}

@Transactional
public Playlist removeTrackFromPlaylist(Long playlistId, Long trackId) {
    Playlist playlist = getPlaylistById(playlistId);
    Track track = trackRepository.findById(trackId)
            .orElseThrow(() -> new RuntimeException("Track not found"));

    playlist.getTracks().remove(track);
    
    return playlistRepository.save(playlist);
}

    // NEW: Delete entire playlist
    @Transactional
    public void deletePlaylist(Long playlistId) {
        Playlist playlist = getPlaylistById(playlistId);
        playlistRepository.delete(playlist);
    }

    // NEW: Update playlist name
    public Playlist updatePlaylistName(Long playlistId, String newName) {
        Playlist playlist = getPlaylistById(playlistId);
        playlist.setName(newName);
        return playlistRepository.save(playlist);
    }


    
}