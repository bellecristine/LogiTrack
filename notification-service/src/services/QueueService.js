const { Queue, Worker, QueueEvents } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();
    this.connection = null;
  }

  async initialize() {
    try {
      this.connection = getRedisConnection();
      
      // Criar filas principais
      await this.createQueue('email-notifications', {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      await this.createQueue('push-notifications', {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      await this.createQueue('campaign-processing', {
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
        },
      });

      await this.createQueue('analytics-tracking', {
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      await this.createQueue('user-segmentation', {
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 10,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        },
      });

      logger.queue('Queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  async createQueue(name, options = {}) {
    try {
      const defaultOptions = {
        connection: this.connection,
        ...options
      };

      const queue = new Queue(name, defaultOptions);
      this.queues.set(name, queue);

      // Criar QueueEvents para monitoramento
      const queueEvents = new QueueEvents(name, { connection: this.connection });
      this.queueEvents.set(name, queueEvents);

      // Event listeners para monitoramento
      queueEvents.on('completed', ({ jobId, returnvalue }) => {
        logger.queue(`Job completed in queue ${name}`, { jobId, returnvalue });
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error(`Job failed in queue ${name}`, { jobId, failedReason });
      });

      queueEvents.on('progress', ({ jobId, data }) => {
        logger.queue(`Job progress in queue ${name}`, { jobId, progress: data });
      });

      logger.queue(`Queue created: ${name}`);
      return queue;
    } catch (error) {
      logger.error(`Failed to create queue ${name}:`, error);
      throw error;
    }
  }

  async createWorker(queueName, processor, options = {}) {
    try {
      const defaultOptions = {
        connection: this.connection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
        ...options
      };

      const worker = new Worker(queueName, processor, defaultOptions);
      this.workers.set(queueName, worker);

      // Event listeners para monitoramento
      worker.on('completed', (job, result) => {
        logger.queue(`Worker completed job in ${queueName}`, {
          jobId: job.id,
          jobName: job.name,
          result
        });
      });

      worker.on('failed', (job, err) => {
        logger.error(`Worker failed job in ${queueName}`, {
          jobId: job?.id,
          jobName: job?.name,
          error: err.message
        });
      });

      worker.on('progress', (job, progress) => {
        logger.queue(`Worker progress in ${queueName}`, {
          jobId: job.id,
          jobName: job.name,
          progress
        });
      });

      worker.on('error', (err) => {
        logger.error(`Worker error in ${queueName}:`, err);
      });

      logger.queue(`Worker created for queue: ${queueName}`);
      return worker;
    } catch (error) {
      logger.error(`Failed to create worker for ${queueName}:`, error);
      throw error;
    }
  }

  getQueue(name) {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }
    return queue;
  }

  getWorker(name) {
    const worker = this.workers.get(name);
    if (!worker) {
      throw new Error(`Worker ${name} not found`);
    }
    return worker;
  }

  // Métodos para adicionar jobs
  async addEmailJob(data, options = {}) {
    const queue = this.getQueue('email-notifications');
    const jobOptions = {
      priority: this.getPriority(data.priority),
      delay: data.delay || 0,
      ...options
    };

    return await queue.add('send-email', data, jobOptions);
  }

  async addPushJob(data, options = {}) {
    const queue = this.getQueue('push-notifications');
    const jobOptions = {
      priority: this.getPriority(data.priority),
      delay: data.delay || 0,
      ...options
    };

    return await queue.add('send-push', data, jobOptions);
  }

  async addCampaignJob(data, options = {}) {
    const queue = this.getQueue('campaign-processing');
    const jobOptions = {
      priority: this.getPriority(data.priority),
      delay: data.delay || 0,
      ...options
    };

    return await queue.add('process-campaign', data, jobOptions);
  }

  async addAnalyticsJob(data, options = {}) {
    const queue = this.getQueue('analytics-tracking');
    return await queue.add('track-event', data, options);
  }

  async addSegmentationJob(data, options = {}) {
    const queue = this.getQueue('user-segmentation');
    const jobOptions = {
      delay: data.delay || 0,
      ...options
    };

    return await queue.add('segment-users', data, jobOptions);
  }

  // Métodos para jobs em lote
  async addBulkEmailJobs(jobs) {
    const queue = this.getQueue('email-notifications');
    const formattedJobs = jobs.map(job => ({
      name: 'send-email',
      data: job.data,
      opts: {
        priority: this.getPriority(job.data.priority),
        delay: job.data.delay || 0,
        ...job.options
      }
    }));

    return await queue.addBulk(formattedJobs);
  }

  async addBulkPushJobs(jobs) {
    const queue = this.getQueue('push-notifications');
    const formattedJobs = jobs.map(job => ({
      name: 'send-push',
      data: job.data,
      opts: {
        priority: this.getPriority(job.data.priority),
        delay: job.data.delay || 0,
        ...job.options
      }
    }));

    return await queue.addBulk(formattedJobs);
  }

  // Métodos de gerenciamento
  async pauseQueue(name) {
    const queue = this.getQueue(name);
    await queue.pause();
    logger.queue(`Queue paused: ${name}`);
  }

  async resumeQueue(name) {
    const queue = this.getQueue(name);
    await queue.resume();
    logger.queue(`Queue resumed: ${name}`);
  }

  async pauseWorker(name) {
    const worker = this.getWorker(name);
    await worker.pause();
    logger.queue(`Worker paused: ${name}`);
  }

  async resumeWorker(name) {
    const worker = this.getWorker(name);
    await worker.resume();
    logger.queue(`Worker resumed: ${name}`);
  }

  async getQueueStats(name) {
    const queue = this.getQueue(name);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      name,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  async getAllQueueStats() {
    const stats = {};
    for (const [name] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }
    return stats;
  }

  async cleanQueue(name, grace = 5000) {
    const queue = this.getQueue(name);
    
    // Limpar jobs completados há mais de 'grace' ms
    await queue.clean(grace, 100, 'completed');
    
    // Limpar jobs falhos há mais de 'grace' ms
    await queue.clean(grace, 50, 'failed');
    
    logger.queue(`Queue cleaned: ${name}`);
  }

  async cleanAllQueues(grace = 5000) {
    for (const [name] of this.queues) {
      await this.cleanQueue(name, grace);
    }
    logger.queue('All queues cleaned');
  }

  // Método para obter prioridade numérica
  getPriority(priority) {
    const priorities = {
      'urgent': 1,
      'high': 2,
      'normal': 3,
      'low': 4
    };
    return priorities[priority] || priorities.normal;
  }

  // Método para agendar jobs recorrentes
  async addRepeatableJob(queueName, jobName, data, repeatOptions) {
    const queue = this.getQueue(queueName);
    return await queue.add(jobName, data, {
      repeat: repeatOptions
    });
  }

  // Método para remover jobs recorrentes
  async removeRepeatableJob(queueName, jobName, repeatOptions) {
    const queue = this.getQueue(queueName);
    return await queue.removeRepeatable(jobName, repeatOptions);
  }

  async shutdown() {
    try {
      logger.queue('Shutting down queue service...');
      
      // Fechar todos os workers
      for (const [name, worker] of this.workers) {
        await worker.close();
        logger.queue(`Worker closed: ${name}`);
      }

      // Fechar todos os queue events
      for (const [name, queueEvents] of this.queueEvents) {
        await queueEvents.close();
        logger.queue(`Queue events closed: ${name}`);
      }

      // Fechar todas as filas
      for (const [name, queue] of this.queues) {
        await queue.close();
        logger.queue(`Queue closed: ${name}`);
      }

      logger.queue('Queue service shutdown completed');
    } catch (error) {
      logger.error('Error during queue service shutdown:', error);
      throw error;
    }
  }
}

// Singleton instance
const queueService = new QueueService();

module.exports = queueService; 