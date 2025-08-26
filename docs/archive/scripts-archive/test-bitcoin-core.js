#!/usr/bin/env node

/**
 * Test Bitcoin Core Service
 *
 * Validates connection to LAN Bitcoin Core node (192.168.2.100) with fallback
 */

const BitcoinCoreService = require('./shared/src/services/BitcoinCoreService');

async function testBitcoinCoreService() {
  console.log('🔍 Testing Bitcoin Core Service...\n');

  const bitcoinService = new BitcoinCoreService({
    timeout: 5000
  });

  try {
    // Test connection
    console.log('1. Testing connection...');
    const connectionResult = await bitcoinService.testConnection();

    if (connectionResult.success) {
      console.log('✅ Connection successful!');
      console.log(`   Source: ${connectionResult.source}`);
      console.log(`   Chain: ${connectionResult.chain}`);
      console.log(`   Blocks: ${connectionResult.blocks}`);
      console.log(`   Headers: ${connectionResult.headers}`);
      console.log(`   Verification Progress: ${(connectionResult.verificationProgress * 100).toFixed(2)}%`);
    } else {
      console.log('❌ Connection failed:', connectionResult.error);
      return;
    }

    console.log('\n2. Getting blockchain info...');
    const blockchainInfo = await bitcoinService.getBlockchainInfo();
    console.log('✅ Blockchain info retrieved:');
    console.log(`   Best block hash: ${blockchainInfo.bestblockhash}`);
    console.log(`   Difficulty: ${blockchainInfo.difficulty}`);
    console.log(`   Size on disk: ${(blockchainInfo.size_on_disk / 1024 / 1024 / 1024).toFixed(2)} GB`);

    console.log('\n3. Getting mempool info...');
    const mempoolInfo = await bitcoinService.getMempoolInfo();
    console.log('✅ Mempool info retrieved:');
    console.log(`   Transactions in mempool: ${mempoolInfo.size}`);
    console.log(`   Mempool size: ${(mempoolInfo.bytes / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n4. Getting connection status...');
    const connectionStatus = await bitcoinService.getConnectionStatus();
    console.log('✅ Connection status:');
    console.log(`   Connected: ${connectionStatus.connected}`);
    console.log(`   Current source: ${connectionStatus.source}`);
    console.log(`   Blocks: ${connectionStatus.blocks}`);

    console.log('\n🎉 All tests passed! Bitcoin Core service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBitcoinCoreService().catch(console.error);
