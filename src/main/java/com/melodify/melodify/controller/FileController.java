package com.melodify.melodify.controller;

import com.melodify.melodify.model.Track;
import com.melodify.melodify.service.TrackService;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.mp3.Mp3Parser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.helpers.DefaultHandler;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final TrackService trackService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public FileController(TrackService trackService) {
        this.trackService = trackService;
    }

   // =========================
// UPLOAD FILE WITH ID3 METADATA EXTRACTION + COMPOSER/STUDIO
// =========================
@PostMapping("/upload")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<String> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam(value = "artist", required = false) String artist,
        @RequestParam(value = "genre", required = false) String genre,
        @RequestParam(value = "composer", required = false) String composer,
        @RequestParam(value = "studio", required = false) String studio
) {
    try {
        String projectDir = System.getProperty("user.dir");
        File uploadPath = new File(projectDir + "/uploads");

        if (!uploadPath.exists()) {
            uploadPath.mkdirs();
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        File destination = new File(uploadPath, fileName);
        file.transferTo(destination);

        Track track = new Track();
        
        // Auto-extract metadata from MP3 file
        try (InputStream input = file.getInputStream()) {
            DefaultHandler handler = new DefaultHandler();
            Metadata metadata = new Metadata();
            Mp3Parser parser = new Mp3Parser();
            ParseContext parseContext = new ParseContext();
            parser.parse(input, handler, metadata, parseContext);
            
            // Extract ID3 tags
            String extractedTitle = metadata.get("title");
            String extractedArtist = metadata.get("xmpDM:artist");
            String extractedGenre = metadata.get("xmpDM:genre");
            
            // Use extracted values if available, otherwise use user input or fallback
            track.setTitle((extractedTitle != null && !extractedTitle.isEmpty()) 
                ? extractedTitle : (title != null ? title : file.getOriginalFilename().replace(".mp3", "")));
            
            track.setArtist((extractedArtist != null && !extractedArtist.isEmpty()) 
                ? extractedArtist : (artist != null ? artist : "Unknown Artist"));
            
            track.setGenre((extractedGenre != null && !extractedGenre.isEmpty()) 
                ? extractedGenre : (genre != null ? genre : "Unknown"));
            
            System.out.println("Extracted Metadata - Title: " + extractedTitle + ", Artist: " + extractedArtist + ", Genre: " + extractedGenre);
            
        } catch (Exception e) {
            System.out.println("Could not extract ID3 metadata: " + e.getMessage());
            // Fallback to user input or filename
            track.setTitle((title != null && !title.isEmpty()) ? title : file.getOriginalFilename().replace(".mp3", ""));
            track.setArtist((artist != null && !artist.isEmpty()) ? artist : "Unknown Artist");
            track.setGenre((genre != null && !genre.isEmpty()) ? genre : "Unknown");
        }
        
        // Set composer and studio metadata
        track.setComposer(composer != null && !composer.isEmpty() ? composer : "Unknown");
        track.setStudio(studio != null && !studio.isEmpty() ? studio : "Unknown");
        track.setFilePath(fileName);
        track.setLiked(false);

        trackService.saveTrack(track);

        return ResponseEntity.ok("File uploaded successfully! Metadata auto-extracted.");

    } catch (IOException e) {
        return ResponseEntity.status(500)
                .body("Upload failed: " + e.getMessage());
    }
}

    // =========================
    // BYTE-RANGE STREAMING (supports seeking)
    // =========================
    @GetMapping("/play/{filename}")
public ResponseEntity<byte[]> streamAudio(
        @PathVariable String filename,
        @RequestHeader(value = "Range", required = false) String rangeHeader
) {
    try {
        // Decode the filename (handle URL encoding)
        String decodedFilename = java.net.URLDecoder.decode(filename, "UTF-8");
        
        String projectDir = System.getProperty("user.dir");
        File audioFile = new File(projectDir + "/uploads/" + decodedFilename);

        System.out.println("Looking for file: " + audioFile.getAbsolutePath());
        
        if (!audioFile.exists()) {
            System.out.println("File not found: " + audioFile.getAbsolutePath());
            return ResponseEntity.notFound().build();
        }

        long fileSize = audioFile.length();
        String contentType = "audio/mpeg";

        // If no Range header, return full file
        if (rangeHeader == null) {
            byte[] fullFile = java.nio.file.Files.readAllBytes(audioFile.toPath());
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Accept-Ranges", "bytes")
                    .header("Content-Length", String.valueOf(fileSize))
                    .body(fullFile);
        }

        // Parse Range header
        String rangeValue = rangeHeader.replace("bytes=", "");
        String[] ranges = rangeValue.split("-");
        
        long start = Long.parseLong(ranges[0]);
        long end = ranges.length > 1 ? Long.parseLong(ranges[1]) : fileSize - 1;
        
        if (start >= fileSize || end >= fileSize || start > end) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).build();
        }
        
        long contentLength = end - start + 1;
        
        RandomAccessFile raf = new RandomAccessFile(audioFile, "r");
        raf.seek(start);
        byte[] partialData = new byte[(int) contentLength];
        raf.readFully(partialData);
        raf.close();
        
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header("Content-Type", contentType)
                .header("Accept-Ranges", "bytes")
                .header("Content-Range", String.format("bytes %d-%d/%d", start, end, fileSize))
                .header("Content-Length", String.valueOf(contentLength))
                .body(partialData);
                
    } catch (IOException e) {
        e.printStackTrace();
        return ResponseEntity.status(500).build();
    }
}

    // =========================
    // GET ALL SONGS
    // =========================
    @GetMapping("/all")
    public List<Track> getAllTracks() {
        return trackService.getAllTracks();
    }

    // =========================
    // SEARCH SONGS
    // =========================
    @GetMapping("/search")
    public List<Track> searchTracks(@RequestParam String keyword) {
        List<Track> byTitle = trackService.searchByTitle(keyword);
        List<Track> byArtist = trackService.searchByArtist(keyword);
        // Combine and remove duplicates
        byTitle.addAll(byArtist);
        return byTitle.stream().distinct().toList();
    }

    // =========================
    // LIKE SONG
    // =========================
    @PutMapping("/like/{id}")
    public ResponseEntity<String> likeTrack(@PathVariable Long id) {
        Track track = trackService.getById(id);
        track.setLiked(!track.isLiked());
        trackService.saveTrack(track);
        return ResponseEntity.ok("Updated like status");
    }

    @DeleteMapping("/delete/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<String> deleteSong(@PathVariable Long id) {
    try {
        Track track = trackService.getById(id);
        // Delete file from uploads folder
        String projectDir = System.getProperty("user.dir");
        File fileToDelete = new File(projectDir + "/uploads/" + track.getFilePath());
        if (fileToDelete.exists()) {
            fileToDelete.delete();
        }
        // Delete from database
        trackService.deleteTrack(id);
        return ResponseEntity.ok("Song deleted successfully");
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Delete failed: " + e.getMessage());
    }
}
}