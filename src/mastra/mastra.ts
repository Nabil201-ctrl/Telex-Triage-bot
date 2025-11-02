import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { supportTriageAgent } from './agents/support-triage-agent';
import { supportWorkflow } from './workflows/support-workflow'; // This should work if export is correct
import { scorers as supportScorers } from './scorers/support-scorer';

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
        url: 'file:./.mastra/mastra.db',
    }),
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
    observability: {
        default: { enabled: true },
    },
});