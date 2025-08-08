# Q MCP Manager - Advanced Server Guide

> **🔧 Complete guide for advanced server management and troubleshooting**

This comprehensive guide covers all aspects of managing the Q MCP Manager server, from basic operations to advanced troubleshooting and automation.

## 📋 **Prerequisites**

Before starting, ensure you have:
- ✅ **Node.js** (version 14 or higher) - `node --version`
- ✅ **Dependencies installed** - Run `npm install` in project directory
- ✅ **MCP config file** - Located at `~/.aws/amazonq/mcp.json`
- ✅ **Port 3000 available** - Check with `lsof -i :3000`

---

## 🎛️ **Server Control System**

### Unified Script Architecture
All server operations are handled through two main scripts:
- **`./start.sh`** - Convenience wrapper (recommended)
- **`./scripts/server.sh`** - Core server management

### Command Structure
```bash
# Using convenience wrapper
./start.sh [command] [options]

# Using core script
./scripts/server.sh [command] [options]
```

---

## 🚀 **Starting the Server**

### Recommended Methods

**🔹 Quick Start (Easiest)**
```bash
./start.sh start --background
```

**🔹 Background Mode**
```bash
./scripts/server.sh start --background
# Short form:
./scripts/server.sh start -b
```
✅ Best for daily use - frees terminal, auto-opens dashboard

**🔹 Development Mode**
```bash
npm run dev
```
✅ Auto-restarts on file changes, includes debugging output

**🔹 Foreground Mode**
```bash
./scripts/server.sh start
```
⚠️ Blocks terminal but shows live logs - good for debugging

### Startup Options

| Flag | Purpose | Example |
|------|---------|----------|
| `--background` or `-b` | Run in background | `./scripts/server.sh start -b` |
| `--no-open` or `-n` | Don't auto-open browser | `./scripts/server.sh start -b -n` |

---

## ✅ **Verifying Server Status**

### Quick Status Check
```bash
./scripts/server.sh status
# or simply:
./scripts/server.sh
```

### Expected Output
```bash
✅ Server started successfully in background!
🆔 Process ID: 12345
🌐 Dashboard: http://localhost:3000
📋 View logs: ./scripts/server.sh logs
🛑 To stop: ./scripts/server.sh stop
```

### Manual Verification
```bash
# Check if port 3000 is in use
lsof -i :3000

# Test API health
curl http://localhost:3000/api/health

# Open dashboard
open http://localhost:3000  # macOS
# or visit: http://localhost:3000
```

---

## 🛑 **Stopping the Server**

### Graceful Shutdown
```bash
./scripts/server.sh stop
```

### What Happens During Shutdown:
1. 🔍 Locates running server processes
2. ⏹️ Sends graceful termination signal
3. ⚡ Force-kills if necessary (after timeout)
4. ✅ Confirms port 3000 is freed
5. 📝 Reports final status

### Alternative Stop Methods
```bash
# From dashboard (recommended)
# Click red "Shutdown" button

# Emergency force-kill
pkill -f "node src/backend/server.js"

# Kill by port (if needed)
kill -9 $(lsof -ti :3000)
```

---

## 🔄 **Restarting the Server**

### Standard Restart
```bash
./scripts/server.sh restart --background
# or:
./scripts/server.sh restart -b
```

### Development Restart
```bash
./scripts/server.sh restart    # Foreground mode for debugging
```

### What Happens During Restart:
1. 🛑 Gracefully stops existing server
2. ⏱️ Waits for clean shutdown
3. 🚀 Starts new server instance
4. ✅ Verifies successful startup
5. 🌐 Auto-opens dashboard (unless `--no-open`)

---

## 📋 **Server Logging**

### View Recent Logs
```bash
./scripts/server.sh logs
```
Shows last 20 lines from server log file.

### Follow Live Logs
```bash
./scripts/server.sh logs --follow
# or:
./scripts/server.sh logs -f
```
Shows real-time log updates. Press `Ctrl+C` to stop.

