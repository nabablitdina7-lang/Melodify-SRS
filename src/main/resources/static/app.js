// ========== CHECK LOGIN STATUS ==========
if (!localStorage.getItem("authToken")) {
    window.location.href = "login.html";
}

// ========== GLOBAL VARIABLES ==========
let songs = [];
let currentIndex = 0;
let authToken = localStorage.getItem("authToken");
let currentUser = localStorage.getItem("currentUser");
let isPlaying = false;
let currentSongId = null;

// ========== HELPER FUNCTIONS ==========
async function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`http://localhost:8080${url}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        console.log("Authentication failed, logging out");
        logout();
        throw new Error("Please login again");
    }
    
    if (response.status === 403) {
        console.log("Access forbidden (not admin or insufficient permissions)");
    }
    
    return response;
}

function displayUserInfo() {
    const userInfoDiv = document.getElementById("userInfo");
    if (userInfoDiv && currentUser) {
        userInfoDiv.innerHTML = `
            <div class="user-info-sidebar">
                <i class="fas fa-user-circle"></i>
                <span>${currentUser}</span>
            </div>
        `;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

function playSong(file, index) {
    if (!file) {
        console.error("No file path for song");
        return;
    }
    
    currentIndex = index;
    currentSongId = songs[index]?.id;
    let audio = document.getElementById("audioPlayer");
    
    let filename = file;
    if (file.includes("\\") || file.includes("/")) {
        filename = file.split(/[\\/]/).pop();
    }
    
    const encodedFile = encodeURIComponent(filename);
    const audioUrl = `http://localhost:8080/api/files/play/${encodedFile}`;
    
    audio.src = audioUrl;
    audio.load();
    
    // Remove old listeners
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
    audio.onended = null;
    
    // Add new listeners
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', function() {
        nextSong();
        updatePlayPauseButton();
    });
    
    audio.play().then(() => {
        isPlaying = true;
        updatePlayPauseButton();
    }).catch(error => {
        console.error("Playback failed:", error);
    });
    
    // Update UI
    const song = songs[currentIndex];
    document.getElementById("nowPlaying").innerText = song?.title || "Unknown";
    document.getElementById("currentArtist").innerText = song?.artist || "Unknown Artist";
    
    // Update like button
    const likeBtn = document.getElementById("likeCurrentSong");
    if (likeBtn && song) {
        likeBtn.style.display = "flex";
        likeBtn.innerHTML = song.liked ? '<i class="fas fa-heart" style="color: #1db954;"></i>' : '<i class="far fa-heart"></i>';
        likeBtn.onclick = (e) => {
            e.stopPropagation();
            likeCurrentSong();
        };
    }
    
    document.querySelector(".song-artwork i").style.color = "#1db954";
}

async function likeCurrentSong() {
    if (!currentSongId) return;
    try {
        await authFetch("/api/files/like/" + currentSongId, { method: "PUT" });
        await loadSongs();
        const song = songs.find(s => s.id === currentSongId);
        const likeBtn = document.getElementById("likeCurrentSong");
        if (likeBtn && song) {
            likeBtn.innerHTML = song.liked ? '<i class="fas fa-heart" style="color: #1db954;"></i>' : '<i class="far fa-heart"></i>';
        }
    } catch (error) {
        console.error("Error liking song:", error);
    }
}

