import dotenv from 'dotenv';
dotenv.config(); // ✅ must come first

import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { supportTriageAgent } from './agents/support-triage-agent';
import { supportWorkflow } from './workflows/support-workflow';
import { scorers as supportScorers } from './scorers/support-scorer';


export const mastra = new Mastra({
  workflows: {
    supportWorkflow,
  },
  agents: {
    supportTriageAgent,
  },
  scorers: {
    ...supportScorers,
  },
  storage: new LibSQLStore({
    url:
      process.env.NODE_ENV === 'production'
        ? process.env.LIBSQL_URL!
        : 'file:./mastra.db', // fallback for dev
    authToken:
      process.env.NODE_ENV === 'production'
        ? process.env.LIBSQL_AUTH_TOKEN!  // ✅ added this line
        : undefined,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
  telemetry: {
    enabled: false,
  },
  observability: {
    default: { enabled: true },
  },
});
