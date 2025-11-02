import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const keywordDetectionTool = createTool({
  id: 'detect-keywords',
  description: 'Detect priority keywords in support messages',
  inputSchema: z.object({
    message: z.string().describe('The support message to analyze'),
  }),
  outputSchema: z.object({
    highPriorityKeywords: z.array(z.string()),
    mediumPriorityKeywords: z.array(z.string()),
    lowPriorityKeywords: z.array(z.string()),
    allKeywords: z.array(z.string()),
    keywordCount: z.number(),
  }),
  execute: async ({ context }) => {
    const message = context.message.toLowerCase();

    const highPriority = ['broken', 'crash', 'emergency', 'urgent', 'not working', 'error', 'failed', 'down'];
    const mediumPriority = ['issue', 'problem', 'help', 'question', 'how to', 'stuck', 'trouble'];
    const lowPriority = ['thanks', 'thank you', 'feature', 'suggestion', 'idea', 'maybe'];

    const foundHigh = highPriority.filter(keyword => message.includes(keyword));
    const foundMedium = mediumPriority.filter(keyword => message.includes(keyword));
    const foundLow = lowPriority.filter(keyword => message.includes(keyword));
    const allFound = [...foundHigh, ...foundMedium, ...foundLow];

    return {
      highPriorityKeywords: foundHigh,
      mediumPriorityKeywords: foundMedium,
      lowPriorityKeywords: foundLow,
      allKeywords: allFound,
      keywordCount: allFound.length,
    };
  },
});

export const formatResponseTool = createTool({
  id: 'format-triage-response',
  description: 'Format the triage response for Telex.im',
  inputSchema: z.object({
    needsUrgentTriage: z.boolean(),
    priorityLevel: z.enum(['low', 'medium', 'high']),
    suggestedActions: z.array(z.string()),
    reason: z.string(),
    keywordsFound: z.array(z.string()),
  }),
  outputSchema: z.object({
    formattedResponse: z.string(),
    slackActions: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { needsUrgentTriage, priorityLevel, suggestedActions, reason, keywordsFound } = context;

    const emoji = needsUrgentTriage ? '🔴' : priorityLevel === 'medium' ? '🟡' : '🟢';

    const formattedResponse = JSON.stringify({
      needs_urgent_triage: needsUrgentTriage,
      priority_level: priorityLevel,
      suggested_actions: suggestedActions,
      reason: reason,
      keywords_found: keywordsFound,
      visual_indicator: emoji,
      timestamp: new Date().toISOString()
    }, null, 2);

    const slackActions = [];
    if (needsUrgentTriage) {
      slackActions.push('add_red_circle_reaction');
      slackActions.push('post_urgent_thread_reply');
    } else if (priorityLevel === 'medium') {
      slackActions.push('add_yellow_circle_reaction');
      slackActions.push('post_standard_thread_reply');
    }

    return {
      formattedResponse,
      slackActions,
    };
  },
});

export const supportTools = {
  keywordDetectionTool,
  formatResponseTool,
};