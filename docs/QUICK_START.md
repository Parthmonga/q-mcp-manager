# Q MCP Manager - Quick Start Guide

> **💡 Get up and running with Q MCP Manager in 60 seconds!**

A professional, modern dashboard for managing Amazon Q MCP (Model Context Protocol) servers with an intuitive web interface.

## 🚀 **Instant Start**

### Method 1: Quick Launch (Recommended)
```bash
# From your project directory
./start.sh start --background
```
✅ **Server starts + Dashboard opens + Terminal stays free!**

### Method 2: Direct Script
```bash
./scripts/server.sh start --background
```

### Method 3: NPM Command
```bash
npm start
```

**Dashboard URL:** `http://localhost:3000`

---

## 🎛️ **Server Control Commands**

### Essential Commands
| Command | Purpose | Example |
|---------|---------|----------|
| **Start** | Launch the server | `./start.sh start --background` |
| **Stop** | Stop the server | `./scripts/server.sh stop` |
| **Status** | Check server state | `./scripts/server.sh status` |
| **Logs** | View server logs | `./scripts/server.sh logs` |
| **Help** | Show all options | `./scripts/server.sh help` |

### Server Modes

**🔸 Background Mode (Recommended)**
```bash
./scripts/server.sh start --background
# or short form:
./scripts/server.sh start -b
```
- ✅ Frees up terminal
- ✅ Auto-opens dashboard
- ✅ Runs in background

**🔸 Development Mode**
```bash
npm run dev
```
- ✅ Auto-restart on changes
- ✅ Live development server
- ✅ Debug output

**🔸 Foreground Mode**
```bash
./scripts/server.sh start
```
- ⚠️ Blocks terminal
- ✅ Real-time logs
- ✅ Easy debugging

---

## 🌐 **Dashboard Features**

Once running at `http://localhost:3000`, you can:

### Server Management
- 👁️ **View All Servers** - Visual status indicators
- ⚡ **Toggle Servers** - Enable/disable individual servers
- 🔄 **Bulk Operations** - Enable/disable all servers at once
- 📊 **Live Statistics** - Total, enabled, and disabled counts
- 🔍 **Search & Filter** - Find servers quickly

### User Interface
- 🌙 **Dark/Light Themes** - Toggle with keyboard shortcut
- 📱 **Responsive Design** - Works on all screen sizes
- ⚡ **Real-time Updates** - Live status changes
- 🎨 **Modern UI** - Beautiful glassmorphism design
- ⌨️ **Keyboard Shortcuts** - Power user friendly

---

## ⌨️ **Keyboard Shortcuts**

### Dashboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + R` | Refresh servers |
| `Cmd/Ctrl + E` | Enable all servers |
| `Cmd/Ctrl + D` | Disable all servers |
| `Cmd/Ctrl + F` | Focus search bar |
| `Cmd/Ctrl + K` | Toggle theme |

---

## 🛑 **Stop the Server**

### From Dashboard (Recommended)
1. Click the **red shutdown button** in the header
2. Confirm shutdown
3. Enjoy the beautiful shutdown animation!

### From Command Line
```bash
./scripts/server.sh stop
```

---

## 🆘 **Quick Troubleshooting**

### Server Won't Start?
```bash
# Check what's wrong
./scripts/server.sh status

# Stop any existing server
./scripts/server.sh stop

# Start fresh
./scripts/server.sh start --background
```

### Dashboard Not Loading?
```bash
# Verify server is running
./scripts/server.sh status

# Check for errors
./scripts/server.sh logs

# Test API directly
curl http://localhost:3000/api/health
```

### Need Live Debugging?
```bash
# Watch logs in real-time
./scripts/server.sh logs --follow

# Or start in foreground mode
./scripts/server.sh start
```

---

## 📋 **What This Tool Does**

✅ **Manages MCP Configuration** - Safely edits `~/.aws/amazonq/mcp.json`  
✅ **Visual Interface** - No more manual JSON editing  
✅ **Backup Protection** - Automatic backups before changes  
✅ **Validation** - Prevents configuration corruption  
✅ **Real-time Sync** - Changes reflect immediately  

> **Note:** This tool manages the MCP server configuration only. Amazon Q handles the actual server processes.

---

## 🎯 **Next Steps**

Once you're up and running:

1. 📖 **Read the [Server Guide](SERVER_GUIDE.md)** for advanced features
2. 🔧 **Explore all server commands** with `./scripts/server.sh help`
3. 🎨 **Customize your dashboard** with themes and filters
4. ⌨️ **Learn keyboard shortcuts** for faster workflow
5. 📊 **Monitor your servers** with the activity timeline

**Need help?** Check the [Server Guide](SERVER_GUIDE.md) for detailed instructions and troubleshooting.
