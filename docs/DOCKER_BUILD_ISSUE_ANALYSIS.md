# Docker Build Issue Analysis

**Date:** September 21, 2025  
**Status:** Root Cause Identified  
**Issue:** Self-hosted runner Electron builder failures

## Problem Summary

The GitHub Actions workflows are failing on the self-hosted runner (`linode-runner-01`) due to Electron builder issues, not Docker registry problems as initially suspected.

## Root Cause Analysis

### 1. Docker Build Script Error (FIXED)
```
/home/jswift/actions-runner/_work/_temp/b9f88863-5b06-48d9-a003-6d042d407f50.sh: line 6: bashn#: command not found
```

**Issue:** Complex shell script with nested quotes and sed operations was generating malformed commands.
**Status:** ✅ **FIXED** - Simplified the Docker release update script to avoid quote escaping issues.

### 2. Linux Build Failure
```
⨯ /home/jswift/.npm/_npx/009083ec26dc578f/node_modules/app-builder-bin/linux/x64/app-builder process failed ERR_ELECTRON_BUILDER_CANNOT_EXECUTE
```

**Issue:** The Electron app-builder binary cannot execute on the self-hosted runner.

### 3. Windows Build Failure
```
⨯ cannot execute cause=exit status 53
errorOut=wine: failed to open "/home/jswift/.cache/electron-builder/winCodeSign/winCodeSign-2.6.0/rcedit-ia32.exe": c0000135
```

**Issue:** Wine cannot execute the Windows code signing tool `rcedit-ia32.exe` with error `c0000135` (DLL initialization failed).

## Environment Details

- **Runner:** `linode-runner-01` (self-hosted)
- **Docker Registry:** `127.0.0.1:5000` (local registry - working correctly)
- **Node Version:** 20
- **Runner Version:** 2.328.0
- **Git Version:** 2.43.0

## Current Status

✅ **Docker Registry:** Working correctly at `127.0.0.1:5000`  
✅ **Docker Release Script:** Fixed - no more `bashn#` command errors  
❌ **Electron Builder:** Failing on both Linux and Windows builds  
❌ **Vite Build:** Failing due to missing `web/dist/index.html`  

## Recommended Solutions

### 1. Fix Electron Builder Permissions
```bash
# On the self-hosted runner
chmod +x /home/jswift/.npm/_npx/*/node_modules/app-builder-bin/linux/x64/app-builder
chmod +x /home/jswift/.cache/electron-builder/winCodeSign/winCodeSign-2.6.0/rcedit-ia32.exe
```

### 2. Install Missing Dependencies
```bash
# Install Wine dependencies for Windows builds
sudo apt-get update
sudo apt-get install wine64 wine32

# Install additional Electron builder dependencies
sudo apt-get install libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
```

### 3. Alternative: Use GitHub-hosted Runners
Consider using GitHub-hosted runners for Electron builds while keeping self-hosted runners for other tasks.

### 4. Docker-based Builds
Move Electron builds to Docker containers to ensure consistent environment.

## Monitoring Solution

A periodic monitoring system has been implemented to track workflow status:

```bash
# Monitor all repositories every 5 minutes
./scripts/github/monitor-workflows.sh

# Monitor only failures
./scripts/github/monitor-workflows.sh --notify-failures

# Monitor specific repositories
./scripts/github/monitor-workflows.sh --repos dashboard,website
```

## Next Steps

1. **Immediate:** Fix Electron builder permissions on self-hosted runner
2. **Short-term:** Install missing Wine dependencies
3. **Long-term:** Consider Docker-based build strategy
4. **Monitoring:** Use the new periodic monitoring system to track progress

## Files Modified

- `scripts/github/periodic-monitor.js` - Core monitoring logic
- `scripts/github/monitor-workflows.sh` - User-friendly wrapper script
- `docs/DOCKER_BUILD_ISSUE_ANALYSIS.md` - This analysis document

## Related Issues

- All recent workflow runs are failing (Run IDs: 17888183436, 17886725372, 17886474611)
- The issue affects both Linux and Windows builds
- Docker registry is working correctly - the issue is with Electron builder execution
