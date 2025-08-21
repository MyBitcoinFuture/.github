# Start9 Integration Guide

**Version:** 1.0.0  
**Last Updated:** August 2025  
**Status:** Active Integration

## Overview

MyBitcoinFuture integrates with Start9's self-sovereign server platform to leverage local Bitcoin services including Bitcoin Core, Mempool, and Electrs. This integration provides enhanced privacy, security, and performance by using local Bitcoin infrastructure instead of external APIs.

## Architecture

```
MyBitcoinFuture Dashboard
├── Bitcoin Core RPC (192.168.2.100:8332)
├── Mempool API (192.168.2.100:8080)
├── Electrs API (192.168.2.100:50001)
└── BRK Analytics (localhost:3110)
```

## Prerequisites

### Start9 Server Requirements
- **Bitcoin Core**: Full node with RPC enabled
- **Mempool**: Local mempool.space instance
- **Electrs**: Electrum Rust Server
- **Network Access**: LAN connectivity to Start9 server

### Network Configuration
- **Start9 IP**: `YOUR_START9_IP` (e.g., 192.168.1.100)
- **Bitcoin Core RPC**: Port 8332
- **Mempool API**: Port 8080
- **Electrs**: Port 50001

## Configuration

### Local Configuration Setup

**⚠️ Important: Never commit actual IP addresses, credentials, or personal information to public repositories!**

For your local development environment:

1. **Create your local configuration:**
   ```bash
   cp dashboard/config/local.env.example dashboard/config/local.env
   ```

2. **Edit with your actual values:**
   ```bash
   # Replace YOUR_START9_IP with your actual Start9 server IP
   # Replace credentials with your actual Bitcoin Core RPC credentials
   nano dashboard/config/local.env
   ```

3. **Source before running:**
   ```bash
   source dashboard/config/local.env
   npm start
   ```

### Environment Variables

```bash
# Start9 Bitcoin Core Configuration
BITCOIN_HOST=YOUR_START9_IP
BITCOIN_PORT=8332
BITCOIN_RPCUSER=your-bitcoin-rpc-username
BITCOIN_RPCPASSWORD=your-bitcoin-rpc-password
BITCOIN_RPC_URL=http://YOUR_START9_IP:8332
BITCOIN_RPC_ENABLED=true

# Start9 Mempool Configuration
MEMPOOL_HOST=YOUR_START9_IP
MEMPOOL_PORT=8080
MEMPOOL_API_URL=http://YOUR_START9_IP:8080/api
MEMPOOL_ENABLED=true

# Start9 Electrs Configuration
ELECTRUM_HOST=YOUR_START9_IP
ELECTRUM_PORT=50001
ELECTRUM_SSL=false
ELECTRUM_ENABLED=true
```

### Configuration Files

#### `dashboard/config/brk-integration.js`
Centralized configuration for all Start9 Bitcoin services:

```javascript
const BRK_CONFIG = {
  bitcoin: {
    host: process.env.BITCOIN_HOST || 'YOUR_START9_IP',
    port: 8332,
    rpcUser: process.env.BITCOIN_RPCUSER || 'bitcoin',
    rpcPassword: process.env.BITCOIN_RPCPASSWORD || '',
    timeout: 5000,
    enabled: true
  },
  mempool: {
    host: process.env.MEMPOOL_HOST || 'YOUR_START9_IP',
    port: 8080,
    apiUrl: process.env.MEMPOOL_API_URL || 'http://YOUR_START9_IP:8080/api',
    timeout: 5000,
    enabled: true
  },
  electrum: {
    host: process.env.ELECTRUM_HOST || 'YOUR_START9_IP',
    port: 50001,
    ssl: false,
    timeout: 30000,
    enabled: true
  }
};
```

## Service Integration

### Bitcoin Core Integration

#### Health Monitoring
- **Endpoint**: `/api/bitcoin-core-health`
- **Checks**: RPC connectivity, blockchain sync status
- **Fallback**: External Bitcoin APIs

#### Authentication
- **Endpoint**: `/api/bitcoin-auth`
- **Method**: RPC authentication validation
- **Security**: Credential validation

#### Real Data Service
- **Service**: `RealBitcoinDataService`
- **Features**: Real-time blockchain data
- **Fallback**: Mock data when unavailable

### Mempool Integration

#### Health Monitoring
- **Endpoint**: `/api/mempool-health`
- **Checks**: API connectivity, fee estimates
- **Fallback**: mempool.space API

#### Features
- Real-time transaction data
- Fee estimation
- Mempool statistics
- Transaction broadcasting

### Electrs Integration

#### Health Monitoring
- **Endpoint**: `/api/electrum-health`
- **Checks**: Electrum protocol connectivity
- **Fallback**: External Electrum servers

#### Features
- Address balance queries
- Transaction history
- UTXO management
- Multi-address support

## Health Monitoring

