/**
 * Plugin Integration Tests
 * 
 * Comprehensive integration tests for cross-plugin functionality:
 * - Cross-plugin communication
 * - Job queue integration
 * - Event bus communication
 * - Error handling across plugins
 */

const AlertsPlugin = require('../../plugins/alerts/src/index');
const EvangelistPlugin = require('../../plugins/evangelist/src/index');
const NotesPlugin = require('../../plugins/notes/src/index');
const ContactsPlugin = require('../../plugins/contacts/src/index');
const ChainAnalysisPlugin = require('../../plugins/chain-analysis/src/index');

describe('Plugin Integration Tests', () => {
  let alertsPlugin, evangelistPlugin, notesPlugin, contactsPlugin, chainAnalysisPlugin;
  let mockContext;
  let mockEventBus;

  beforeEach(() => {
    // Create mock event bus
    mockEventBus = {
      events: {},
      on: jest.fn((event, listener) => {
        if (!mockEventBus.events[event]) {
          mockEventBus.events[event] = [];
        }
        mockEventBus.events[event].push(listener);
      }),
      emit: jest.fn((event, data) => {
        if (mockEventBus.events[event]) {
          mockEventBus.events[event].forEach(listener => listener(data));
        }
      }),
      removeListener: jest.fn()
    };

    // Create shared mock context
    mockContext = {
      config: {
        alerts: {
          enabled: true,
          price_source: 'brk',
          check_interval: 60,
          max_alerts_per_hour: 10
        },
        evangelist: {
          enabled: true,
          auto_tracking: true,
          contact_integration: {
            auto_link_contacts: true,
            create_contact_notes: true
          }
        },
        notes: {
          enabled: true,
          auto_categorization: true
        },
        contacts: {
          enabled: true,
          sync_enabled: true
        },
        chain_analysis: {
          enabled: true,
          auto_categorization: true,
          integration_settings: {
            integrate_with_notes: true,
            integrate_with_contacts: true
          }
        }
      },
      eventBus: mockEventBus,
      pluginManager: {
        getPlugin: jest.fn()
      },
      jobQueue: {
        scheduleJob: jest.fn().mockResolvedValue({ jobId: 'test-job' }),
        getStatus: jest.fn().mockResolvedValue({ active: 1, queued: 0 })
      },
      taskRunner: {
        registerTask: jest.fn().mockResolvedValue(true),
        getAllStatuses: jest.fn().mockResolvedValue([])
      }
    };

    // Initialize plugins
    alertsPlugin = new AlertsPlugin();
    evangelistPlugin = new EvangelistPlugin();
    notesPlugin = new NotesPlugin();
    contactsPlugin = new ContactsPlugin();
    chainAnalysisPlugin = new ChainAnalysisPlugin();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cross-Plugin Communication', () => {
    beforeEach(async () => {
      // Initialize all plugins
      await alertsPlugin.initializePlugin(mockContext);
      await evangelistPlugin.initializePlugin(mockContext);
      await notesPlugin.initializePlugin(mockContext);
      await contactsPlugin.initializePlugin(mockContext);
      await chainAnalysisPlugin.initializePlugin(mockContext);

      // Start all plugins
      await alertsPlugin.startPlugin();
      await evangelistPlugin.startPlugin();
      await notesPlugin.startPlugin();
      await contactsPlugin.startPlugin();
      await chainAnalysisPlugin.startPlugin();

      // Set up plugin manager to return plugin instances
      mockContext.pluginManager.getPlugin.mockImplementation((pluginName) => {
        const plugins = {
          'alerts': { instance: alertsPlugin },
          'evangelist': { instance: evangelistPlugin },
          'notes': { instance: notesPlugin },
          'contacts': { instance: contactsPlugin },
          'chain-analysis': { instance: chainAnalysisPlugin }
        };
        return plugins[pluginName] || null;
      });
    });

    test('should integrate evangelist with contacts plugin', async () => {
      // Create a contact first
      const contactData = global.testUtils.createMockContact();
      const contactResult = await contactsPlugin.executeCommand('add-contact', contactData);
      expect(contactResult.success).toBe(true);

      // Create a recommendation linked to the contact
      const recommendationData = {
        contactId: contactResult.contact.id,
        amount: 0.01,
        price: 45000,
        template: 'First Purchase'
      };

      const recommendationResult = await evangelistPlugin.executeCommand('add-recommendation', recommendationData);
      expect(recommendationResult.success).toBe(true);
      expect(recommendationResult.recommendation.contactId).toBe(contactResult.contact.id);
    });

    test('should integrate chain analysis with notes plugin', async () => {
      // Create a transaction
      const transaction = global.testUtils.createMockTransaction();
      
      // Analyze the transaction
      const analysisResult = await chainAnalysisPlugin.executeCommand('categorize-transaction', {
        transactionId: transaction.id,
        transaction: transaction
      });
      
      expect(analysisResult.success).toBe(true);
      expect(analysisResult.categorization).toBeDefined();

      // Check if automatic note was created
      const notesResult = await notesPlugin.executeCommand('get-notes-by-transaction', {
        transactionId: transaction.id
      });
      
      expect(notesResult.success).toBe(true);
      expect(notesResult.notes.length).toBeGreaterThan(0);
      
      // Verify the note is marked as automatic
      const automaticNote = notesResult.notes.find(note => note.isAutomatic);
      expect(automaticNote).toBeDefined();
      expect(automaticNote.content).toContain('🤖 **AUTO-GENERATED**');
    });

    test('should integrate alerts with job queue system', async () => {
      // Create an alert
      const alertData = global.testUtils.createMockAlert();
      const alertResult = await alertsPlugin.executeCommand('create-alert', alertData);
      expect(alertResult.success).toBe(true);

      // Check if job queue tasks were registered
      expect(mockContext.taskRunner.registerTask).toHaveBeenCalledWith(
        'price-monitor',
        expect.any(Function),
        expect.any(Number)
      );

      expect(mockContext.taskRunner.registerTask).toHaveBeenCalledWith(
        'alert-cleanup',
        expect.any(Function),
        24 * 60 * 60 * 1000
      );
    });

    test('should handle cross-plugin events correctly', async () => {
      // Set up event listeners
      let eventReceived = false;
      mockEventBus.on('recommendation_made', (data) => {
        eventReceived = true;
        expect(data).toBeDefined();
        expect(data.contactId).toBeDefined();
      });

      // Create a recommendation (should trigger event)
      const recommendationData = {
        contactId: 'test_contact',
        amount: 0.01,
        price: 45000,
        template: 'First Purchase'
      };

      await evangelistPlugin.executeCommand('add-recommendation', recommendationData);
      
      expect(eventReceived).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith('recommendation_made', expect.any(Object));
    });
  });

  describe('Job Queue Integration', () => {
    beforeEach(async () => {
      await alertsPlugin.initializePlugin(mockContext);
      await alertsPlugin.startPlugin();
    });

    test('should schedule jobs through job queue', async () => {
      const jobConfig = {
        name: 'test-job',
        handler: jest.fn(),
        priority: 'normal',
        retries: 3
      };

      const result = await alertsPlugin.scheduleJob(jobConfig);
      
      expect(mockContext.jobQueue.scheduleJob).toHaveBeenCalledWith(jobConfig);
      expect(result).toEqual({ jobId: 'test-job' });
    });

    test('should register recurring tasks', async () => {
      const taskName = 'test-task';
      const taskHandler = jest.fn();
      const interval = 60000; // 1 minute

      const result = await alertsPlugin.registerTask(taskName, taskHandler, interval);
      
      expect(mockContext.taskRunner.registerTask).toHaveBeenCalledWith(taskName, taskHandler, interval);
      expect(result).toBe(true);
    });

    test('should get job queue status', async () => {
      const status = await alertsPlugin.getJobQueueStatus();
      
      expect(status.available).toBe(true);
      expect(status.activeJobs).toBe(1);
      expect(status.queuedJobs).toBe(0);
    });

    test('should get task runner status', async () => {
      const status = await alertsPlugin.getTaskRunnerStatus();
      
      expect(status.available).toBe(true);
      expect(status.tasks).toEqual([]);
    });

    test('should handle missing job queue gracefully', async () => {
      alertsPlugin.jobQueue = null;
      
      const status = await alertsPlugin.getJobQueueStatus();
      expect(status.available).toBe(false);
      expect(status.error).toBe('Job queue not available');
    });

    test('should handle missing task runner gracefully', async () => {
      alertsPlugin.taskRunner = null;
      
      const status = await alertsPlugin.getTaskRunnerStatus();
      expect(status.available).toBe(false);
      expect(status.error).toBe('Task runner not available');
    });
  });

  describe('Error Handling Across Plugins', () => {
    beforeEach(async () => {
      await alertsPlugin.initializePlugin(mockContext);
      await evangelistPlugin.initializePlugin(mockContext);
      await notesPlugin.initializePlugin(mockContext);
      await alertsPlugin.startPlugin();
      await evangelistPlugin.startPlugin();
      await notesPlugin.startPlugin();
    });

    test('should handle plugin dependency errors gracefully', async () => {
      // Mock a plugin that doesn't exist
      mockContext.pluginManager.getPlugin.mockReturnValue(null);

      // Try to get contact info (should handle gracefully)
      const result = await evangelistPlugin.getContactInfo('nonexistent_contact');
      expect(result).toBeNull();
    });

    test('should handle service initialization errors', async () => {
      // Mock service to throw error
      alertsPlugin.alertManager = {
        initialize: jest.fn().mockRejectedValue(new Error('Service init failed'))
      };

      const result = await alertsPlugin.initializePlugin(mockContext);
      expect(result).toBe(false);
    });

    test('should handle command execution errors across plugins', async () => {
      // Mock service to throw error
      evangelistPlugin.recommendationTracker = {
        addRecommendation: jest.fn().mockRejectedValue(new Error('Add recommendation failed'))
      };

      const result = await evangelistPlugin.executeCommand('add-recommendation', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Add recommendation failed');
    });

    test('should handle event handling errors gracefully', async () => {
      // Mock service to throw error
      alertsPlugin.priceMonitor = {
        checkPrices: jest.fn().mockRejectedValue(new Error('Price check failed'))
      };

      // Should not throw error
      await expect(alertsPlugin.handlePriceChange({})).resolves.not.toThrow();
    });
  });

  describe('Data Flow Integration', () => {
    beforeEach(async () => {
      await alertsPlugin.initializePlugin(mockContext);
      await evangelistPlugin.initializePlugin(mockContext);
      await notesPlugin.initializePlugin(mockContext);
      await contactsPlugin.initializePlugin(mockContext);
      await chainAnalysisPlugin.initializePlugin(mockContext);
      await alertsPlugin.startPlugin();
      await evangelistPlugin.startPlugin();
      await notesPlugin.startPlugin();
      await contactsPlugin.startPlugin();
      await chainAnalysisPlugin.startPlugin();

      // Set up plugin manager
      mockContext.pluginManager.getPlugin.mockImplementation((pluginName) => {
        const plugins = {
          'alerts': { instance: alertsPlugin },
          'evangelist': { instance: evangelistPlugin },
          'notes': { instance: notesPlugin },
          'contacts': { instance: contactsPlugin },
          'chain-analysis': { instance: chainAnalysisPlugin }
        };
        return plugins[pluginName] || null;
      });
    });

    test('should flow data from contacts to evangelist to notes', async () => {
      // 1. Create contact
      const contactData = global.testUtils.createMockContact();
      const contactResult = await contactsPlugin.executeCommand('add-contact', contactData);
      expect(contactResult.success).toBe(true);

      // 2. Create recommendation linked to contact
      const recommendationData = {
        contactId: contactResult.contact.id,
        amount: 0.01,
        price: 45000,
        template: 'First Purchase'
      };
      const recommendationResult = await evangelistPlugin.executeCommand('add-recommendation', recommendationData);
      expect(recommendationResult.success).toBe(true);

      // 3. Check if note was created for the recommendation
      const notesResult = await notesPlugin.executeCommand('get-notes-by-transaction', {
        transactionId: `recommendation_${recommendationResult.recommendation.id}`
      });
      expect(notesResult.success).toBe(true);
      expect(notesResult.notes.length).toBeGreaterThan(0);
    });

    test('should flow data from chain analysis to notes with automatic categorization', async () => {
      // 1. Create transaction
      const transaction = global.testUtils.createMockTransaction();
      
      // 2. Analyze transaction
      const analysisResult = await chainAnalysisPlugin.executeCommand('categorize-transaction', {
        transactionId: transaction.id,
        transaction: transaction
      });
      expect(analysisResult.success).toBe(true);

      // 3. Check if automatic note was created
      const notesResult = await notesPlugin.executeCommand('get-notes-by-transaction', {
        transactionId: transaction.id
      });
      expect(notesResult.success).toBe(true);
      
      const automaticNote = notesResult.notes.find(note => note.isAutomatic);
      expect(automaticNote).toBeDefined();
      expect(automaticNote.source).toBe('chain-analysis');
    });

    test('should handle complex multi-plugin workflows', async () => {
      // 1. Create contact
      const contactData = global.testUtils.createMockContact();
      const contactResult = await contactsPlugin.executeCommand('add-contact', contactData);
      
      // 2. Create transaction
      const transaction = global.testUtils.createMockTransaction();
      
      // 3. Analyze transaction
      const analysisResult = await chainAnalysisPlugin.executeCommand('categorize-transaction', {
        transactionId: transaction.id,
        transaction: transaction
      });
      
      // 4. Create manual note
      const noteData = {
        content: 'Manual note for transaction',
        category: 'manual',
        contactId: contactResult.contact.id
      };
      const noteResult = await notesPlugin.executeCommand('add-note', {
        transactionId: transaction.id,
        noteData: noteData
      });
      
      // 5. Verify all integrations worked
      expect(contactResult.success).toBe(true);
      expect(analysisResult.success).toBe(true);
      expect(noteResult.success).toBe(true);
      
      // 6. Check final state
      const finalNotesResult = await notesPlugin.executeCommand('get-notes-by-transaction', {
        transactionId: transaction.id
      });
      expect(finalNotesResult.notes.length).toBeGreaterThan(1); // Should have both automatic and manual notes
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      await alertsPlugin.initializePlugin(mockContext);
      await evangelistPlugin.initializePlugin(mockContext);
      await notesPlugin.initializePlugin(mockContext);
      await alertsPlugin.startPlugin();
      await evangelistPlugin.startPlugin();
      await notesPlugin.startPlugin();
    });

    test('should handle multiple concurrent operations', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          alertsPlugin.executeCommand('create-alert', global.testUtils.createMockAlert()),
          evangelistPlugin.executeCommand('add-recommendation', {
            contactId: `contact_${i}`,
            amount: 0.01,
            price: 45000,
            template: 'First Purchase'
          }),
          notesPlugin.executeCommand('add-note', {
            transactionId: `tx_${i}`,
            noteData: { content: `Note ${i}`, category: 'test' }
          })
        );
      }

      // Execute all operations concurrently
      const results = await Promise.all(operations);
      
      // Verify all operations succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    test('should handle large data sets efficiently', async () => {
      const largeDataSet = [];
      
      // Create large dataset
      for (let i = 0; i < 100; i++) {
        largeDataSet.push(global.testUtils.createMockAlert());
      }

      // Process large dataset
      const results = await Promise.all(
        largeDataSet.map(alert => alertsPlugin.executeCommand('create-alert', alert))
      );
      
      // Verify all operations succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});


