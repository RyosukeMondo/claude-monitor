import { prisma } from './client';
import { SessionManager, ComponentManager, StatisticsManager, RecoveryManager, ConfigManager } from './utils';

/**
 * Seed script for Claude Monitor database
 * 
 * Creates sample data for development and testing
 */
async function main() {
  console.log('Seeding database...');

  try {
    // Create a sample monitoring session
    const session = await SessionManager.createSession({
      configPath: '/path/to/config.yaml',
      debugMode: true
    });

    console.log('Created session:', session.id);

    // Register some components
    await ComponentManager.registerComponent(session.id, 'log_monitor', 'running');
    await ComponentManager.registerComponent(session.id, 'notifier', 'running');
    await ComponentManager.registerComponent(session.id, 'file_watcher', 'starting');

    console.log('Registered components');

    // Update some statistics
    await StatisticsManager.incrementCounter(session.id, 'totalDetections');
    await StatisticsManager.incrementCounter(session.id, 'totalRecoveries');
    await StatisticsManager.updateStatistics(session.id, {
      uptimeSeconds: 120.5,
      decisionMinIntervalSec: 5.0,
      consecIdleRequired: 3
    });

    console.log('Updated statistics');

    // Log some recovery actions
    await RecoveryManager.logRecoveryAction(session.id, {
      state: 'IDLE',
      actionType: 'clear_prompt',
      success: true
    });

    await RecoveryManager.logRecoveryAction(session.id, {
      state: 'ERROR',
      actionType: 'restart_claude',
      success: false,
      errorMessage: 'Failed to restart Claude process',
      throttledUntil: new Date(Date.now() + 30000) // 30 seconds from now
    });

    console.log('Logged recovery actions');

    // Save configuration
    const sampleConfig = {
      daemon: {
        loop_interval: 5.0,
        status_report_interval: 300.0
      },
      monitoring: {
        consecutive_idle_required: 3,
        inactivity_idle_sec: 5.0
      },
      logging: {
        level: 'info'
      }
    };

    await ConfigManager.saveConfiguration(sampleConfig, '/path/to/config.yaml', 'hash123');
    console.log('Saved configuration');

    console.log('✅ Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { main as seed };