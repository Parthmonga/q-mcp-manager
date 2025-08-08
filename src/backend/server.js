const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cors = require('cors');

const app = express();
// Get port from environment variable, command line argument, or default to 3000
const getPort = () => {
    // Check command line arguments first
    const portArg = process.argv.find(arg => arg.startsWith('--port='));
    if (portArg) {
        const port = parseInt(portArg.split('=')[1]);
        if (port && port > 0 && port <= 65535) {
            return port;
        }
    }
    
    // Check environment variable
    if (process.env.PORT) {
        const port = parseInt(process.env.PORT);
        if (port && port > 0 && port <= 65535) {
            return port;
        }
    }
    
    // Default port
    return 3000;
};

const PORT = getPort();
const PROJECT_ROOT = path.join(__dirname, '../..');

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from multiple directories
app.use(express.static(path.join(PROJECT_ROOT, 'src/frontend/dashboard')));
app.use('/home', express.static(path.join(PROJECT_ROOT, 'src/frontend/home')));
app.use('/assets', express.static(path.join(PROJECT_ROOT, 'src/assets')));

// Routes
// Home screen route (server launcher)
app.get('/home', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'src/frontend/home/index.html'));
});

// Main dashboard route
app.get('/', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'src/frontend/dashboard/index.html'));
});

// Get the MCP config file path
const getMCPConfigPath = () => {
    return path.join(os.homedir(), '.aws', 'amazonq', 'mcp.json');
};

// Endpoint to read MCP configuration
app.get('/api/mcp-config', async (req, res) => {
    try {
        const configPath = getMCPConfigPath();
        
        // Check if file exists
        try {
            await fs.access(configPath);
        } catch (accessError) {
            return res.status(404).json({
                success: false,
                error: `MCP configuration file not found at ${configPath}`,
                path: configPath
            });
        }
        
        const configData = await fs.readFile(configPath, 'utf8');
        
        // Check if file is empty or contains only whitespace
        if (!configData.trim()) {
            return res.status(400).json({
                success: false,
                error: 'MCP configuration file is empty',
                path: configPath
            });
        }
        
        let config;
        try {
            config = JSON.parse(configData);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(400).json({
                success: false,
                error: `Invalid JSON in MCP configuration file: ${parseError.message}`,
                path: configPath
            });
        }
        
        // Ensure mcpServers exists
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        res.json({
            success: true,
            data: config,
            path: configPath
        });
    } catch (error) {
        console.error('Error reading MCP config:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            path: getMCPConfigPath()
        });
    }
});

// Endpoint to write MCP configuration
app.post('/api/mcp-config', async (req, res) => {
    try {
        const configPath = getMCPConfigPath();
        const { config } = req.body;
        
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Configuration data is required'
            });
        }
        
        // Ensure mcpServers exists
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // Create a backup of the current config
        try {
            const currentConfig = await fs.readFile(configPath, 'utf8');
            if (currentConfig.trim()) { // Only backup if file has content
                const backupPath = `${configPath}.backup.${Date.now()}`;
                await fs.writeFile(backupPath, currentConfig);
                console.log(`Backup created at: ${backupPath}`);
            }
        } catch (backupError) {
            console.warn('Could not create backup:', backupError.message);
        }
        
        // Write the new configuration with proper formatting
        const configJson = JSON.stringify(config, null, 2);
        await fs.writeFile(configPath, configJson, 'utf8');
        
        console.log('MCP configuration updated successfully');
        
        res.json({
            success: true,
            message: 'Configuration updated successfully',
            path: configPath
        });
    } catch (error) {
        console.error('Error writing MCP config:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            path: getMCPConfigPath()
        });
    }
});

// Endpoint to validate MCP configuration
app.post('/api/validate-config', async (req, res) => {
    try {
        const { config } = req.body;
        
        // Basic validation
        if (!config || typeof config !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid configuration format'
            });
        }
        
        if (!config.mcpServers || typeof config.mcpServers !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Missing or invalid mcpServers section'
            });
        }
        
        // Validate each server configuration
        const errors = [];
        Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
            if (!serverConfig.command) {
                errors.push(`Server "${name}" is missing command`);
            }
            if (!Array.isArray(serverConfig.args)) {
                errors.push(`Server "${name}" args must be an array`);
            }
            if (serverConfig.env && typeof serverConfig.env !== 'object') {
                errors.push(`Server "${name}" env must be an object`);
            }
            if (serverConfig.autoApprove && !Array.isArray(serverConfig.autoApprove)) {
                errors.push(`Server "${name}" autoApprove must be an array`);
            }
        });
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: errors
            });
        }
        
        res.json({
            success: true,
            message: 'Configuration is valid'
        });
    } catch (error) {
        console.error('Error validating config:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Server control endpoints
app.post('/api/start-server', (req, res) => {
    console.log('🚀 Server start request received from home screen');
    
    // Since we're already running, this is more of a status confirmation
    res.json({
        success: true,
        message: 'Server is already running',
        timestamp: new Date().toISOString(),
        port: PORT,
        url: `http://localhost:${PORT}`
    });
});

// Shutdown endpoint
app.post('/api/shutdown', (req, res) => {
    console.log('🛑 Shutdown request received from dashboard');
    
    res.json({
        success: true,
        message: 'Server shutdown initiated',
        timestamp: new Date().toISOString()
    });
    
    // Give the response time to be sent before shutting down
    setTimeout(() => {
        console.log('👋 Shutting down MCP Manager server gracefully...');
        process.exit(0);
    }, 1000);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MCP Manager API is running',
        timestamp: new Date().toISOString(),
        configPath: getMCPConfigPath(),
        port: PORT,
        uptime: process.uptime()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 MCP Manager server running on http://localhost:${PORT}`);
    console.log(`📁 MCP Config Path: ${getMCPConfigPath()}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down MCP Manager server...');
    process.exit(0);
});
