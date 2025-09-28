window.downloadQuakeData = async function() {
    const button = document.getElementById("downloadButton");
    const status = document.getElementById("downloadStatus");
    
    button.disabled = true;
    status.innerHTML = "Downloading Quake data...";
    status.style.color = "#e1e1e1";
    
    try {
        const response = await fetch("/api/download-quake", { method: "POST" });
        
        if (response.status === 200) {
            status.innerHTML = "Download complete! Starting game...";
            status.style.color = "#90EE90";
            
            // Notify the launcher that download is complete
            setTimeout(() => {
                if (window.onDownloadComplete) {
                    window.onDownloadComplete();
                }
            }, 1000);
            
        } else if (response.status === 409) {
            status.innerHTML = "Quake data already exists! Starting game...";
            status.style.color = "#FFD700";
            
            // Notify the launcher that data exists and is ready
            setTimeout(() => {
                if (window.onDownloadComplete) {
                    window.onDownloadComplete();
                }
            }, 1000);
        } else {
            const errorText = await response.text();
            status.innerHTML = "Download failed: " + errorText;
            status.style.color = "#FF6B6B";
            button.disabled = false;
        }
    } catch (error) {
        status.innerHTML = "Download failed: " + error.message;
        status.style.color = "#FF6B6B";
        button.disabled = false;
    }
};

// Function to initialize Quake after successful download or when data exists
window.initializeQuake = function() {
    console.log('Initializing Quake engine...');
    
    // Initialize the full game now that data is available
    if (typeof Sys !== 'undefined' && Sys.InitFullGame) {
        Sys.InitFullGame();
    } else {
        console.log('Quake engine not yet loaded, will retry...');
        // Retry after a short delay if Sys is not yet available
        setTimeout(() => {
            if (typeof Sys !== 'undefined' && Sys.InitFullGame) {
                Sys.InitFullGame();
            }
        }, 1000);
    }
};

// Check if game data exists when page loads
window.checkForGameData = function() {
    return fetch('/id1/pak0.pak', { method: 'HEAD' })
        .then(function(response) {
            return response.ok;
        })
        .catch(function() {
            return false;
        });
};
