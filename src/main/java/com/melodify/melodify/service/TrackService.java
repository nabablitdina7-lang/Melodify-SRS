package com.melodify.melodify.service;

import com.melodify.melodify.model.Track;
import com.melodify.melodify.repository.TrackRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TrackService {

    private final TrackRepository trackRepository;

    public TrackService(TrackRepository trackRepository) {
        this.trackRepository = trackRepository;
    }

    public Track saveTrack(Track track) {
        return trackRepository.save(track);
    }

    public List<Track> getAllTracks() {
        return trackRepository.findAll();
    }

    public List<Track> searchByTitle(String title) {
        return trackRepository.findByTitleContainingIgnoreCase(title);
    }

    public List<Track> searchByArtist(String artist) {
        return trackRepository.findByArtistContainingIgnoreCase(artist);
    }

    public Track getById(Long id) {
    return trackRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Track not found"));
}

public void deleteTrack(Long id) {
    trackRepository.deleteById(id);
}


}