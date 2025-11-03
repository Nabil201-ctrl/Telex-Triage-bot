import dotenv from 'dotenv';
dotenv.config();

import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { supportTriageAgent } from './src/mastra/agents/support-triage-agent';
import { supportWorkflow } from './src/mastra/workflows/support-workflow';
import { scorers as supportScorers } from './src/mastra/scorers/support-scorer';
import { a2aAgentRoute } from './src/routes/a2a-agent-route';

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