### Log Locations
- **Server logs:** `logs/server.log` (when running in background)
- **Console output:** Direct terminal output (foreground mode)
- **Error logs:** Included in main server log

---

## 🔧 **Troubleshooting Guide**

### Server Won't Start

**🔍 Diagnostic Steps:**
```bash
# 1. Check current status
./scripts/server.sh status

# 2. Verify Node.js installation
node --version

# 3. Check if port is occupied
lsof -i :3000

# 4. Verify dependencies
ls -la node_modules/
```

**🛠️ Common Solutions:**

**Port Already in Use:**
```bash
./scripts/server.sh stop     # Stop existing server
./scripts/server.sh start -b # Start fresh
```

**Missing Dependencies:**
```bash
npm install                   # Reinstall dependencies
./scripts/server.sh start -b  # Try starting again
```

**Corrupted Installation:**
```bash
rm -rf node_modules package-lock.json
npm install
./scripts/server.sh start -b
```

### MCP Configuration Issues

**Check Config File:**
```bash
# Verify file exists
ls -la ~/.aws/amazonq/mcp.json

# Validate JSON syntax
cat ~/.aws/amazonq/mcp.json | jq .

# Check file permissions
ls -la ~/.aws/amazonq/mcp.json
```

**Fix Permissions:**
```bash
chmod 644 ~/.aws/amazonq/mcp.json
```

**Restore from Backup:**
```bash
# List available backups
ls -la ~/.aws/amazonq/mcp.json.backup.*

# Restore latest backup
cp ~/.aws/amazonq/mcp.json.backup.* ~/.aws/amazonq/mcp.json
```

### Dashboard Access Issues

**Server Running but Dashboard Won't Load:**
```bash
# Check server health
curl -v http://localhost:3000/api/health

# Check recent logs
./scripts/server.sh logs

# Try different browser or incognito mode
```

**Browser-Specific Issues:**
- Clear browser cache and cookies
- Disable browser extensions
- Check browser console (F12 → Console)
- Try incognito/private browsing mode

### Performance Issues

**Server Running Slowly:**
```bash
# Check system resources
top -p $(pgrep -f "node src/backend/server.js")

# Check log file size
ls -lh logs/server.log

# Restart server to clear memory
./scripts/server.sh restart -b
```

**Memory Leaks:**
```bash
# Monitor memory usage
ps aux | grep "node src/backend/server.js"

# Restart server regularly if needed
./scripts/server.sh restart -b
```

---

## 📊 **Server Monitoring**

### Status Information
The `./scripts/server.sh status` command provides:
- ✅ **Server Status** - Running/stopped state
- 📊 **Process Details** - PID and resource usage
- 🧪 **API Health** - Response time and status
- 📁 **Config Status** - MCP file validation
- 🔢 **Server Count** - Number of configured MCP servers
- 🛠️ **Quick Actions** - Available commands

### Health Monitoring Script
```bash
#!/bin/bash
# Save as monitor.sh

while true; do
  echo "$(date): Checking server health..."
  
  if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is healthy"
  else
    echo "❌ Server is not responding"
    echo "🔄 Attempting restart..."
    ./scripts/server.sh restart -b
  fi
  
  sleep 300  # Check every 5 minutes
done
```

---

## 🎯 **Command Reference**

### Complete Command List

| Command | Description | Options | Example |
|---------|-------------|---------|----------|
| `start` | Start the server | `-b, -n` | `./scripts/server.sh start -b` |
| `stop` | Stop the server | None | `./scripts/server.sh stop` |
| `restart` | Restart the server | `-b, -n` | `./scripts/server.sh restart -b` |
| `status` | Show server status | None | `./scripts/server.sh status` |
| `logs` | View server logs | `-f` | `./scripts/server.sh logs -f` |
| `help` | Show help message | None | `./scripts/server.sh help` |

### Option Flags

