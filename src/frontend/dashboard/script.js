class MCPManager {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.servers = {};
        this.activityLog = [];
        this.serverStartTimes = {};
        this.filteredServers = {};
        this.init();
    }

    async init() {
        this.bindEvents();
        this.initializeTheme();
        await this.loadServers();
    }

    bindEvents() {
        // Existing events
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshServers());
        document.getElementById('enableAllBtn').addEventListener('click', () => this.toggleAllServers(false));
        document.getElementById('disableAllBtn').addEventListener('click', () => this.toggleAllServers(true));
        
        // New events
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterServers(e.target.value));
        document.getElementById('filterSelect').addEventListener('change', (e) => this.filterByType(e.target.value));
        document.getElementById('clearActivityBtn').addEventListener('click', () => this.clearActivity());
        document.getElementById('exportConfigBtn').addEventListener('click', () => this.exportConfiguration());
        
        // Shutdown functionality
        document.getElementById('shutdownBtn').addEventListener('click', () => this.showShutdownConfirmation());
        document.getElementById('closeTabBtn').addEventListener('click', () => this.closeTab());
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('mcpManagerTheme') || 'light';
        document.body.className = savedTheme + '-theme';
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.className = newTheme + '-theme';
        localStorage.setItem('mcpManagerTheme', newTheme);
        this.updateThemeIcon(newTheme);
        
        this.addActivity('theme-change', 'Switched to ' + newTheme + ' theme', 'Theme changed to ' + newTheme + ' mode');
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    async loadServers() {
        try {
            this.showLoading(true);
            this.updateStatus('Loading...', 'loading');
            
            const response = await fetch(this.apiBase + '/mcp-config');
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to load configuration');
            }
            
            this.servers = result.data.mcpServers || {};
            this.initializeServerStartTimes();
            this.renderServers();
            this.updateStats();
            this.updateStatus('Connected', 'success');
            
        } catch (error) {
            console.error('Error loading servers:', error);
            
            let errorMessage = 'Failed to load MCP servers';
            if (error.message.includes('fetch')) {
                errorMessage = 'Cannot connect to server. Make sure the backend is running.';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'Invalid configuration file format';
            } else {
                errorMessage = 'Failed to load MCP servers: ' + error.message;
            }
            
            this.showToast(errorMessage, 'error');
            this.updateStatus('Error', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    initializeServerStartTimes() {
        Object.keys(this.servers).forEach(serverName => {
            if (!this.serverStartTimes[serverName]) {
                this.serverStartTimes[serverName] = Date.now();
            }
        });
    }

    getServerTypeIcon(command) {
        switch (command) {
            case 'docker':
                return { icon: 'fab fa-docker', class: 'docker' };
            case 'uvx':
            case 'python':
            case 'python3':
                return { icon: 'fab fa-python', class: 'python' };
            case 'node':
            case 'npm':
            case 'npx':
                return { icon: 'fab fa-node-js', class: 'node' };
            default:
                return { icon: 'fas fa-terminal', class: 'executable' };
        }
    }

    formatUptime(startTime, isEnabled) {
        if (!isEnabled) return 'Disabled';
        
        const now = Date.now();
        const diff = now - startTime;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return days + 'd ' + (hours % 24) + 'h';
        if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm';
        if (minutes > 0) return minutes + 'm';
        return 'Just started';
    }

    filterServers(searchTerm) {
        const filterType = document.getElementById('filterSelect').value;
        this.applyFilters(searchTerm, filterType);
    }

    filterByType(filterType) {
        const searchTerm = document.getElementById('searchInput').value;
        this.applyFilters(searchTerm, filterType);
    }

    applyFilters(searchTerm, filterType) {
        this.filteredServers = {};
        
        Object.entries(this.servers).forEach(([name, config]) => {
            const matchesSearch = !searchTerm || 
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                this.formatServerName(name).toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = filterType === 'all' ||
                (filterType === 'enabled' && !config.disabled) ||
                (filterType === 'disabled' && config.disabled) ||
                (filterType === 'docker' && config.command === 'docker') ||
                (filterType === 'python' && ['uvx', 'python', 'python3'].includes(config.command));
            
            if (matchesSearch && matchesFilter) {
                this.filteredServers[name] = config;
            }
        });
        
        this.renderServers();
    }

    renderServers() {
        const grid = document.getElementById('serversGrid');
        grid.innerHTML = '';

        const serversToRender = Object.keys(this.filteredServers).length > 0 ? this.filteredServers : this.servers;

        if (Object.keys(serversToRender).length === 0) {
            const hasFilters = document.getElementById('searchInput').value || document.getElementById('filterSelect').value !== 'all';
            
            // Create empty state message safely
            const emptyDiv = document.createElement('div');
            emptyDiv.style.gridColumn = '1 / -1';
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '40px';
            emptyDiv.style.color = 'var(--text-secondary)';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-' + (hasFilters ? 'search' : 'server');
            icon.style.fontSize = '3rem';
            icon.style.marginBottom = '20px';
            icon.style.opacity = '0.5';
            
            const heading = document.createElement('h3');
            heading.textContent = hasFilters ? 'No servers found' : 'No MCP servers found';
            
            const paragraph = document.createElement('p');
            paragraph.textContent = hasFilters 
                ? 'Try adjusting your search or filter criteria' 
                : 'Check your MCP configuration file at ~/.aws/amazonq/mcp.json';
            
            emptyDiv.appendChild(icon);
            emptyDiv.appendChild(heading);
            emptyDiv.appendChild(paragraph);
            
            grid.appendChild(emptyDiv);
            return;
        }

        Object.entries(serversToRender).forEach(([name, config]) => {
            const serverCard = this.createServerCard(name, config);
            grid.appendChild(serverCard);
        });
    }

    createServerCard(name, config) {
        const isEnabled = !config.disabled;
        const serverType = this.getServerType(config.command);
        const typeIcon = this.getServerTypeIcon(config.command);
        const uptime = this.formatUptime(this.serverStartTimes[name], isEnabled);
        
        const card = document.createElement('div');
        card.className = 'server-card ' + (isEnabled ? 'enabled' : 'disabled');
        
        // Create server header safely
        const serverHeader = document.createElement('div');
        serverHeader.className = 'server-header';
        
        const serverInfo = document.createElement('div');
        serverInfo.className = 'server-info';
        
        const h3 = document.createElement('h3');
        h3.title = name; // Safe: attribute assignment
        
        const typeIconDiv = document.createElement('div');
        typeIconDiv.className = 'server-type-icon ' + typeIcon.class;
        const typeIconElement = document.createElement('i');
        typeIconElement.className = typeIcon.icon;
        typeIconDiv.appendChild(typeIconElement);
        
        const nameText = document.createTextNode(this.formatServerName(name));
        h3.appendChild(typeIconDiv);
        h3.appendChild(nameText);
        
        const serverTypeSpan = document.createElement('span');
        serverTypeSpan.className = 'server-type';
        serverTypeSpan.textContent = serverType; // Safe: textContent
        
        const serverUptimeDiv = document.createElement('div');
        serverUptimeDiv.className = 'server-uptime';
        const clockIcon = document.createElement('i');
        clockIcon.className = 'fas fa-clock';
        serverUptimeDiv.appendChild(clockIcon);
        serverUptimeDiv.appendChild(document.createTextNode(uptime));
        
        serverInfo.appendChild(h3);
        serverInfo.appendChild(serverTypeSpan);
        serverInfo.appendChild(serverUptimeDiv);
        
        const serverStatus = document.createElement('div');
        serverStatus.className = 'server-status ' + (isEnabled ? 'enabled' : 'disabled');
        const statusLight = document.createElement('div');
        statusLight.className = 'status-light ' + (isEnabled ? 'enabled' : 'disabled');
        serverStatus.appendChild(statusLight);
        serverStatus.appendChild(document.createTextNode(isEnabled ? 'Enabled' : 'Disabled'));
        
        serverHeader.appendChild(serverInfo);
        serverHeader.appendChild(serverStatus);
        
        // Create server details safely
        const serverDetails = document.createElement('div');
        serverDetails.className = 'server-details';
        
        // Command detail row
        const commandRow = this.createDetailRow('Command:', config.command, config.command);
        serverDetails.appendChild(commandRow);
        
        // Arguments detail row
        const displayArgs = config.args ? config.args.slice(0, 2).join(' ') : '';
        const moreArgs = config.args && config.args.length > 2 ? ' +' + (config.args.length - 2) + ' more' : '';
        const argsText = displayArgs + (moreArgs || (config.args && config.args.length === 0 ? 'None' : ''));
        const argsTitle = config.args ? config.args.join(' ') : 'None';
        const argsRow = this.createDetailRow('Arguments:', argsText, argsTitle);
        serverDetails.appendChild(argsRow);
        
        // Environment detail row
        const envRow = this.createDetailRow('Environment:', Object.keys(config.env || {}).length + ' vars');
        serverDetails.appendChild(envRow);
        
        // Auto Approve detail row
        const autoApproveRow = this.createDetailRow('Auto Approve:', (config.autoApprove ? config.autoApprove.length : 0) + ' items');
        serverDetails.appendChild(autoApproveRow);
        
        // Create server actions safely
        const serverActions = document.createElement('div');
        serverActions.className = 'server-actions';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn ' + (isEnabled ? 'disable' : 'enable');
        toggleBtn.disabled = this.isLoading;
        
        const btnIcon = document.createElement('i');
        btnIcon.className = 'fas ' + (isEnabled ? 'fa-stop' : 'fa-play');
        toggleBtn.appendChild(btnIcon);
        toggleBtn.appendChild(document.createTextNode(isEnabled ? 'Disable' : 'Enable'));
        
        // Safe event listener instead of onclick attribute
        toggleBtn.addEventListener('click', () => this.toggleServer(name, isEnabled));
        
        serverActions.appendChild(toggleBtn);
        
        // Assemble the card
        card.appendChild(serverHeader);
        card.appendChild(serverDetails);
        card.appendChild(serverActions);
        
        return card;
    }

    createDetailRow(label, value, title = null) {
        const row = document.createElement('div');
        row.className = 'detail-row';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'detail-label';
        labelSpan.textContent = label; // Safe: textContent
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'detail-value';
        if (title) {
            valueSpan.title = title; // Safe: attribute assignment
        }
        valueSpan.textContent = value; // Safe: textContent
        
        row.appendChild(labelSpan);
        row.appendChild(valueSpan);
        
        return row;
    }

    formatServerName(name) {
        return name
            .replace(/^awslabs\./, '')
            .replace(/-mcp-server$/, '')
            .split(/[-.]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getServerType(command) {
        switch (command) {
            case 'docker':
                return 'Docker Container';
            case 'uvx':
                return 'Python Package';
            case 'node':
                return 'Node.js';
            case 'python':
            case 'python3':
                return 'Python Script';
            case 'npm':
            case 'npx':
                return 'NPM Package';
            default:
                return 'Executable';
        }
    }

    async writeMCPConfig(config) {
        try {
            const validateResponse = await fetch(this.apiBase + '/validate-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config })
            });
            
            const validateResult = await validateResponse.json();
            if (!validateResult.success) {
                throw new Error(validateResult.errors ? validateResult.errors.join(', ') : validateResult.error);
            }
            
            const response = await fetch(this.apiBase + '/mcp-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config })
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to save configuration');
            }
            
            return result;
        } catch (error) {
            console.error('Error writing MCP config:', error);
            throw error;
        }
    }

    async toggleServer(serverName, currentlyEnabled) {
        try {
            this.showLoading(true);
            
            const updatedServers = { ...this.servers };
            updatedServers[serverName].disabled = currentlyEnabled;
            
            await this.writeMCPConfig({ mcpServers: updatedServers });
            
            this.servers = updatedServers;
            
            // Update server start time
            if (!currentlyEnabled) {
                this.serverStartTimes[serverName] = Date.now();
            }
            
            this.renderServers();
            this.updateStats();
            
            const action = currentlyEnabled ? 'disabled' : 'enabled';
            this.showToast(this.formatServerName(serverName) + ' ' + action + ' successfully', 'success');
            this.addActivity(action, this.formatServerName(serverName) + ' ' + action, 'Server ' + action + ' by user');
            
        } catch (error) {
            console.error('Error toggling server:', error);
            this.showToast('Failed to toggle ' + this.formatServerName(serverName) + ': ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async toggleAllServers(disable) {
        try {
            this.showLoading(true);
            
            const updatedServers = { ...this.servers };
            Object.keys(updatedServers).forEach(serverName => {
                updatedServers[serverName].disabled = disable;
                if (!disable) {
                    this.serverStartTimes[serverName] = Date.now();
                }
            });
            
            await this.writeMCPConfig({ mcpServers: updatedServers });
            
            this.servers = updatedServers;
            this.renderServers();
            this.updateStats();
            
            const action = disable ? 'disabled' : 'enabled';
            this.showToast('All servers ' + action + ' successfully', 'success');
            this.addActivity('bulk-' + action, 'All servers ' + action, 'Bulk operation: ' + action + ' all servers');
            
        } catch (error) {
            console.error('Error toggling all servers:', error);
            this.showToast('Failed to ' + (disable ? 'disable' : 'enable') + ' all servers: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async refreshServers() {
        this.updateStatus('Refreshing...', 'loading');
        await this.loadServers();
        this.showToast('Servers refreshed successfully', 'success');
        this.addActivity('refresh', 'Servers refreshed', 'Configuration reloaded from disk');
    }

    addActivity(type, title, description) {
        const activity = {
            type,
            title,
            description,
            timestamp: Date.now()
        };
        
        this.activityLog.unshift(activity);
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }
        
        this.renderActivity();
        this.updateStats();
    }

    renderActivity() {
        const timeline = document.getElementById('activityTimeline');
        const welcomeItem = timeline.querySelector('.welcome');
        
        // Clear existing items except welcome
        timeline.innerHTML = '';
        if (welcomeItem) {
            timeline.appendChild(welcomeItem);
        }
        
        this.activityLog.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item ' + activity.type;
            
            const timeAgo = this.formatTimeAgo(activity.timestamp);
            
            // Create elements safely to prevent XSS
            const iconDiv = document.createElement('div');
            iconDiv.className = 'activity-icon';
            const iconElement = document.createElement('i');
            iconElement.className = 'fas ' + this.getActivityIcon(activity.type);
            iconDiv.appendChild(iconElement);
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'activity-content';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'activity-title';
            titleDiv.textContent = activity.title; // Safe: textContent prevents XSS
            
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'activity-description';
            descriptionDiv.textContent = activity.description; // Safe: textContent prevents XSS
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'activity-time';
            timeDiv.textContent = timeAgo; // Safe: textContent prevents XSS
            
            contentDiv.appendChild(titleDiv);
            contentDiv.appendChild(descriptionDiv);
            contentDiv.appendChild(timeDiv);
            
            item.appendChild(iconDiv);
            item.appendChild(contentDiv);
            
            timeline.appendChild(item);
        });
    }

    getActivityIcon(type) {
        switch (type) {
            case 'enabled': return 'fa-play';
            case 'disabled': return 'fa-stop';
            case 'bulk-enabled': return 'fa-play-circle';
            case 'bulk-disabled': return 'fa-stop-circle';
            case 'refresh': return 'fa-sync-alt';
            case 'theme-change': return 'fa-palette';
            default: return 'fa-info-circle';
        }
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return hours + 'h ago';
        if (minutes > 0) return minutes + 'm ago';
        return 'Just now';
    }

    clearActivity() {
        this.activityLog = [];
        this.renderActivity();
        this.updateStats();
        this.showToast('Activity history cleared', 'success');
    }

    exportConfiguration() {
        const config = { mcpServers: this.servers };
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'mcp-config-' + new Date().toISOString().split('T')[0] + '.json';
        link.click();
        
        this.showToast('Configuration exported successfully', 'success');
        this.addActivity('export', 'Configuration exported', 'MCP configuration downloaded as JSON file');
    }

    updateStats() {
        const totalServers = Object.keys(this.servers).length;
        const enabledServers = Object.values(this.servers).filter(server => !server.disabled).length;
        const disabledServers = totalServers - enabledServers;
        const recentChanges = this.activityLog.length;

        document.getElementById('totalServers').textContent = totalServers;
        document.getElementById('enabledServers').textContent = enabledServers;
        document.getElementById('disabledServers').textContent = disabledServers;
        document.getElementById('recentChanges').textContent = recentChanges;
    }

    updateStatus(text, type) {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = 'status-dot ' + type;
        statusText.textContent = text;
    }

    showLoading(show) {
        this.isLoading = show;
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.toggle('show', show);
        
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = show;
        });
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle';
        
        // Create elements safely to prevent XSS
        const iconElement = document.createElement('i');
        iconElement.className = 'fas ' + icon;
        
        const messageElement = document.createElement('span');
        messageElement.textContent = message; // Safe: textContent prevents XSS
        
        toast.appendChild(iconElement);
        toast.appendChild(messageElement);
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    showShutdownConfirmation() {
        this.showConfirmation(
            'Shutdown Server',
            'This will gracefully stop the MCP Manager server. All current configurations will be saved.',
            'To restart, you\'ll need to run:\n./server.sh start --background',
            () => this.shutdownServer()
        );
    }
    
    showConfirmation(title, message, details, onConfirm) {
        const overlay = document.getElementById('confirmationOverlay');
        const titleElement = document.getElementById('confirmationTitle');
        const messageElement = document.getElementById('confirmationMessage');
        const detailsElement = document.getElementById('confirmationDetails');
        const confirmBtn = document.getElementById('confirmationConfirm');
        const cancelBtn = document.getElementById('confirmationCancel');
        
        // Set content safely to prevent XSS
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        if (details) {
            detailsElement.textContent = details;
            detailsElement.style.display = 'block';
        } else {
            detailsElement.style.display = 'none';
        }
        
        // Show modal
        overlay.classList.add('show');
        
        // Handle confirm action
        const handleConfirm = () => {
            overlay.classList.remove('show');
            onConfirm();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleEscape);
        };
        
        // Handle cancel action
        const handleCancel = () => {
            overlay.classList.remove('show');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleOverlayClick);
            document.removeEventListener('keydown', handleEscape);
        };
        
        // Handle clicking outside modal
        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Attach event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleEscape);
        
        // Focus the confirm button for accessibility
        setTimeout(() => confirmBtn.focus(), 100);
    }

    async shutdownServer() {
        try {
            this.showLoading(true);
            this.updateStatus('Shutting down...', 'loading');
            
            // Add shutdown activity before server stops
            this.addActivity('shutdown', 'Server shutdown initiated', 'Graceful server shutdown requested by user');
            
            // Call shutdown endpoint
            const response = await fetch(this.apiBase + '/shutdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Shutdown response:', result);
                
                // Show shutdown screen immediately
                this.showShutdownScreen();
            } else {
                throw new Error('Failed to initiate shutdown');
            }
            
        } catch (error) {
            console.error('Error during shutdown:', error);
            
            // If we can't reach the server, it might already be down
            if (error.message.includes('fetch')) {
                this.showShutdownScreen();
            } else {
                this.showToast('Shutdown failed: ' + error.message, 'error');
                this.showLoading(false);
            }
        }
    }

    showShutdownScreen() {
        // Hide loading overlay
        this.showLoading(false);
        
        // Show shutdown screen
        const shutdownOverlay = document.getElementById('shutdownOverlay');
        shutdownOverlay.classList.add('show');
        
        // Update status
        this.updateStatus('Server Offline', 'error');
        
        // Disable all buttons except close tab
        const buttons = document.querySelectorAll('button:not(#closeTabBtn)');
        buttons.forEach(button => {
            button.disabled = true;
        });
        
        // Start checking if server comes back online
        this.startServerMonitoring();
    }

    startServerMonitoring() {
        // Check every 5 seconds if server comes back online
        const checkInterval = setInterval(async () => {
            const isOnline = await this.checkServerHealth();
            if (isOnline) {
                clearInterval(checkInterval);
                this.handleServerRestart();
            }
        }, 5000);
        
        // Stop checking after 5 minutes
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 300000);
    }

    handleServerRestart() {
        // Hide shutdown screen
        const shutdownOverlay = document.getElementById('shutdownOverlay');
        shutdownOverlay.classList.remove('show');
        
        // Re-enable buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = false;
        });
        
        // Reload the dashboard
        this.loadServers();
        this.showToast('Server is back online! Dashboard reloaded.', 'success');
        this.addActivity('restart', 'Server restarted', 'Server came back online and dashboard reconnected');
    }

    closeTab() {
        // Try to close the tab/window
        if (window.close) {
            window.close();
        } else {
            // If we can't close the tab, show toast message instead of alert
            this.showToast('Close tab manually: Cmd+W (Mac) or Ctrl+W (Windows/Linux)', 'info');
            setTimeout(() => {
                this.showToast('To restart server later: ./server.sh start --background', 'info');
            }, 3000);
        }
    }

    async checkServerHealth() {
        try {
            const response = await fetch(this.apiBase + '/health');
            const result = await response.json();
            return result.success;
        } catch (error) {
            return false;
        }
    }
}

// Initialize the MCP Manager when the page loads
let mcpManager;
document.addEventListener('DOMContentLoaded', async () => {
    mcpManager = new MCPManager();
    
    const isServerRunning = await mcpManager.checkServerHealth();
    if (!isServerRunning) {
        mcpManager.showToast('Backend server not running. Please start the server with: ./server.sh start --background', 'error');
        mcpManager.updateStatus('Server Offline', 'error');
    }
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'r':
                e.preventDefault();
                mcpManager.refreshServers();
                break;
            case 'e':
                e.preventDefault();
                mcpManager.toggleAllServers(false);
                break;
            case 'd':
                e.preventDefault();
                mcpManager.toggleAllServers(true);
                break;
            case 'f':
                e.preventDefault();
                document.getElementById('searchInput').focus();
                break;
            case 'k':
                e.preventDefault();
                mcpManager.toggleTheme();
                break;
        }
    }
    
    // Shutdown shortcut (Ctrl/Cmd + Shift + Q)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        mcpManager.showShutdownConfirmation();
    }
});
