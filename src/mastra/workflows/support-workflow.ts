import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const triageSchema = z.object({
  needs_urgent_triage: z.boolean(),
  priority_level: z.enum(['low', 'medium', 'high']),
  suggested_actions: z.array(z.string()),
  reason: z.string(),
  keywords_found: z.array(z.string()),
});

// Step 1: Analyze message for urgency
const analyzeUrgency = createStep({
  id: 'analyze-urgency',
  description: 'Analyze support message for urgency and priority',
  inputSchema: z.object({
    message: z.string().describe('The support message to analyze'),
  }),
  outputSchema: triageSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('supportTriageAgent');
    if (!agent) {
      throw new Error('Support Triage Agent not found');
    }

    const response = await agent.generate([
      {
        role: 'user',
        content: `Analyze this support message: "${inputData.message}"`
      }
    ]);

    // Parse JSON response from agent
    let triageResult;
    try {
      triageResult = JSON.parse(response.text);
    } catch (error) {
      // Fallback response if parsing fails
      triageResult = {
        needs_urgent_triage: false,
        priority_level: "low",
        suggested_actions: ["Monitor conversation"],
        reason: "Failed to parse message",
        keywords_found: []
      };
    }

    return triageResult;
  },
});

// Step 2: Format for Telex.im
const formatForTelex = createStep({
  id: 'format-for-telex',
  description: 'Format the triage result for Telex.im',
  inputSchema: triageSchema,
  outputSchema: z.object({
    telex_response: z.string(),
    actions: z.array(z.string()),
    visual_indicator: z.string(),
  }),
  execute: async ({ inputData }) => {
    const triageData = inputData;

    // Format the response directly
    const formattedResponse = JSON.stringify({
      needs_urgent_triage: triageData.needs_urgent_triage,
      priority_level: triageData.priority_level,
      suggested_actions: triageData.suggested_actions,
      reason: triageData.reason,
      keywords_found: triageData.keywords_found,
      timestamp: new Date().toISOString()
    }, null, 2);

    // Determine actions based on priority
    const actions = [];
    if (triageData.needs_urgent_triage) {
      actions.push('add_red_circle_reaction');
      actions.push('post_urgent_thread_reply');
    } else if (triageData.priority_level === 'medium') {
      actions.push('add_yellow_circle_reaction');
      actions.push('post_standard_thread_reply');
    } else {
      actions.push('add_green_circle_reaction');
    }

    const visualIndicator = triageData.needs_urgent_triage ? '🔴' :
      triageData.priority_level === 'medium' ? '🟡' : '🟢';

    return {
      telex_response: formattedResponse,
      actions: actions,
      visual_indicator: visualIndicator,
    };
  },
});

// Main workflow
const supportWorkflow = createWorkflow({
  id: 'support-triage-workflow',
  inputSchema: z.object({
    message: z.string().describe('The support message from Telex.im'),
  }),
  outputSchema: z.object({
    telex_response: z.string(),
    actions: z.array(z.string()),
    visual_indicator: z.string(),
  }),
})
  .then(analyzeUrgency)
  .then(formatForTelex);

supportWorkflow.commit();

// Make sure this export is present
export { supportWorkflow };