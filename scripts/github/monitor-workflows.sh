#!/bin/bash

# MyBitcoinFuture Workflow Monitor
# Simple wrapper for the periodic GitHub workflow monitor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/periodic-monitor.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}MyBitcoinFuture Workflow Monitor${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -i, --interval <seconds>    Check interval in seconds (default: 300 = 5 minutes)"
    echo "  -r, --repos <repo1,repo2>   Comma-separated list of repositories to monitor"
    echo "  -f, --format <format>       Output format: json, summary, table (default: summary)"
    echo "  --notify-failures           Only show notifications for failed builds"
    echo "  --max-checks <number>       Maximum number of checks before stopping"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Monitor dashboard every 5 minutes"
    echo "  $0 --interval 60                     # Check every minute"
    echo "  $0 --repos dashboard,website         # Monitor multiple repos"
    echo "  $0 --notify-failures                 # Only show failures"
    echo "  $0 --max-checks 10                   # Stop after 10 checks"
    echo ""
    echo "Quick Commands:"
    echo "  $0 dashboard              # Monitor dashboard only"
    echo "  $0 all                    # Monitor all repositories"
    echo "  $0 failures               # Monitor failures only"
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
    local env_file="$(dirname "$SCRIPT_DIR")/../../.env"
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
        echo -e "${GREEN}✅ GITHUB_TOKEN loaded${NC}"
    fi
}

# Function to run the monitor
run_monitor() {
    local args=()
    
    # Convert short options to long options
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--interval)
                args+=("--interval" "$2")
                shift 2
                ;;
            -r|--repos)
                args+=("--repos" "$2")
                shift 2
                ;;
            -f|--format)
                args+=("--format" "$2")
                shift 2
                ;;
            --notify-failures)
                args+=("--notify-failures")
                shift
                ;;
            --max-checks)
                args+=("--max-checks" "$2")
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            dashboard)
                args+=("--repos" "dashboard")
                shift
                ;;
            all)
                args+=("--repos" "dashboard,website,plugins,private-plugins,platform-manifests")
                shift
                ;;
            failures)
                args+=("--notify-failures")
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
        echo -e "${BLUE}🔍 Starting periodic monitoring...${NC}"
        run_monitor
    else
        run_monitor "$@"
    fi
}

# Run main function with all arguments
main "$@"
