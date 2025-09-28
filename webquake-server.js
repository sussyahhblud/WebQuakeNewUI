const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const AdmZip = require('adm-zip');
const os = require('os');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.pak': 'application/octet-stream',
    '.bsp': 'application/octet-stream',
    '.mdl': 'application/octet-stream',
    '.spr': 'application/octet-stream',
    '.wav': 'audio/wav'
};

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

// Download and extract Quake data
async function handleDownloadQuake(req, res) {
    const zipUrl = 'https://dl.dropboxusercontent.com/scl/fi/hyxcaqpfwhnkz1whvrn0y/id1.zip?rlkey=ni002yllmovegdfp3tmqsv6eh&st=3kylmm6z&dl=0';
    const id1Dir = path.join(__dirname, 'Client', 'id1');
    const tempDir = os.tmpdir();
    const tempZipPath = path.join(tempDir, 'id1.zip');

    try {
        // Check if id1 directory already exists with game files
        if (fs.existsSync(id1Dir)) {
            const files = fs.readdirSync(id1Dir);
            if (files.length > 0) {
                res.writeHead(409, { 'Content-Type': 'text/plain' });
                res.end('Quake data already exists');
                return;
            }
        }

        console.log('Starting download of Quake data...');
        
        // Download the zip file
        await downloadFile(zipUrl, tempZipPath);
        
        console.log('Download complete, extracting...');
        
        // Create id1 directory if it doesn't exist
        if (!fs.existsSync(id1Dir)) {
            fs.mkdirSync(id1Dir, { recursive: true });
        }
        
        // Extract the zip file with security checks
        const zip = new AdmZip(tempZipPath);
        const entries = zip.getEntries();
        
        for (const entry of entries) {
            const entryPath = entry.entryName;
            
            // Security check: prevent zip-slip attacks
            if (entryPath.includes('..') || path.isAbsolute(entryPath)) {
                console.warn(`Skipping dangerous path: ${entryPath}`);
                continue;
            }
            
            // Remove any "id1/" prefix from the path since we're already extracting to id1Dir
            const cleanPath = entryPath.replace(/^id1[\/\\]/, '');
            const outputPath = path.join(id1Dir, cleanPath);
            
            // Ensure the output path is within id1Dir
            if (!outputPath.startsWith(id1Dir)) {
                console.warn(`Skipping path outside target directory: ${entryPath}`);
                continue;
            }
            
            if (!entry.isDirectory) {
                // Ensure directory exists
                const dir = path.dirname(outputPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                // Extract file
                fs.writeFileSync(outputPath, entry.getData());
            }
        }
        
        // Clean up temporary file
        fs.unlinkSync(tempZipPath);
        
        console.log('Quake data extraction complete');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Download and extraction complete');
        
    } catch (error) {
        console.error('Error downloading Quake data:', error);
        
        // Clean up temp file if it exists
        if (fs.existsSync(tempZipPath)) {
            try { fs.unlinkSync(tempZipPath); } catch (e) {}
        }
        
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to download Quake data: ' + error.message);
    }
}

// Download file helper function
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
            
            file.on('error', (err) => {
                fs.unlink(outputPath, () => {}); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS and prevent caching for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Handle download Quake data endpoint
    if (req.method === 'POST' && pathname === '/api/download-quake') {
        handleDownloadQuake(req, res).catch(err => {
            console.error('Unhandled error in download handler:', err);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
            }
        });
        return;
    }

    
    // Default to index.htm if accessing root
    if (pathname === '/') {
        pathname = '/index.htm';
    }

    // Serve files from the Client directory
    const filePath = path.join(__dirname, 'Client', pathname);
    
    // Security check - ensure we're only serving files from Client directory
    const normalizedPath = path.normalize(filePath);
    const clientDir = path.join(__dirname, 'Client');
    if (!normalizedPath.startsWith(clientDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404);
            res.end(`File not found: ${pathname}`);
            return;
        }

        if (stats.isFile()) {
            const contentType = getContentType(filePath);
            
            // Handle range requests for better compatibility
            if (req.headers.range) {
                const range = req.headers.range;
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
                const chunksize = (end - start) + 1;
                
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType
                });
                
                const stream = fs.createReadStream(filePath, { start, end });
                stream.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Length': stats.size,
                    'Accept-Ranges': 'bytes'
                });
                
                const stream = fs.createReadStream(filePath);
                stream.pipe(res);
            }
        } else {
            res.writeHead(404);
            res.end(`Not a file: ${pathname}`);
        }
    });
});

const PORT = 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`WebQuake HTTP Server running on http://${HOST}:${PORT}`);
    console.log('Serving WebQuake client from Client/ directory');
    console.log('Access WebQuake at: http://localhost:5000');
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('Shutting down WebQuake server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});