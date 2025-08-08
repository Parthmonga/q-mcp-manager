#!/bin/bash

# MCP Manager - Unified Server Control Script
# Usage: ./server.sh [command] [options]

# Get the project directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/server.log"
DEFAULT_PORT=3000
PORT=$DEFAULT_PORT

# Function to validate port number
validate_port() {
    local port_num=$1
    
    # Check if it's a number
    if ! [[ "$port_num" =~ ^[0-9]+$ ]]; then
        print_error "Invalid port: '$port_num' is not a number"
        return 1
    fi
    
    # Check if it's in valid range
    if [ "$port_num" -lt 1 ] || [ "$port_num" -gt 65535 ]; then
        print_error "Invalid port: $port_num is not in range 1-65535"
        return 1
    fi
    
    # Check for well-known ports below 1024 (warn but allow)
    if [ "$port_num" -lt 1024 ]; then
        print_warning "Port $port_num is a privileged port (below 1024) and may require sudo"
    fi
    
    return 0
}

# Function to parse port from arguments
parse_port_argument() {
    local args=("$@")
    local port_found=false
    
    for ((i=0; i<${#args[@]}; i++)); do
        case "${args[i]}" in
            --port=*)
                local port_value="${args[i]#*=}"
                if validate_port "$port_value"; then
                    PORT="$port_value"
                    port_found=true
                else
                    return 1
                fi
                ;;
            --port|-p)
                if [ $((i+1)) -lt ${#args[@]} ]; then
                    local port_value="${args[$((i+1))]}"
                    if validate_port "$port_value"; then
                        PORT="$port_value"
                        port_found=true
                    else
                        return 1
                    fi
                else
                    print_error "Port option requires a value"
                    return 1
                fi
                ;;
        esac
    done
    
    if [ "$port_found" = true ]; then
        print_info "Using custom port: $PORT"
    fi
    
    return 0
}

# Ensure logs directory exists
ensure_logs_dir() {
    if [ ! -d "$PROJECT_DIR/logs" ]; then
        echo "📁 Creating logs directory..."
        mkdir -p "$PROJECT_DIR/logs"
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Function to check if server is running
is_server_running() {
    lsof -Pi :"$PORT" -sTCP:LISTEN -t > /dev/null 2>&1
}

# Function to get server PID
get_server_pid() {
    lsof -ti :"$PORT" 2>/dev/null
}

# Function to show usage
show_usage() {
    echo "🎛️  MCP Manager - Unified Server Control"
    echo "========================================"
    echo ""
    echo "Usage: ./server.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start [options]     Start the server"
    echo "  stop [options]      Stop the server"
    echo "  restart [options]   Restart the server"
    echo "  status [options]    Check server status"
    echo "  logs [--follow|-f]  View server logs"
    echo "  home [options]      Open home screen (server launcher)"
    echo "  help                Show this help message"
    echo ""
    echo "Options:"
    echo "  --port PORT, -p PORT  Custom port number (default: 3000)"
    echo "  --background, -b      Start server in background (doesn't block terminal)"
    echo "  --no-open, -n         Don't automatically open browser"
    echo "  --follow, -f          Follow logs in real-time"
    echo ""
    echo "Examples:"
    echo "  ./server.sh start --background            # Start in background on port 3000"
    echo "  ./server.sh start --port 8080             # Start on custom port 8080"
    echo "  ./server.sh start -p 5000 -b -n          # Custom port, background, no browser"
    echo "  ./server.sh start --port=4000             # Alternative port syntax"
    echo "  ./server.sh stop --port 8080              # Stop server on specific port"
    echo "  ./server.sh restart -p 5000 -b           # Restart on custom port in background"
    echo "  ./server.sh status --port 8080            # Check status on specific port"
    echo "  ./server.sh logs --follow                 # Follow logs live"
    echo "  ./server.sh home --port 4000              # Open home screen on custom port"
    echo ""
    echo "Quick shortcuts:"
    echo "  ./server.sh                              # Same as 'status'"
    echo "  ./server.sh start                        # Start server with auto-open"
}

# Function to start server
start_server() {
    local background=false
    local no_open=false
    
    # Parse flags
    while [[ $# -gt 0 ]]; do
        case $1 in
            --background|-b)
                background=true
                shift
                ;;
            --no-open|-n)
                no_open=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo "🚀 Starting MCP Manager Server..."
    echo "📁 Project Directory: $PROJECT_DIR"
    echo "🌐 Dashboard will be available at: http://localhost:$PORT"
    echo ""
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Check if port is already in use
    if is_server_running; then
        print_warning "Port $PORT is already in use!"
        echo "🔍 Process using port $PORT:"
        lsof -i :"$PORT"
        echo ""
        print_info "To stop the existing server, run: ./server.sh stop"
        print_info "Or open the dashboard directly: open http://localhost:$PORT"
        
        # If server is already running, offer to open browser
        if [ "$no_open" = false ]; then
            echo ""
            echo "🌐 Opening dashboard in browser..."
            open "http://localhost:$PORT"
        fi
        return 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Ensure logs directory exists
    ensure_logs_dir
    
    # Start the server
    if [ "$background" = true ]; then
        echo "▶️  Starting server in background..."
        PORT=$PORT node src/backend/server.js > "$LOG_FILE" 2>&1 &
        local server_pid=$!
        
        # Wait a moment for server to start
        sleep 3
        
        # Check if server started successfully
        if is_server_running; then
            print_status "Server started successfully in background!"
            echo "🆔 Process ID: $server_pid"
            echo "🌐 Dashboard: http://localhost:$PORT"
            
            # Test API to make sure it's fully ready
            local api_ready=false
            for i in {1..5}; do
                if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
                    api_ready=true
                    break
                fi
                sleep 1
            done
            
            if [ "$api_ready" = true ] && [ "$no_open" = false ]; then
                echo "🌐 Opening dashboard in browser..."
                open "http://localhost:$PORT"
            elif [ "$no_open" = false ]; then
                print_warning "API not ready yet, skipping browser open"
                print_info "You can manually open: http://localhost:$PORT"
            fi
            
            echo "📋 View logs: ./server.sh logs"
            echo "🛑 To stop: ./server.sh stop"
        else
            print_error "Failed to start server in background"
            echo "📋 Check logs: ./server.sh logs"
            return 1
        fi
    else
        echo "▶️  Starting server in foreground..."
        print_info "Press Ctrl+C to stop the server"
        print_info "To start in background, use: ./server.sh start --background"
        
        if [ "$no_open" = false ]; then
            print_info "Dashboard will open automatically once server is ready"
            
            # Ensure logs directory exists for temporary logging
            ensure_logs_dir
            
            # Start server in background temporarily to test when it's ready
            PORT=$PORT node src/backend/server.js > "$LOG_FILE" 2>&1 &
            local temp_pid=$!
            
            # Wait for server to be ready
            local server_ready=false
            for i in {1..10}; do
                if is_server_running && curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
                    server_ready=true
                    break
                fi
                sleep 1
            done
            
            # Kill the temporary background process
            kill $temp_pid 2>/dev/null
            wait $temp_pid 2>/dev/null
            
            if [ "$server_ready" = true ]; then
                echo "🌐 Opening dashboard in browser..."
                open "http://localhost:$PORT" &
            fi
        fi
        
        echo ""
        PORT=$PORT node src/backend/server.js
    fi
}

# Function to stop server
stop_server() {
    echo "🛑 Stopping MCP Manager Server..."
    
    if ! is_server_running; then
        print_info "No MCP Manager server process found running."
        return 0
    fi
    
    local server_pid=$(get_server_pid)
    echo "🔍 Found running server process: PID $server_pid"
    
    echo "⏹️  Stopping server..."
    pkill -f "node src/backend/server.js"
    
    # Wait a moment for the process to stop
    sleep 2
    
    # Check if it's really stopped
    if is_server_running; then
        print_warning "Server still running, force killing..."
        pkill -9 -f "node src/backend/server.js"
        sleep 1
    fi
    
    if is_server_running; then
        print_error "Failed to stop server"
        return 1
    else
        print_status "Server stopped successfully!"
    fi
    
    # Double-check port
    if lsof -Pi :"$PORT" -sTCP:LISTEN -t > /dev/null 2>&1; then
        print_warning "Something else is still using port $PORT:"
        lsof -i :"$PORT"
    else
        print_status "Port $PORT is now free."
    fi
}

# Function to restart server
restart_server() {
    local background=false
    local no_open=false
    
    # Parse flags
    while [[ $# -gt 0 ]]; do
        case $1 in
            --background|-b)
                background=true
                shift
                ;;
            --no-open|-n)
                no_open=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo "🔄 Restarting MCP Manager Server..."
    echo ""
    
    # Stop the server first
    echo "1️⃣ Stopping existing server..."
    stop_server
    
    echo ""
    echo "2️⃣ Starting server..."
    
    # Build arguments for start_server
    local start_args=()
    if [ "$background" = true ]; then
        start_args+=("--background")
    fi
    if [ "$no_open" = true ]; then
        start_args+=("--no-open")
    fi
    
    start_server "${start_args[@]}"
}

# Function to show server status
show_status() {
    echo "🔍 MCP Manager Server Status Check"
    echo "=================================="
    
    # Check if port is in use
    if is_server_running; then
        print_status "Server is running on port $PORT"
        echo ""
        echo "📊 Process Details:"
        lsof -i :"$PORT"
        echo ""
        echo "🌐 Dashboard: http://localhost:$PORT"
        
        # Test API health
        echo ""
        echo "🧪 API Health Check:"
        if curl -s http://localhost:$PORT/api/health > /dev/null; then
            print_status "API is responding"
            echo "📋 API Response:"
            curl -s http://localhost:$PORT/api/health | jq . 2>/dev/null || curl -s http://localhost:$PORT/api/health
        else
            print_error "API is not responding"
        fi
        
        # Check MCP config file
        echo ""
        echo "📁 MCP Config File Status:"
        if [ -f ~/.aws/amazonq/mcp.json ]; then
            print_status "Config file exists: ~/.aws/amazonq/mcp.json"
            echo "📏 File size: $(wc -c < ~/.aws/amazonq/mcp.json) bytes"
            if [ $(wc -c < ~/.aws/amazonq/mcp.json) -gt 0 ]; then
                print_status "Config file has content"
                # Count servers
                local server_count=$(jq '.mcpServers | length' ~/.aws/amazonq/mcp.json 2>/dev/null || echo "unknown")
                echo "🔢 Number of MCP servers: $server_count"
            else
                print_warning "Config file is empty"
            fi
        else
            print_error "Config file not found"
        fi
        
    else
        print_error "Server is not running on port $PORT"
        echo ""
        print_info "To start the server:"
        echo "   ./server.sh start --background    # Background mode"
        echo "   ./server.sh start                 # Foreground mode"
        echo ""
        echo "🔍 Checking for any node processes:"
        if pgrep -f "node src/backend/server.js" > /dev/null; then
            print_warning "Found node src/backend/server.js processes (but not on port $PORT):"
            ps aux | grep "node src/backend/server.js" | grep -v grep
        else
            print_info "No node src/backend/server.js processes found"
        fi
    fi
    
    echo ""
    echo "🛠️  Available Commands:"
    echo "   ./server.sh start [--background]  - Start the server"
    echo "   ./server.sh stop                  - Stop the server"
    echo "   ./server.sh restart [--background] - Restart the server"
    echo "   ./server.sh status                - Check server status"
    echo "   ./server.sh logs [--follow]       - View server logs"
}

# Function to open home screen
open_home_screen() {
    echo "🏠 Opening MCP Manager Home Screen..."
    echo "🌐 Home Screen: http://localhost:$PORT/home"
    echo ""
    
    # Check if server is running
    if is_server_running; then
        print_status "Server is running - opening home screen"
        open "http://localhost:$PORT/home"
    else
        print_warning "Server is not running"
        echo ""
        echo "💡 The home screen provides a beautiful interface to:"
        echo "   • Start and stop the server"
        echo "   • Monitor server status in real-time"
        echo "   • Access dashboard and logs"
        echo "   • Control everything without command line!"
        echo ""
        echo "🚀 Starting server and opening home screen..."
        
        # Start server in background and open home screen
        start_server --background --no-open
        
        if is_server_running; then
            sleep 2
            print_status "Opening home screen in browser"
            open "http://localhost:$PORT/home"
        else
            print_error "Failed to start server"
            return 1
        fi
    fi
}

# Function to show logs
show_logs() {
    local follow=false
    
    # Parse follow flag
    if [[ "$1" == "--follow" || "$1" == "-f" ]]; then
        follow=true
    fi
    
    if [ ! -f "$LOG_FILE" ]; then
        print_warning "Log file not found: $LOG_FILE"
        print_info "Logs are only available when server is started in background mode"
        return 1
    fi
    
    echo "📋 MCP Manager Server Logs"
    echo "=========================="
    echo "📁 Log file: $LOG_FILE"
    echo ""
    
    if [ "$follow" = true ]; then
        echo "👀 Following logs (Press Ctrl+C to stop)..."
        echo ""
        tail -f "$LOG_FILE"
    else
        echo "📄 Recent logs (last 20 lines):"
        echo ""
        tail -20 "$LOG_FILE"
        echo ""
        print_info "To follow logs live: ./server.sh logs --follow"
    fi
}

# Parse port from all arguments first (skip if help command)
if [[ "${1:-status}" != "help" && "$1" != "--help" && "$1" != "-h" ]]; then
    if ! parse_port_argument "$@"; then
        exit 1
    fi
fi

# Main script logic
case "${1:-status}" in
    "start")
        shift
        # Filter out port arguments as they're already parsed
        filtered_args=()
        skip_next=false
        for arg in "$@"; do
            if [ "$skip_next" = true ]; then
                skip_next=false
                continue
            fi
            case "$arg" in
                --port=*)
                    # Skip this argument as it's already parsed
                    ;;
                --port|-p)
                    # Skip this and the next argument
                    skip_next=true
                    ;;
                *)
                    filtered_args+=("$arg")
                    ;;
            esac
        done
        start_server "${filtered_args[@]}"
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        shift
        # Filter out port arguments as they're already parsed
        filtered_args=()
        skip_next=false
        for arg in "$@"; do
            if [ "$skip_next" = true ]; then
                skip_next=false
                continue
            fi
            case "$arg" in
                --port=*)
                    # Skip this argument as it's already parsed
                    ;;
                --port|-p)
                    # Skip this and the next argument
                    skip_next=true
                    ;;
                *)
                    filtered_args+=("$arg")
                    ;;
            esac
        done
        restart_server "${filtered_args[@]}"
        ;;
    "status"|"")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "home")
        open_home_screen
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
