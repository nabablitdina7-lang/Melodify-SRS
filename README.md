# 🎵 Melodify - Music Streaming Application

A Spotify-like music streaming web application built with Spring Boot, featuring JWT authentication, playlist management, and AI-powered recommendations.

## 👥 Project Members

| Name | Role |
|------|------|
| TABANAO, JERAME G. | Backend Developer |
| NABABLIT, DINA V. | Frontend Developer |


## 🔐 Default Admin Account

The admin user is automatically created when you run Docker. Use these credentials:

| Field | Value |
|-------|-------|
| **Email** | `admin@gmail.com` |
| **Password** | `admin123` |


## ✨ Features

- 🔐 **User Authentication** - JWT-based login/registration with BCrypt password hashing
- 🎵 **Music Streaming** - HTTP Byte-Range requests for seek/scrub functionality
- 📋 **Playlist Management** - Create, rename, delete playlists, add/remove tracks
- ❤️ **Like Songs** - Personal library of favorite tracks
- 🔍 **Search** - Search songs by title or artist
- 🤖 **AI Recommendations** - Google Gemini API for personalized track suggestions
- 👑 **Admin Dashboard** - Upload MP3 files with metadata (Artist, Genre, Composer, Studio)
- 🐳 **Docker Support** - Containerized deployment with Docker Compose


## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| Backend | Spring Boot 3.x, Java 21 |
| Security | Spring Security, JWT, BCrypt |
| Database | MySQL, Spring Data JPA |
| Frontend | HTML, CSS, JavaScript, Font Awesome |
| AI | Google Gemini API |
| Container | Docker, Docker Compose |
| Build Tool | Maven |

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed

### Run the application

# Run with Docker Compose
docker-compose up --build

# Access the app
# Open browser: http://localhost:8080/login.html
