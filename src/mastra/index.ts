import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { supportTriageAgent } from './agents/support-triage-agent';
import { supportWorkflow } from './workflows/support-workflow';
import { scorers as supportScorers } from './scorers/support-scorer';
import('../../server/a2a-server').catch(console.error);
import dotenv from 'dotenv';
dotenv.config();

// Fix for telemetry warning
export const mastra = new Mastra({
  workflows: {
    supportWorkflow
  },
  agents: {
    supportTriageAgent
  },
  scorers: {
    ...supportScorers
  },
  storage: new LibSQLStore({
    // Use absolute path or ensure directory exists
    url: process.env.NODE_ENV === 'production'
      ? process.env.LIBSQL_URL!
      : 'file:./mastra.db', // Simplified path
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
  telemetry: {
    enabled: false, // Explicitly disable telemetry
  },
  observability: {
    default: { enabled: true },
  },
});