| Flag | Long Form | Description | Compatible Commands |
|------|-----------|-------------|--------------------|
| `-b` | `--background` | Run in background | `start`, `restart` |
| `-n` | `--no-open` | Don't auto-open browser | `start`, `restart` |
| `-f` | `--follow` | Follow logs live | `logs` |

## 🔄 **System Automation (Optional)**

### Auto-Start on System Boot (macOS)

> 📝 Replace `YOUR_PROJECT_PATH` with your actual project directory path

```bash
# Create a launch agent
cat > ~/Library/LaunchAgents/com.qmcpmanager.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.qmcpmanager</string>
    <key>ProgramArguments</key>
    <array>
        <string>YOUR_PROJECT_PATH/scripts/server.sh</string>
        <string>start</string>
        <string>--background</string>
        <string>--no-open</string>
    </array>
    <key>WorkingDirectory</key>
    <string>YOUR_PROJECT_PATH</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF

# Load the launch agent
launchctl load ~/Library/LaunchAgents/com.qmcpmanager.plist

# To unload (disable auto-start)
launchctl unload ~/Library/LaunchAgents/com.qmcpmanager.plist
```

### System Health Check Script
```bash
#!/bin/bash
# Save as health-check.sh

echo "=== Q MCP Manager Health Check ==="
echo "Time: $(date)"
echo ""

# Check if server is running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is healthy"
    echo "🌐 Dashboard: http://localhost:3000"
else
    echo "❌ Server is not responding"
    echo "🔄 Run: ./scripts/server.sh start -b"
fi

echo ""
echo "📊 Process Status:"
lsof -i :3000 2>/dev/null || echo "No process on port 3000"

echo ""
echo "📁 Config File:"
if [ -f ~/.aws/amazonq/mcp.json ]; then
    echo "✅ MCP config exists"
    echo "📄 Size: $(wc -c < ~/.aws/amazonq/mcp.json) bytes"
else
    echo "❌ MCP config missing"
fi
```

---

## 📝 **Best Practices**

### Daily Usage
1. **Start in background mode**: `./scripts/server.sh start -b`
2. **Monitor via dashboard**: `http://localhost:3000`
3. **Check status regularly**: `./scripts/server.sh status`
4. **Stop gracefully**: Use dashboard shutdown or `./scripts/server.sh stop`

### Development Workflow
1. **Use development mode**: `npm run dev` for auto-restart
2. **Monitor logs**: `./scripts/server.sh logs -f`
3. **Test changes**: Restart server after major changes
4. **Backup config**: Before making configuration changes

### Troubleshooting Workflow
1. **Check status**: `./scripts/server.sh status`
2. **Review logs**: `./scripts/server.sh logs`
3. **Test connectivity**: `curl http://localhost:3000/api/health`
4. **Restart if needed**: `./scripts/server.sh restart -b`
5. **Emergency recovery**: Follow emergency procedures if needed

---

## ❓ **Getting Help**

### Quick Commands
```bash
# Show all available commands
./scripts/server.sh help

# Get current status
./scripts/server.sh status

# View recent activity
./scripts/server.sh logs
```

### Verification Checklist
- ✅ Node.js installed: `node --version`
- ✅ Dependencies installed: `ls node_modules/`
- ✅ MCP config exists: `ls ~/.aws/amazonq/mcp.json`
- ✅ Port 3000 free: `lsof -i :3000`
- ✅ Scripts executable: `ls -la scripts/server.sh`

### Common Issues & Solutions
| Problem | Quick Fix |
|---------|----------|
| Port in use | `./scripts/server.sh stop && ./scripts/server.sh start -b` |
| Dependencies missing | `npm install` |
| Config corrupted | `cp ~/.aws/amazonq/mcp.json.backup.* ~/.aws/amazonq/mcp.json` |
| Dashboard won't load | Check browser console, try incognito mode |
| Server won't start | `./scripts/server.sh status` for diagnostics |

---

**🚀 Ready to get started?** Check out the [Quick Start Guide](QUICK_START.md) for immediate setup!
