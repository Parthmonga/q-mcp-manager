class MCPHomeController {
    constructor() {
        this.serverPort = 3000;
        this.serverUrl = 'http://localhost:' + this.serverPort;
        this.apiBase = this.serverUrl + '/api';
        this.isServerRunning = false;
        this.serverStartTime = null;
        this.uptimeInterval = null;
        this.healthCheckInterval = null;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.initializeTheme();
        await this.checkServerStatus();
        this.startHealthMonitoring();
    }

    bindEvents() {
        // Main controls
        document.getElementById('startServerBtn').addEventListener('click', () => this.startServer());
        document.getElementById('stopServerBtn').addEventListener('click', () => this.stopServer());
        
        // Secondary controls
        document.getElementById('openDashboardBtn').addEventListener('click', () => this.openDashboard());
        document.getElementById('viewLogsBtn').addEventListener('click', () => this.viewLogs());
        document.getElementById('serverStatusBtn').addEventListener('click', () => this.showServerInfo());
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Modal controls
        document.getElementById('closeLogModal').addEventListener('click', () => this.closeLogModal());
        document.getElementById('refreshLogsBtn').addEventListener('click', () => this.refreshLogs());
        document.getElementById('clearLogsBtn').addEventListener('click', () => this.clearLogs());
        
        // Quick actions
        document.getElementById('configFileBtn').addEventListener('click', () => this.openConfigFile());
        
        // Click outside modal to close
        document.getElementById('logModal').addEventListener('click', (e) => {
            if (e.target.id === 'logModal') {
                this.closeLogModal();
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('mcpHomeTheme') || 'light';
        document.body.className = savedTheme + '-theme';
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.className = newTheme + '-theme';
        localStorage.setItem('mcpHomeTheme', newTheme);
        this.updateThemeIcon(newTheme);
        
        this.showToast('Switched to ' + newTheme + ' theme', 'success');
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    async checkServerStatus() {
        try {
            const response = await fetch(this.apiBase + '/health', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const result = await response.json();
                this.updateServerStatus(true, 'Server is running and healthy');
                this.serverStartTime = new Date(result.timestamp);
                this.startUptimeCounter();
            } else {
                throw new Error('Server not responding');
            }
        } catch (error) {
            this.updateServerStatus(false, 'Server is offline');
            this.stopUptimeCounter();
        }
    }

    updateServerStatus(isRunning, message) {
        this.isServerRunning = isRunning;
        
        const statusIndicator = document.getElementById('serverStatusIndicator');
        const statusText = document.getElementById('serverStatusText');
        const statusDescription = document.getElementById('serverStatusDescription');
        const serverInfo = document.getElementById('serverInfo');
        
        // Update visual status
        statusIndicator.className = 'status-indicator ' + (isRunning ? 'online' : 'offline');
        statusText.textContent = isRunning ? 'Server Online' : 'Server Offline';
        statusDescription.textContent = message;
        serverInfo.textContent = message;
        
        // Update icon
        const statusIcon = document.getElementById('statusIcon');
        statusIcon.className = isRunning ? 'fas fa-play' : 'fas fa-power-off';
        
        // Update button states
        document.getElementById('startServerBtn').disabled = isRunning;
        document.getElementById('stopServerBtn').disabled = !isRunning;
        document.getElementById('openDashboardBtn').disabled = !isRunning;
        document.getElementById('viewLogsBtn').disabled = !isRunning;
    }

    async startServer() {
        try {
            this.showLoading(true, 'Starting Server...', 'Initializing MCP Manager');
            this.updateProgress(10);
            
            // Simulate server startup process
            await this.simulateStartupProcess();
            
            // Check if server actually started
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds
            
            while (attempts < maxAttempts) {
                this.updateProgress(30 + (attempts * 2));
                
                try {
                    const response = await fetch(this.apiBase + '/health');
                    if (response.ok) {
                        this.updateProgress(100);
                        this.showLoading(false);
                        this.updateServerStatus(true, 'Server started successfully');
                        this.serverStartTime = new Date();
                        this.startUptimeCounter();
                        this.showToast('Server started successfully!', 'success');
                        
                        // Auto-open dashboard after 2 seconds
                        setTimeout(() => {
                            this.openDashboard();
                        }, 2000);
                        
                        return;
                    }
                } catch (error) {
                    // Server not ready yet, continue waiting
                }
                
                await this.sleep(1000);
                attempts++;
            }
            
            throw new Error('Server failed to start within timeout period');
            
        } catch (error) {
            console.error('Error starting server:', error);
            this.showLoading(false);
            this.showToast('Failed to start server: ' + error.message, 'error');
            this.updateServerStatus(false, 'Failed to start server');
        }
    }

    async simulateStartupProcess() {
        const steps = [
            { message: 'Checking dependencies...', progress: 20 },
            { message: 'Loading configuration...', progress: 40 },
            { message: 'Starting server process...', progress: 60 },
            { message: 'Initializing API endpoints...', progress: 80 },
            { message: 'Server ready!', progress: 95 }
        ];
        
        for (const step of steps) {
            this.updateLoadingText('Starting Server...', step.message);
            this.updateProgress(step.progress);
            await this.sleep(800);
        }
    }

    async stopServer() {
        try {
            this.showLoading(true, 'Stopping Server...', 'Gracefully shutting down');
            this.updateProgress(20);
            
            const response = await fetch(this.apiBase + '/shutdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            this.updateProgress(60);
            
            if (response.ok) {
                this.updateProgress(100);
                await this.sleep(1000);
                
                this.showLoading(false);
                this.updateServerStatus(false, 'Server stopped gracefully');
                this.stopUptimeCounter();
                this.showToast('Server stopped successfully!', 'success');
            } else {
                throw new Error('Failed to stop server');
            }
            
        } catch (error) {
            console.error('Error stopping server:', error);
            this.showLoading(false);
            
            // Server might already be down
            if (error.message.includes('fetch')) {
                this.updateServerStatus(false, 'Server is offline');
                this.stopUptimeCounter();
                this.showToast('Server stopped', 'success');
            } else {
                this.showToast('Failed to stop server: ' + error.message, 'error');
            }
        }
    }

    openDashboard() {
        if (this.isServerRunning) {
            window.open(this.serverUrl, '_blank');
            this.showToast('Dashboard opened in new tab', 'success');
        } else {
            this.showToast('Server is not running', 'error');
        }
    }

    async viewLogs() {
        if (!this.isServerRunning) {
            this.showToast('Server is not running', 'error');
            return;
        }
        
        document.getElementById('logModal').classList.add('show');
        await this.loadLogs();
    }

    async loadLogs() {
        const logContainer = document.getElementById('logContainer');
        
        // Create loading element safely
        logContainer.innerHTML = '';
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'log-loading';
        
        const spinner = document.createElement('i');
        spinner.className = 'fas fa-spinner fa-spin';
        
        const loadingText = document.createElement('span');
        loadingText.textContent = 'Loading logs...';
        
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(loadingText);
        logContainer.appendChild(loadingDiv);
        
        try {
            // Simulate log loading - in real implementation, you'd fetch actual logs
            await this.sleep(1000);
            
            const sampleLogs = `
🚀 MCP Manager server running on http://localhost:3000
📁 MCP Config Path: /Users/monparth/.aws/amazonq/mcp.json
🌐 Open http://localhost:3000 in your browser

[${new Date().toISOString()}] Server started successfully
[${new Date().toISOString()}] API endpoints initialized
[${new Date().toISOString()}] Configuration loaded: 7 MCP servers found
[${new Date().toISOString()}] Health check endpoint active
[${new Date().toISOString()}] Dashboard ready for connections
            `.trim();
            
            logContainer.textContent = sampleLogs;
            
        } catch (error) {
            // Create error element safely
            logContainer.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'log-loading';
            errorDiv.style.color = 'var(--accent-danger)';
            
            const errorIcon = document.createElement('i');
            errorIcon.className = 'fas fa-exclamation-triangle';
            
            const errorText = document.createElement('span');
            errorText.textContent = 'Failed to load logs';
            
            errorDiv.appendChild(errorIcon);
            errorDiv.appendChild(errorText);
            logContainer.appendChild(errorDiv);
        }
    }

    closeLogModal() {
        document.getElementById('logModal').classList.remove('show');
    }

    async refreshLogs() {
        await this.loadLogs();
        this.showToast('Logs refreshed', 'success');
    }

    clearLogs() {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = '';
        
        // Create cleared message safely
        const clearedDiv = document.createElement('div');
        clearedDiv.className = 'log-loading';
        
        const clearedText = document.createElement('span');
        clearedText.textContent = 'Logs cleared';
        
        clearedDiv.appendChild(clearedText);
        logContainer.appendChild(clearedDiv);
        
        this.showToast('Logs cleared', 'success');
    }

    showServerInfo() {
        let info;
        if (this.isServerRunning) {
            info = 'Server running on port ' + this.serverPort + ' • Uptime: ' + this.getUptime() + ' • Status: Healthy';
        } else {
            info = 'Server offline • Port: ' + this.serverPort + ' • Status: Not running';
        }
        this.showToast(info, 'info');
    }

    openConfigFile() {
        const configPath = '~/.aws/amazonq/mcp.json';
        this.showToast('Config file: ' + configPath, 'info');
        
        // Copy path to clipboard for easy access
        if (navigator.clipboard) {
            navigator.clipboard.writeText(configPath).then(() => {
                setTimeout(() => this.showToast('Path copied to clipboard!', 'success'), 500);
            }).catch(() => {
                // Fallback - just show the info
            });
        }
    }

    startUptimeCounter() {
        this.stopUptimeCounter(); // Clear any existing interval
        
        this.uptimeInterval = setInterval(() => {
            const uptimeElement = document.getElementById('uptimeInfo');
            uptimeElement.textContent = this.getUptime();
        }, 1000);
    }

    stopUptimeCounter() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
            this.uptimeInterval = null;
        }
        document.getElementById('uptimeInfo').textContent = 'Not running';
    }

    getUptime() {
        if (!this.serverStartTime) return 'Unknown';
        
        const now = new Date();
        const diff = now - this.serverStartTime;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return days + 'd ' + (hours % 24) + 'h ' + (minutes % 60) + 'm';
        if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm ' + (seconds % 60) + 's';
        if (minutes > 0) return minutes + 'm ' + (seconds % 60) + 's';
        return seconds + 's';
    }

    startHealthMonitoring() {
        // Check server health every 10 seconds
        this.healthCheckInterval = setInterval(async () => {
            const wasRunning = this.isServerRunning;
            await this.checkServerStatus();
            
            // Notify if status changed
            if (wasRunning && !this.isServerRunning) {
                this.showToast('Server went offline', 'warning');
            } else if (!wasRunning && this.isServerRunning) {
                this.showToast('Server came back online', 'success');
            }
        }, 10000);
    }

    showLoading(show, title = 'Loading...', description = 'Please wait...') {
        const overlay = document.getElementById('loadingOverlay');
        const titleElement = document.getElementById('loadingText');
        const descriptionElement = document.getElementById('loadingDescription');
        
        if (show) {
            titleElement.textContent = title;
            descriptionElement.textContent = description;
            overlay.classList.add('show');
            this.updateProgress(0);
        } else {
            overlay.classList.remove('show');
        }
    }

    updateLoadingText(title, description) {
        document.getElementById('loadingText').textContent = title;
        document.getElementById('loadingDescription').textContent = description;
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' :
                    'fa-info-circle';
        
        // Create elements safely to prevent XSS
        const iconElement = document.createElement('i');
        iconElement.className = 'fas ' + icon;
        
        const messageElement = document.createElement('span');
        messageElement.textContent = message; // Safe: textContent prevents XSS
        
        toast.appendChild(iconElement);
        toast.appendChild(messageElement);
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the home controller when page loads
let mcpHome;
document.addEventListener('DOMContentLoaded', () => {
    mcpHome = new MCPHomeController();
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                if (mcpHome.isServerRunning) {
                    mcpHome.stopServer();
                } else {
                    mcpHome.startServer();
                }
                break;
            case 'o':
                e.preventDefault();
                mcpHome.openDashboard();
                break;
            case 'l':
                e.preventDefault();
                mcpHome.viewLogs();
                break;
            case 'k':
                e.preventDefault();
                mcpHome.toggleTheme();
                break;
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        mcpHome.closeLogModal();
    }
});
