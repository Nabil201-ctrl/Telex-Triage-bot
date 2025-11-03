// src/mastra.config.ts
import dotenv from 'dotenv';
dotenv.config();

import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { supportTriageAgent } from './agents/support-triage-agent.js';
import { supportWorkflow } from './workflows/support-workflow.js';
import { scorers as supportScorers } from './scorers/support-scorer.js';
import { a2aAgentRoute } from '../routes/a2a-agent-route.js';

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
        url: process.env.NODE_ENV === 'production'
            ? process.env.LIBSQL_URL!
            : 'file:./mastra.db',
        authToken: process.env.NODE_ENV === 'production'
            ? process.env.LIBSQL_AUTH_TOKEN!
            : undefined,
    }),
    logger: new PinoLogger({
        name: 'Mastra',
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    observability: {
        default: { enabled: true },
    },
    server: {
        build: {
            openAPIDocs: true,
            swaggerUI: true,
        },
        apiRoutes: [a2aAgentRoute]
    },
    telemetry: {
        enabled: false,
    },
});

export default mastra;