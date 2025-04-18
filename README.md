# Twitch Bot with Spotify Integration

A modern Twitch chat bot built with Node.js that integrates with Spotify to provide music-related commands and interactive features for stream viewers.

## 🚀 Features

- **Spotify Integration**
  - View current playing song (`!song`)
  - Check queue of upcoming songs (`!queue`)
  - Skip current track (`!skip`)
  - Request songs via chat (`!songrequest`)
- **Interactive Commands**
  - Built-in mini-game access (`!game`)
  - Help command to list available features (`!commands`)
- **Robust Architecture**
  - Automatic token refresh and validation
  - PostgreSQL for secure environment variable storage
  - WebSocket-based real-time chat interaction
  - Dockerized deployment support

## 🛠️ Tech Stack

- **Backend**: Node.js
- **Database**: PostgreSQL
- **APIs**:
  - Twitch EventSub WebSocket API
  - Spotify Web API
- **Authentication**: OAuth2 flow for both Twitch and Spotify
- **Deployment**: Docker support with Node 18

## 🔧 System Architecture

The bot consists of three main components:
1. **TwitchBot**: Handles WebSocket connections, chat commands, and message routing
2. **TokenGenerator**: Manages OAuth2 authentication flow and token refresh
3. **Postgres**: Secures environment variables and authentication tokens

## 🔐 Security Features

- Secure token management with database storage
- Automatic token refresh handling
- Environment variable isolation
- No hardcoded credentials

## 🎮 Available Commands

- `!song` - Display currently playing track
- `!queue` - Show next 5 songs in queue
- `!skip` - Skip the current song
- `!songrequest` - Request a song (e.g., 'the days by notion')
- `!game` - Get a link to a custom web game
- `!commands` - List all available commands

## 🐳 Docker Support

The application includes a Dockerfile for easy deployment and containerization, using the `node:18-slim` base image for optimal performance and size.

## 🔄 Automatic Recovery

- Automatic WebSocket reconnection on timeout
- Token revalidation and refresh system
- Graceful error handling and recovery

---