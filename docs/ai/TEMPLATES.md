# AI Development Templates

**Templates and patterns for AI-assisted development in MyBitcoinFuture**

## 🚀 Feature Development Template

### **Context Template**
```
Context: MyBitcoinFuture Organization
- Repository: dashboard
- Current file: api/routes/wallets.js
- Related repositories: core, plugins
- Bitcoin network: mainnet
- Integration points: Bitcoin Core RPC, Mempool API

GOAL: Add wallet balance caching feature

REQUIREMENTS:
1. Cache wallet balances for 5 minutes
2. Invalidate cache on new transactions
3. Support multiple wallets
4. Handle cache misses gracefully

CONSTRAINTS:
- Must follow existing caching patterns
- Must maintain security (xpub-only)
- Must include proper error handling
- Must be testable
```

### **API Endpoint Template**
```javascript
router.get('/wallet/:id/balance', 
  authMiddleware,
  rateLimitMiddleware,
  validateWalletId,
  async (req, res) => {
    try {
      const balance = await walletService.getBalance(req.params.id);
      return ApiResponse.success(res, { balance });
    } catch (error) {
      logger.error('Wallet balance error:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }
);
```

### **Service Template**
```javascript
class WalletService extends BaseService {
  constructor() {
    super('WalletService');
    this.cache = new CacheManager();
  }

  async getBalance(walletId) {
    try {
      // Check cache first
      const cached = await this.cache.get(`wallet:${walletId}:balance`);
      if (cached) return cached;

      // Get from Bitcoin Core
      const balance = await this.getBalanceFromBitcoinCore(walletId);
      
      // Cache for 5 minutes
      await this.cache.set(`wallet:${walletId}:balance`, balance, 300);
      
      return balance;
    } catch (error) {
      this.logger.error('Failed to get wallet balance', { walletId, error });
      throw new ServiceError('Failed to get wallet balance');
    }
  }
}
```

## 🎨 Frontend Component Template

### **React Component Template**
```javascript
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/formatters';

const WalletCard = ({ walletId }) => {
  const { t } = useTranslation();
  const { wallet, loading, error } = useWallet(walletId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error.message}</div>;

  return (
    <div className="wallet-card">
      <h3>{t('wallet.name', { name: wallet.name })}</h3>
      <p>{t('wallet.balance')}: {formatCurrency(wallet.balance)}</p>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? t('common.collapse') : t('common.expand')}
      </button>
    </div>
  );
};

export default WalletCard;
```

### **Hook Template**
```javascript
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export const useWallet = (walletId) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/wallets/${walletId}`);
        setWallet(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (walletId) {
      fetchWallet();
    }
  }, [walletId]);

  return { wallet, loading, error };
};
```

## 🧪 Testing Template

### **Unit Test Template**
```javascript
describe('WalletService', () => {
  let walletService;
  let mockCache;
  let mockBitcoinCore;

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn()
    };
    mockBitcoinCore = {
      getBalance: jest.fn()
    };
    walletService = new WalletService(mockCache, mockBitcoinCore);
  });

  describe('getBalance', () => {
    it('should return cached balance when available', async () => {
      const cachedBalance = { btc: 1.5, usd: 45000 };
      mockCache.get.mockResolvedValue(cachedBalance);

      const result = await walletService.getBalance('wallet-1');

      expect(result).toEqual(cachedBalance);
      expect(mockCache.get).toHaveBeenCalledWith('wallet:wallet-1:balance');
    });

    it('should fetch from Bitcoin Core when cache miss', async () => {
      const balance = { btc: 2.0, usd: 60000 };
      mockCache.get.mockResolvedValue(null);
      mockBitcoinCore.getBalance.mockResolvedValue(balance);

      const result = await walletService.getBalance('wallet-1');

      expect(result).toEqual(balance);
      expect(mockCache.set).toHaveBeenCalledWith('wallet:wallet-1:balance', balance, 300);
    });
  });
});
```

## 🔧 Configuration Template

### **Environment Template**
```bash
# Bitcoin Core Configuration
BITCOIN_CORE_HOST=localhost
BITCOIN_CORE_PORT=8332
BITCOIN_CORE_USER=rpcuser
BITCOIN_CORE_PASSWORD=rpcpassword
BITCOIN_NETWORK=mainnet

# API Configuration
API_PORT=3100
API_HOST=localhost
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Database Configuration
DATABASE_URL=sqlite:./data/treasury.db
DATABASE_LOGGING=false

# Cache Configuration
CACHE_TTL=300
CACHE_MAX_SIZE=1000

# Security Configuration
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📝 Documentation Template

### **API Documentation Template**
```markdown
## GET /wallets/{id}/balance

Get the current balance for a specific wallet.

### Parameters
- `id` (string, required) - Wallet ID

### Headers
- `Authorization: Bearer <token>` (required)

### Response
```json
{
  "success": true,
  "data": {
    "balance": {
      "btc": 1.5,
      "usd": 45000,
      "lastUpdated": "2025-08-20T21:30:00Z"
    }
  }
}
```

### Error Responses
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Wallet not found
- `500 Internal Server Error` - Server error
```

---

**Use these templates to ensure consistent, high-quality development.**