function updateProgress() {
    const audio = document.getElementById("audioPlayer");
    const progressFill = document.getElementById("progressFill");
    const currentTimeSpan = document.getElementById("currentTime");
    
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        const percent = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = percent + "%";
        
        const minutes = Math.floor(audio.currentTime / 60);
        const seconds = Math.floor(audio.currentTime % 60);
        if (currentTimeSpan) currentTimeSpan.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateDuration() {
    const audio = document.getElementById("audioPlayer");
    const durationSpan = document.getElementById("duration");
    
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        if (durationSpan) durationSpan.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function seek(event) {
    const progressBar = document.getElementById("progressBar");
    const audio = document.getElementById("audioPlayer");
    
    if (!progressBar || !audio) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percent = clickX / width;
    
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        audio.currentTime = percent * audio.duration;
    }
}

function togglePlayPause() {
    const audio = document.getElementById("audioPlayer");
    
    if (audio.paused) {
        audio.play();
        isPlaying = true;
    } else {
        audio.pause();
        isPlaying = false;
    }
    updatePlayPauseButton();
}

function updatePlayPauseButton() {
    const playPauseBtn = document.getElementById("playPauseBtn");
    const audio = document.getElementById("audioPlayer");
    
    if (!playPauseBtn) return;
    
    if (audio && !audio.paused && !audio.ended) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function setupVolumeControl() {
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeIcon = document.getElementById("volumeIcon");
    const audio = document.getElementById("audioPlayer");
    
    if (volumeSlider && audio) {
        volumeSlider.addEventListener("input", function() {
            const value = this.value / 100;
            audio.volume = value;
            
            if (value == 0) {
                volumeIcon.className = "fas fa-volume-mute";
            } else if (value < 0.5) {
                volumeIcon.className = "fas fa-volume-down";
            } else {
                volumeIcon.className = "fas fa-volume-up";
            }
        });
    }
    
    if (volumeIcon && audio) {
        volumeIcon.addEventListener("click", function() {
            if (audio.volume > 0) {
                audio.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
                volumeIcon.className = "fas fa-volume-mute";
            } else {
                audio.volume = 0.7;
                if (volumeSlider) volumeSlider.value = 70;
                volumeIcon.className = "fas fa-volume-up";
            }
        });
    }
}

function nextSong() {
    if (currentIndex < songs.length - 1) {
        currentIndex++;
        playSong(songs[currentIndex].filePath, currentIndex);
        updatePlayPauseButton();
    }
}

function prevSong() {
    if (currentIndex > 0) {
        currentIndex--;
        playSong(songs[currentIndex].filePath, currentIndex);
        updatePlayPauseButton();
    }
}

// ========== SONG LIST FUNCTIONS ==========
async function loadSongs() {
    try {
        let response = await authFetch("/api/files/all");
        const data = await response.json();
        songs = Array.isArray(data) ? data : [];
        displaySongs(songs);
    } catch (error) {
        console.error("Error loading songs:", error);
        songs = [];
    }
}

function displaySongs(songsToDisplay) {
    let container = document.getElementById("songList");
    if (!container) return;
    
    container.innerHTML = "";

    if (!songsToDisplay || songsToDisplay.length === 0) {
        container.innerHTML = "<p>No songs found. Upload some MP3 files!</p>";
        return;
    }

    songsToDisplay.forEach((song, index) => {
        let div = document.createElement("div");
        div.className = "song";
        div.innerHTML = `
            <div>
                <div class="song-title"><i class="fas fa-music" style="margin-right: 8px;"></i> ${song.title || "Unknown"}</div>
                <div class="song-artist">${song.artist || "Unknown"}</div>
            </div>
            <div>
                <button onclick="likeSong(event, ${song.id})" class="like-btn ${song.liked ? 'liked' : ''}">
                    <i class="fas fa-heart"></i>
                </button>
                <button onclick="addToPlaylist(${song.id}, event)" class="playlist-btn">
                    <i class='fas fa-plus'></i> Playlist
                </button>
            </div>
        `;
        div.onclick = function (e) {
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                playSong(song.filePath, index);
            }
        };
        container.appendChild(div);
    });
}

async function searchSongs(keyword) {
    if (keyword.trim() === "") {
        loadSongs();
        return;
    }

    try {
        let response = await authFetch("/api/files/search?keyword=" + keyword);
        const data = await response.json();
        songs = Array.isArray(data) ? data : [];
        displaySongs(songs);
    } catch (error) {
        console.error("Error searching songs:", error);
    }
}

async function likeSong(event, id) {
    event.stopPropagation();
    try {
        await authFetch("/api/files/like/" + id, { method: "PUT" });
        await loadSongs();
    } catch (error) {
        console.error("Error liking song:", error);
    }
}

// ========== PLAYLIST FUNCTIONS ==========
async function loadPlaylists() {
    try {
        let res = await authFetch("/api/playlists/all");
        let playlists = await res.json();
        
        if (!Array.isArray(playlists)) {
            playlists = [];
        }

        let container = document.getElementById("playlistList");
        if (container) {
            container.innerHTML = "";
            if (playlists.length === 0) {
                container.innerHTML = "<p>No playlists yet. Create one!</p>";
            }
            playlists.forEach(p => {
                let div = document.createElement("div");
                div.className = "playlist-item";
                div.innerHTML = `
                    <div class="playlist-info" onclick="loadPlaylistSongs(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                        <i class="fas fa-list"></i>
                        <span class="playlist-name">${escapeHtml(p.name) || "Unnamed Playlist"}</span>
                        <span class="playlist-count">${p.tracks ? p.tracks.length : 0} songs</span>
                    </div>
                    <div class="playlist-actions">
                        <button class="playlist-rename-btn" onclick="event.stopPropagation(); renamePlaylist(${p.id}, '${escapeHtml(p.name)}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="playlist-delete-btn" onclick="event.stopPropagation(); deletePlaylist(${p.id}, '${escapeHtml(p.name)}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error("Error loading playlists:", error);
    }
}

async function loadPlaylistSongs(playlist) {
    let container = document.getElementById("playlistSongs");
    if (!container) return;
    
    window.currentPlaylistId = playlist.id;
    container.innerHTML = "";

    if (!playlist.tracks || playlist.tracks.length === 0) {
        container.innerHTML = "<p>No songs in this playlist</p>";
        return;
    }

    playlist.tracks.forEach(song => {
        let div = document.createElement("div");
        div.className = "song";
        div.innerHTML = `
            <i class='fas fa-play-circle' style='margin-right: 10px;'></i> 
            ${song.title || "Unknown"} - ${song.artist || "Unknown"} 
            <button class="remove-btn" onclick="removeFromPlaylist(${playlist.id}, ${song.id}, event)">
                <i class='fas fa-trash'></i> Remove
            </button>
        `;
        div.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                const index = songs.findIndex(s => s.id === song.id);
                if (song.filePath) {
                    playSong(song.filePath, index > -1 ? index : 0);
                }
            }
        };
        container.appendChild(div);
    });
}

async function removeFromPlaylist(playlistId, trackId, event) {
    event.stopPropagation();
    try {
        console.log("Removing track:", trackId, "from playlist:", playlistId);
        
        const response = await authFetch(`/api/playlists/${playlistId}/remove/${trackId}`, { 
            method: "DELETE" 
        });
        
        if (response.ok) {
            // Reload playlists to update song count
            await loadPlaylists();
            
            // Reload current playlist songs
            await loadPlaylistById(playlistId);
            
            showToast("Song removed from playlist", "success");
        } else {
            const error = await response.text();
            console.error("Remove error:", error);
            showToast("Failed to remove song", "error");
        }
    } catch (error) {
        console.error("Error removing from playlist:", error);
        showToast("Failed to remove song", "error");
    }
}

async function addToPlaylist(trackId, event) {
    event.stopPropagation();
    
    // Fetch all playlists first
    try {
        let response = await authFetch("/api/playlists/all");
        let playlists = await response.json();
        
        if (!playlists || playlists.length === 0) {
            alert("No playlists found. Create a playlist first!");
            return;
        }
        
        const modalHtml = `
            <div id="playlistModal" class="playlist-modal">
                <div class="playlist-modal-content">
                    <div class="playlist-modal-header">
                        <h3>Add to Playlist</h3>
                        <button class="modal-close" onclick="closePlaylistModal()">&times;</button>
                    </div>
                    <div class="playlist-modal-body">
                        ${playlists.map(playlist => `
                            <div class="playlist-option" onclick="selectPlaylist(${playlist.id}, ${trackId})">
                                <i class="fas fa-list"></i>
                                <span>${escapeHtml(playlist.name)}</span>
                                <span class="playlist-song-count">${playlist.tracks ? playlist.tracks.length : 0} songs</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="playlist-modal-footer">
                        <button class="modal-create-btn" onclick="createPlaylistAndAdd(${trackId})">
                            <i class="fas fa-plus"></i> Create New Playlist
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .playlist-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .playlist-modal-content {
                    background: #1e1e1e;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 80vh;
                    overflow: hidden;
                    animation: modalSlideIn 0.3s ease;
                }
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .playlist-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #2a2a2a;
                }
                .playlist-modal-header h3 {
                    margin: 0;
                    color: white;
                }
                .modal-close {
                    background: none;
                    border: none;
                    color: #b3b3b3;
                    font-size: 24px;
                    cursor: pointer;
                }
                .modal-close:hover {
                    color: white;
                }
                .playlist-modal-body {
                    padding: 10px 0;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .playlist-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .playlist-option:hover {
                    background: #2a2a2a;
                }
                .playlist-option i {
                    color: #1db954;
                    font-size: 18px;
                }
                .playlist-option span {
                    color: white;
                    flex: 1;
                }
                .playlist-song-count {
                    font-size: 12px;
                    color: #b3b3b3 !important;
                    flex: none !important;
                }
                .playlist-modal-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #2a2a2a;
                }
                .modal-create-btn {
                    width: 100%;
                    background: #1db954;
                    color: white;
                    border: none;
                    border-radius: 25px;
                    padding: 10px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                }
                .modal-create-btn:hover {
                    background: #1ed760;
                }
            `;
            document.head.appendChild(style);
        }
        
    } catch (error) {
        console.error("Error loading playlists:", error);
        alert("Failed to load playlists");
    }
}

// Load playlist by ID (for refreshing after adding songs)
async function loadPlaylistById(playlistId) {
    try {
        console.log("Loading playlist by ID:", playlistId);
        let response = await authFetch(`/api/playlists/${playlistId}`);
        let playlist = await response.json();
        console.log("Playlist loaded:", playlist);
        if (playlist) {
            window.currentPlaylistId = playlist.id;
            await loadPlaylistSongs(playlist);
        }
    } catch (error) {
        console.error("Error loading playlist:", error);
    }
}

// Close modal function
function closePlaylistModal() {
    const modal = document.getElementById("playlistModal");
    if (modal) modal.remove();
}

// Select playlist and add song
async function selectPlaylist(playlistId, trackId) {
    try {
        console.log("=== Adding to playlist ===");
        console.log("Playlist ID:", playlistId);
        console.log("Track ID:", trackId);
        
        const response = await authFetch(`/api/playlists/${playlistId}/add/${trackId}`, { 
            method: "POST"
        });
        
        console.log("Response status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Response data:", data);
            
            closePlaylistModal();
            showToast("Song added to playlist!", "success");
            
            await loadPlaylists();
            
            if (window.currentPlaylistId === playlistId) {
                await loadPlaylistById(playlistId);
            }
        } else {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            showToast("Failed to add song: " + errorText, "error");
        }
    } catch (error) {
        console.error("Error adding to playlist:", error);
        showToast("Failed to add song to playlist", "error");
    }
}

// Create new playlist and add song
async function createPlaylistAndAdd(trackId) {
    const name = prompt("Enter new playlist name:");
    if (name && name.trim()) {
        try {
            const response = await authFetch("/api/playlists/create", {
                method: "POST",
                body: JSON.stringify({ name: name.trim() })
            });
            const newPlaylist = await response.json();
            await selectPlaylist(newPlaylist.id, trackId);
        } catch (error) {
            console.error("Error creating playlist:", error);
            alert("Failed to create playlist");
        }
    }
}

async function createPlaylist() {
    const name = prompt("Enter playlist name:");
    if (name) {
        try {
            await authFetch("/api/playlists/create", {
                method: "POST",
                body: JSON.stringify({ name })
            });
            await loadPlaylists();
            alert("Playlist created!");
        } catch (error) {
            console.error("Error creating playlist:", error);
            alert("Failed to create playlist");
        }
    }
}

// ========== ADMIN FUNCTIONS ==========
async function checkAdminStatus() {
    const adminSection = document.getElementById("adminUploadSection");
    
    if (adminSection) {
        adminSection.style.display = "none";
    }
    
    if (!authToken) {
        console.log("No auth token");
        return;
    }
    
    try {
        const response = await authFetch("/api/admin/check");
        
        if (response && response.ok) {
            if (adminSection) {
                adminSection.style.display = "block";
                console.log("Admin user - showing upload section");
            }
        } else {
            console.log("Regular user - upload section hidden");
        }
    } catch (error) {
        console.log("Regular user - upload section hidden");
    }
}

async function uploadSong() {
    const title = document.getElementById("uploadTitle").value;
    const artist = document.getElementById("uploadArtist").value;
    const genre = document.getElementById("uploadGenre").value;
    const fileInput = document.getElementById("uploadFile");
    const file = fileInput.files[0];
    
    if (!title || !artist || !genre || !file) {
        alert("Please fill all fields and select an MP3 file");
        return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("genre", genre);
    
    try {
        const response = await fetch("http://localhost:8080/api/files/upload", {
            method: "POST",
            headers: { "Authorization": `Bearer ${authToken}` },
            body: formData
        });
        
        const statusDiv = document.getElementById("uploadStatus");
        if (response.ok) {
            statusDiv.innerHTML = "<p style='color: #1db954;'><i class='fas fa-check-circle'></i> Upload successful!</p>";
            document.getElementById("uploadTitle").value = "";
            document.getElementById("uploadArtist").value = "";
            document.getElementById("uploadGenre").value = "";
            document.getElementById("uploadFile").value = "";
            loadSongs();
        } else {
            statusDiv.innerHTML = "<p style='color: #ff4444;'><i class='fas fa-exclamation-circle'></i> Upload failed.</p>";
        }
    } catch (error) {
        console.error("Upload error:", error);
        document.getElementById("uploadStatus").innerHTML = "<p style='color: #ff4444;'><i class='fas fa-exclamation-circle'></i> Upload error</p>";
    }
}

// ========== AI RECOMMENDATIONS FUNCTIONS ==========
async function getAIRecommendations() {
    try {
        const btn = document.getElementById("aiRecommendBtn");
        const resultsDiv = document.getElementById("aiRecommendations");
        const emptyDiv = document.getElementById("aiEmptyState");
        const listDiv = document.getElementById("recommendationsList");
        
        if (!btn) return;
        
        btn.innerHTML = "<i class='fas fa-spinner fa-pulse'></i> Finding recommendations...";
        btn.disabled = true;
        
        let response = await authFetch("/api/ai/recommendations");
        let data = await response.json();
        
        console.log("Recommendations data:", data);
        
        if (data.recommendations && data.recommendations.length > 0) {
            if (emptyDiv) emptyDiv.style.display = "none";
            if (resultsDiv) resultsDiv.style.display = "block";
            if (listDiv) {
                listDiv.innerHTML = "";
                
                data.recommendations.forEach((track, index) => {
                    let card = document.createElement("div");
                    card.className = "rec-card";
                    
                    card.innerHTML = `
                        <div class="rec-card-image">
                            <i class="fas fa-music"></i>
                        </div>
                        <div class="rec-card-info">
                            <div class="rec-card-title">${escapeHtml(track.title || 'Unknown')}</div>
                            <div class="rec-card-artist">${escapeHtml(track.artist || 'Unknown Artist')}</div>
                        </div>
                        <button class="rec-card-play-btn" onclick="event.stopPropagation(); playRecommendation(${track.id})">
                            <i class="fas fa-play"></i>
                        </button>
                    `;
                    
                    card.onclick = () => playRecommendation(track.id);
                    listDiv.appendChild(card);
                });
            }
        } else {
            if (emptyDiv) emptyDiv.style.display = "flex";
            if (resultsDiv) resultsDiv.style.display = "none";
        }
        
        btn.innerHTML = "<i class='fas fa-sync-alt'></i> Refresh";
        btn.disabled = false;
        
    } catch (error) {
        console.error("Error getting recommendations:", error);
        const btn = document.getElementById("aiRecommendBtn");
        if (btn) {
            btn.innerHTML = "<i class='fas fa-sync-alt'></i> Refresh";
            btn.disabled = false;
        }
    }
}

function playRecommendation(trackId) {
    const track = songs.find(s => s.id === trackId);
    if (track) {
        const index = songs.findIndex(s => s.id === trackId);
        playSong(track.filePath, index);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== PAGE NAVIGATION ==========
async function loadPage(page) {
    const pageContent = document.getElementById("pageContent");
    
    if (!authToken) {
        pageContent.innerHTML = "<p>Please login to access music.</p>";
        return;
    }
    
    switch(page) {
        case 'home':
    pageContent.innerHTML = `
        <div class="ai-section">
            <div class="ai-header">
                <div class="ai-header-left">
                    <i class="fas fa-headphones"></i>
                    <h3>Recommended for you</h3>
                </div>
                <button id="aiRecommendBtn" class="ai-refresh-btn">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div id="aiRecommendations" class="ai-results" style="display: block;">
                <div class="ai-results-grid" id="recommendationsList"></div>
            </div>
        </div>
        
        <hr>
        
        <h2>All Songs</h2>
        <input type="text" id="searchInput" class="search-input" placeholder="Search songs or artists...">
        <div id="songList"></div>
    `;
    
    document.getElementById("aiRecommendBtn")?.addEventListener("click", getAIRecommendations);
    document.getElementById("searchInput")?.addEventListener("input", (e) => searchSongs(e.target.value));
    loadSongs();
    
    // Auto-load recommendations
    setTimeout(() => {
        getAIRecommendations();
    }, 500);
    break;
            
        case 'playlists':
    pageContent.innerHTML = `
        <h2>Playlists</h2>
        <button class="create-playlist-btn" onclick="createPlaylist()">
            <i class="fas fa-plus"></i> Create Playlist
        </button>
        <div id="playlistList"></div>
        <hr>
        <h2>Songs in Playlist</h2>
        <div id="playlistSongs"></div>
    `;
    loadPlaylists();
    break;
            
        case 'library':
            pageContent.innerHTML = `
                <h2>Your Library</h2>
                <h3>Liked Songs</h3>
                <div id="likedSongsList"></div>
            `;
            loadLikedSongs();
            break;
            
        case 'search':
            pageContent.innerHTML = `
                <h2>Search</h2>
                <input type="text" id="searchPageInput" class="search-input" placeholder="Search songs or artists...">
                <div id="searchResults"></div>
            `;
            document.getElementById("searchPageInput")?.addEventListener("input", (e) => {
                searchSongsPage(e.target.value);
            });
            break;


            case 'admin':
    pageContent.innerHTML = `
        <div class="admin-dashboard">
            <div class="admin-header">
                <i class="fas fa-crown"></i>
                <h2>Admin Dashboard</h2>
                <p>Manage your music library</p>
            </div>
            
            <div class="admin-stats">
                <div class="stat-card">
                    <i class="fas fa-music"></i>
                    <div class="stat-number">${songs.length}</div>
                    <div class="stat-label">Total Songs</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-number">${await getTotalUsers()}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-heart"></i>
                    <div class="stat-number">${songs.filter(s => s.liked).length}</div>
                    <div class="stat-label">Total Likes</div>
                </div>
            </div>
            
            <div class="admin-upload-section">
                <h3><i class="fas fa-upload"></i> Upload New Song</h3>
                <div class="upload-form">
                    <input type="text" id="uploadTitle" placeholder="Song Title">
                    <input type="text" id="uploadArtist" placeholder="Artist">
                    <input type="text" id="uploadGenre" placeholder="Genre">
                    <input type="file" id="uploadFile" accept=".mp3">
                    <button class="upload-btn" onclick="uploadSong()">
                        <i class="fas fa-cloud-upload-alt"></i> Upload MP3
                    </button>
                    <div id="uploadStatus"></div>
                </div>
            </div>
            
            <div class="admin-song-list">
                <h3><i class="fas fa-database"></i> Manage Songs</h3>
                <div id="adminSongList"></div>
            </div>
        </div>
    `;
    
    // Load songs for admin management
    displayAdminSongs();
    break;
    }
}

async function loadLikedSongs() {
    await loadSongs();
    const likedSongs = songs.filter(song => song.liked);
    const container = document.getElementById("likedSongsList");
    if (container) {
        container.innerHTML = "";
        likedSongs.forEach(song => {
            let div = document.createElement("div");
            div.className = "song";
            div.innerHTML = `
                <div>
                    <div class="song-title">${song.title || "Unknown"}</div>
                    <div class="song-artist">${song.artist || "Unknown"}</div>
                </div>
                <button class="play-song-btn" onclick="playSong('${song.filePath}', ${songs.indexOf(song)})">
                    <i class="fas fa-play"></i> Play
                </button>
            `;
            container.appendChild(div);
        });
    }
}

async function searchSongsPage(keyword) {
    if (!keyword.trim()) {
        document.getElementById("searchResults").innerHTML = "";
        return;
    }
    try {
        let response = await authFetch("/api/files/search?keyword=" + keyword);
        const results = await response.json();
        const container = document.getElementById("searchResults");
        container.innerHTML = "";
        results.forEach(song => {
            let div = document.createElement("div");
            div.className = "song";
            div.innerHTML = `
                <div>
                    <div class="song-title">${song.title || "Unknown"}</div>
                    <div class="song-artist">${song.artist || "Unknown"}</div>
                </div>
                <button onclick="playSong('${song.filePath}', ${songs.indexOf(song)})" class="player-btn">
                    <i class="fas fa-play"></i> Play
                </button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Search error:", error);
    }
}

// ========== PLAYLIST MANAGEMENT FUNCTIONS ==========

// Delete a playlist
async function deletePlaylist(playlistId, playlistName) {
    if (confirm(`Are you sure you want to delete playlist "${playlistName}"?`)) {
        try {
            await authFetch(`/api/playlists/${playlistId}`, { method: "DELETE" });
            await loadPlaylists();

            document.getElementById("playlistSongs").innerHTML = "";
            showToast(`Playlist "${playlistName}" deleted successfully`, "success");
        } catch (error) {
            console.error("Error deleting playlist:", error);
            showToast("Failed to delete playlist", "error");
        }
    }
}

// Rename a playlist
async function renamePlaylist(playlistId, currentName) {
    const newName = prompt("Enter new playlist name:", currentName);
    if (newName && newName.trim() !== "") {
        try {
            await authFetch(`/api/playlists/${playlistId}`, {
                method: "PUT",
                body: JSON.stringify({ name: newName })
            });
            await loadPlaylists();
            showToast(`Playlist renamed to "${newName}"`, "success");
        } catch (error) {
            console.error("Error renaming playlist:", error);
            showToast("Failed to rename playlist", "error");
        }
    }
}

// Toast notification function
function showToast(message, type = "success") {
    const existingToast = document.querySelector(".toast-notification");
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Get total users (admin only)
async function getTotalUsers() {
    try {
        const response = await authFetch("/api/admin/users");
        const users = await response.json();
        return users.length;
    } catch (error) {
        return 0;
    }
}

// Display songs in admin panel with delete option
async function displayAdminSongs() {
    await loadSongs();
    const container = document.getElementById("adminSongList");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (songs.length === 0) {
        container.innerHTML = "<p>No songs uploaded yet.</p>";
        return;
    }
    
    songs.forEach(song => {
        let div = document.createElement("div");
        div.className = "admin-song-item";
        div.innerHTML = `
            <div class="admin-song-info">
                <i class="fas fa-music"></i>
                <div>
                    <div class="admin-song-title">${song.title || "Unknown"}</div>
                    <div class="admin-song-artist">${song.artist || "Unknown"} • ${song.genre || "No genre"}</div>
                </div>
            </div>
            <button class="admin-delete-btn" onclick="deleteSong(${song.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        container.appendChild(div);
    });
}

// Delete song 
async function deleteSong(songId) {
    if (confirm("Are you sure you want to delete this song?")) {
        try {
            const response = await authFetch(`/api/files/delete/${songId}`, { method: "DELETE" });
            if (response.ok) {
                showToast("Song deleted successfully", "success");
                loadSongs();
                displayAdminSongs();
                // Update stats if on admin page
                if (document.querySelector('.admin-stats')) {
                    const statNumber = document.querySelector('.stat-card:first-child .stat-number');
                    if (statNumber) statNumber.innerText = songs.length - 1;
                }
            } else {
                showToast("Failed to delete song", "error");
            }
        } catch (error) {
            console.error("Error deleting song:", error);
            showToast("Failed to delete song", "error");
        }
    }
}

// Update checkAdminStatus to show/hide admin nav item
async function checkAdminStatus() {
    const adminSection = document.getElementById("adminUploadSection");
    const adminNavItem = document.getElementById("adminNavItem");
    
    if (adminSection) {
        adminSection.style.display = "none";
    }
    
    if (!authToken) {
        console.log("No auth token");
        return;
    }
    
    try {
        const response = await authFetch("/api/admin/check");
        
        if (response && response.ok) {
            if (adminSection) {
                adminSection.style.display = "block";
            }
            if (adminNavItem) {
                adminNavItem.style.display = "block";
            }
            console.log("Admin user - showing admin features");
        } else {
            if (adminNavItem) {
                adminNavItem.style.display = "none";
            }
            console.log("Regular user - admin features hidden");
        }
    } catch (error) {
        if (adminNavItem) {
            adminNavItem.style.display = "none";
        }
        console.log("Regular user - admin features hidden");
    }
}

// ========== SETUP EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", function() {
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        progressBar.addEventListener("click", seek);
    }
    
    const playPauseBtn = document.getElementById("playPauseBtn");
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", togglePlayPause);
    }
    
    setupVolumeControl();
});

// Make functions globally available
window.prevSong = prevSong;
window.nextSong = nextSong;
window.togglePlayPause = togglePlayPause;
window.playSong = playSong;

// ========== INITIALIZATION ==========
displayUserInfo();
checkAdminStatus();
loadPage('home');