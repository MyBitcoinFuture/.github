#!/bin/bash

# MyBitcoinFuture Build Status Checker
# Simple wrapper for the GitHub build monitor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/github-build-monitor.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}MyBitcoinFuture Build Status Checker${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -r, --repo <repo>        Check specific repository (dashboard, website, plugins, private-plugins)"
    echo "  -b, --branch <branch>    Check specific branch (default: main)"
    echo "  -w, --workflow <file>    Check specific workflow file"
    echo "  -l, --limit <number>     Number of recent runs to check (default: 5)"
    echo "  -f, --format <format>    Output format: table, json, summary (default: table)"
    echo "  --watch                  Watch mode - continuously monitor builds"
    echo "  -i, --interval <secs>    Watch interval in seconds (default: 30)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --repo dashboard"
    echo "  $0 --repo dashboard --workflow ci.yml --format json"
    echo "  $0 --watch --interval 60"
    echo "  $0 --repo plugins --format summary"
    echo ""
    echo "Quick Commands:"
    echo "  $0 dashboard              # Check dashboard builds"
    echo "  $0 website               # Check website builds"
    echo "  $0 plugins               # Check plugins builds"
    echo "  $0 all                   # Check all repositories"
    echo "  $0 watch                 # Watch all builds"
}

# Function to check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
        echo "Please install Node.js to use this script"
        exit 1
    fi
}

# Function to check if monitor script exists
check_script() {
    if [ ! -f "$MONITOR_SCRIPT" ]; then
        echo -e "${RED}❌ Monitor script not found: $MONITOR_SCRIPT${NC}"
        exit 1
    fi
}

# Function to load .env file
load_env_file() {
    local env_file="$(dirname "$SCRIPT_DIR")/.env"
    if [ -f "$env_file" ]; then
        export $(grep -v '^#' "$env_file" | xargs)
    fi
}

# Function to check GitHub token
check_token() {
    # Load .env file first
    load_env_file
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set${NC}"
        echo "You can set it with: export GITHUB_TOKEN=your_token"
        echo "Or create a .env file with: GITHUB_TOKEN=your_token"
        echo ""
        echo -e "${YELLOW}Note: Without a token, you'll be limited to 60 requests/hour${NC}"
        echo "With a token, you get 5000 requests/hour"
        echo ""
    else
        echo -e "${GREEN}✅ GITHUB_TOKEN loaded from .env file${NC}"
    fi
}

# Function to run the monitor
run_monitor() {
    local args=()
    
    # Convert short options to long options
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--repo)
                args+=("--repo" "$2")
                shift 2
                ;;
            -b|--branch)
                args+=("--branch" "$2")
                shift 2
                ;;
            -w|--workflow)
                args+=("--workflow" "$2")
                shift 2
                ;;
            -l|--limit)
                args+=("--limit" "$2")
                shift 2
                ;;
            -f|--format)
                args+=("--format" "$2")
                shift 2
                ;;
            --watch)
                args+=("--watch")
                shift
                ;;
            -i|--interval)
                args+=("--interval" "$2")
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            dashboard|website|plugins|private-plugins)
                args+=("--repo" "$1")
                shift
                ;;
            all)
                # No repo specified means all repos
                shift
                ;;
            watch)
                args+=("--watch")
                shift
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Run the monitor script
    node "$MONITOR_SCRIPT" "${args[@]}"
}

# Main execution
main() {
    check_node
    check_script
    check_token
    
    if [ $# -eq 0 ]; then
        echo -e "${BLUE}🔍 Checking all repositories...${NC}"
        run_monitor
    else
        run_monitor "$@"
    fi
}

# Run main function with all arguments
main "$@"
