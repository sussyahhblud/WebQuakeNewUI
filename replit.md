# WebQuake - Replit Project

## Overview
WebQuake is an HTML5 WebGL port of the classic Quake game by id Software. This project includes both a web client that runs in browsers and a Node.js dedicated server for multiplayer functionality.

## Architecture
- **Frontend**: HTML5/WebGL client located in `Client/` directory
- **Server**: Node.js dedicated game server in `Server/` directory  
- **HTTP Server**: Custom Node.js server (`webquake-server.js`) serves frontend on port 5000
- **Game Server**: Dedicated Quake server runs on port 26000 for multiplayer

## Current State
✅ **Successfully Imported and Configured**
- Node.js environment set up with required dependencies (adm-zip, websocket)
- HTTP server configured to serve WebQuake client on port 5000 with proper host binding (0.0.0.0)
- Proper MIME types and cache control headers configured for Replit environment
- CORS enabled and caching disabled for development compatibility
- Game server configured to run on port 26000 (separate from frontend)
- Dependencies installed for both main project and server components
- Deployment configured for production (autoscale)

✅ **Professional Launcher Interface Complete**
- Complete redesign with launcher-style interface matching user specifications
- Left sidebar with collapsible sections: GAMES, LAUNCH OPTIONS, START
- Dark theme styling with professional aesthetic
- LAUNCH OPTIONS limited to fullscreen toggle only (no demos, open folder, or zip sections)
- Footer with correct links: Instructions | GitHub | XashXT
- GitHub link properly configured: https://github.com/sussyahhblud/WebQuake
- Central Quake "Q" logo with golden/bronze styling
- Cross-browser compatible collapsible sections
- Integrated download overlay for missing game data
- Fullscreen functionality for enhanced gaming experience

## Setup Details
- Frontend accessible at: `http://localhost:5000`
- Game server (multiplayer): port 26000
- HTTP server includes range request support for better compatibility
- CORS enabled and caching disabled for development

## File Structure
```
/
├── Client/                 # WebQuake browser client
│   ├── index.htm          # Main game HTML file
│   └── WebQuake/          # Game engine JavaScript files
├── Server/                # Node.js dedicated game server
│   ├── WebQDS.js         # Main server entry point
│   └── WebQDS/           # Server-side game engine
├── webquake-server.js    # HTTP server for frontend (port 5000)
└── README.md             # Original project documentation
```

## Usage Notes
- To fully run the game, users need to provide Quake data files (id1 folder)
- The shareware version with first episode is sufficient for basic testing
- Multiplayer requires running the dedicated server: `cd Server && node WebQDS.js`
- Web client connects to multiplayer via WebSocket on port 26000

## Deployment
- ✅ Configured for Replit autoscale deployment
- Production command: `node webquake-server.js`
- Serves static files with proper HTTP headers and range support
- Ready for publishing when user is satisfied with functionality