### Comprehensive Health Dashboard
- **Endpoint**: `/api/comprehensive-health`
- **Services**: All Start9 services
- **Status**: Real-time health status
- **Refresh**: Manual refresh capability

### Health Check Endpoints

```javascript
// Individual service health checks
GET /api/bitcoin-core-health
GET /api/mempool-health
GET /api/electrum-health

// Comprehensive health status
GET /api/comprehensive-health
POST /api/comprehensive-health/refresh
```

## Fallback Mechanisms

### Service Unavailability
When Start9 services are unavailable, the system falls back to:

1. **External APIs**: mempool.space, blockchain.info
2. **Mock Data**: Realistic simulation data
3. **Cached Data**: Previously fetched data

### Configuration
```javascript
// Fallback configuration
BRK_FALLBACK_ENABLED=true
BRK_FALLBACK_BASE_PRICE=45000
BRK_FALLBACK_VOLATILITY=0.05
BRK_FALLBACK_HISTORY_DAYS=180
```

## Security Considerations

### Credential Management
- **Environment Variables**: All credentials stored in environment variables
- **No Hardcoding**: No credentials in source code
- **Secure Storage**: Credentials in `.env` files (not committed)

### Network Security
- **LAN Access**: Services accessible only on local network
- **RPC Authentication**: Bitcoin Core RPC authentication required
- **SSL/TLS**: Electrs SSL configuration available

### Audit Logging
- **Service Access**: All service interactions logged
- **Authentication**: Failed authentication attempts logged
- **Health Checks**: Service health status changes logged

## Deployment

### Start9 Application Manifest
```yaml
# platform-manifests/start9/manifest.yaml
name: mybitcoinfuture
version: 1.0.0
description: Bitcoin Treasury Management System
dependencies:
  - bitcoin
  - mempool
  - electrs
```

### Startup Script
```bash
# scripts/start-with-brk.sh
#!/bin/bash

# Set Start9 environment variables
export BITCOIN_HOST="192.168.2.100"
export BITCOIN_PORT="8332"
export MEMPOOL_HOST="192.168.2.100"
export MEMPOOL_PORT="8080"
export ELECTRUM_HOST="192.168.2.100"
export ELECTRUM_PORT="50001"

# Health checks
curl -s --max-time 10 http://192.168.2.100:8080/api/blocks/tip/height
curl -s --max-time 10 http://192.168.2.100:8332

# Start application
npm start
```

## Troubleshooting

### Common Issues

#### Bitcoin Core Connection Failed
```bash
# Check Bitcoin Core RPC
curl -u your-username:your-password \
  -d '{"jsonrpc":"1.0","id":"curltest","method":"getblockchaininfo","params":[]}' \
  -H 'content-type: text/plain;' \
  http://192.168.2.100:8332/
```

#### Mempool API Unavailable
```bash
# Check Mempool API
curl -s http://192.168.2.100:8080/api/blocks/tip/height
```

#### Electrs Connection Issues
```bash
# Check Electrs connectivity
telnet 192.168.2.100 50001
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug
DEBUG=true

# Check service logs
tail -f logs/mybitcoinfuture.log
```

### Health Check Commands
```bash
# Comprehensive health check
curl http://localhost:3100/api/comprehensive-health

# Individual service checks
curl http://localhost:3100/api/bitcoin-core-health
curl http://localhost:3100/api/mempool-health
curl http://localhost:3100/api/electrum-health
```

## Performance Optimization

### Caching Strategy
- **Bitcoin Data**: 60-second cache TTL
- **Mempool Data**: 30-second cache TTL
- **Electrum Data**: 60-second cache TTL

### Connection Pooling
- **Database**: 10 connection pool
- **Bitcoin RPC**: Connection reuse
- **HTTP Clients**: Keep-alive connections

### Monitoring
- **Metrics**: Prometheus metrics collection
- **Health Checks**: 30-second intervals
- **Alerting**: Service failure notifications

## Future Enhancements

### Planned Features
- **Lightning Network**: Lightning node integration
- **Multi-Node**: Multiple Bitcoin Core nodes
- **Advanced Analytics**: Enhanced blockchain analytics
- **Real-time Notifications**: WebSocket-based updates

### Integration Improvements
- **Service Discovery**: Automatic service detection
- **Load Balancing**: Multiple service instances
- **Failover**: Automatic service failover
- **Metrics**: Enhanced performance metrics

## Support

### Documentation
- **API Documentation**: `/docs/API_DOCUMENTATION.md`
- **System Overview**: `/docs/SYSTEM_OVERVIEW.md`
- **Quick Reference**: `/docs/QUICK_REFERENCE.md`

### Community
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Contributions**: Pull Requests welcome

---

**Note**: This integration provides enhanced privacy and security by using local Bitcoin infrastructure. Ensure proper network security and credential management for production deployments. 