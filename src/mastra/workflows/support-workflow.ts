// src/workflows/support-workflow.ts
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Define the type inferred from the Zod schema for better internal type safety
export const triageSchema = z.object({
  needs_urgent_triage: z.boolean(),
  priority_level: z.enum(['low', 'medium', 'high']),
  suggested_actions: z.array(z.string()),
  reason: z.string(),
  keywords_found: z.array(z.string()),
});

// Infer the TypeScript type from the schema
type TriageResult = z.infer<typeof triageSchema>;

// ---

// Step 1: Analyze message urgency using the agent
const analyzeUrgency = createStep({
  id: 'analyze-urgency',
  description: 'Analyze support message for urgency and priority using the triage agent',
  inputSchema: z.object({
    message: z.string().describe('The support message to analyze'),
  }),
  outputSchema: triageSchema, // Output must conform to this schema
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
        content: `Analyze this support message for urgency and priority: "${inputData.message}"`
      }
    ]);

    let triageResult: TriageResult;
    let agentText = response.text || '';

    try {
      // ✅ Keep the robust JSON extraction logic as a safeguard
      const jsonMatch = agentText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        agentText = jsonMatch[1].trim();
      } else {
        agentText = agentText.trim();
      }

      const parsed = JSON.parse(agentText);

      // Validate the parsed result
      triageResult = triageSchema.parse(parsed);

    } catch (error) {
      console.error('Failed to parse or validate agent response, falling back. Raw response:', response.text, 'Error:', error);

      // Fallback response if parsing fails.
      triageResult = {
        needs_urgent_triage: false,
        priority_level: "medium",
        suggested_actions: ["monitor_conversation", "check_agent_logs"],
        reason: "Failed to parse message - defaulting to medium priority",
        keywords_found: []
      } as TriageResult;
    }

    return triageResult;
  },
});

// ---

// Step 2: Format for Telex integration (FIXED)
const formatForTelex = createStep({
  id: 'format-for-telex',
  description: 'Format the triage result for Telex integration',
  inputSchema: triageSchema, // Input is the output of analyzeUrgency
  outputSchema: z.object({
    telex_response: z.string(),
    actions: z.array(z.string()),
    visual_indicator: z.string(),
    summary: z.string(),
    metadata: z.object({
      response_id: z.string(),
      timestamp: z.string(),
      processing_time_ms: z.number(),
    }),
  }),
  execute: async ({ inputData }) => { // REMOVED 'context' parameter
    const startTime = Date.now(); // Use current timestamp instead of context
    const triageData = inputData;

    const visual_indicator = triageData.needs_urgent_triage || triageData.priority_level === 'high'
      ? '🔴'
      : triageData.priority_level === 'medium' ? '🟡' : '🟢';

    const formattedResponse = JSON.stringify({
      needs_urgent_triage: triageData.needs_urgent_triage,
      priority_level: triageData.priority_level,
      suggested_actions: triageData.suggested_actions,
      reason: triageData.reason,
      keywords_found: triageData.keywords_found,
      visual_indicator: visual_indicator,
      timestamp: new Date().toISOString(),
      response_id: `tri_${Date.now()}`
    }, null, 2);

    const summary = `Priority: ${triageData.priority_level.toUpperCase()} | Urgent: ${triageData.needs_urgent_triage ? 'YES' : 'NO'} | Keywords: ${triageData.keywords_found.length}`;

    return {
      telex_response: formattedResponse,
      actions: triageData.suggested_actions,
      visual_indicator,
      summary,
      metadata: {
        response_id: `tri_${Date.now()}`,
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      },
    };
  },
});

// ---

// Main workflow (No changes)
export const supportWorkflow = createWorkflow({
  id: 'support-triage-workflow',
  inputSchema: z.object({
    message: z.string().describe('The support message from Telex.im'),
  }),
  outputSchema: z.object({
    telex_response: z.string(),
    actions: z.array(z.string()),
    visual_indicator: z.string(),
    summary: z.string(),
    metadata: z.object({
      response_id: z.string(),
      timestamp: z.string(),
      processing_time_ms: z.number(),
    }),
  }),
})
  .then(analyzeUrgency)
  .then(formatForTelex);

supportWorkflow.commit();