import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { supportTools } from '../tools/support-tool';
import { scorers } from '../scorers/support-scorer';
import { openai } from '@ai-sdk/openai';

// Use OpenAI directly without fallback for now
export const supportTriageAgent = new Agent({
  name: 'Support Triage Agent',
  instructions: `
    You are a support triage assistant that analyzes incoming support messages for urgency.

    CRITICAL: You MUST respond with VALID JSON only, no other text.

    Analyze the user's message and return this exact JSON structure:
    {
      "needs_urgent_triage": boolean,
      "priority_level": "low" | "medium" | "high",
      "suggested_actions": string[],
      "reason": "Brief explanation based on keywords found",
      "keywords_found": string[]
    }

    PRIORITY RULES:
    - HIGH: "broken", "crash", "emergency", "urgent", "not working", "error", "failed", "down"
    - MEDIUM: "issue", "problem", "help", "question", "how to", "stuck", "trouble"  
    - LOW: "thanks", "thank you", "feature", "suggestion", "idea"

    ACTION RULES:
    - If urgent: ["add_red_circle_reaction", "post_urgent_thread_reply"]
    - If medium: ["add_yellow_circle_reaction", "post_standard_thread_reply"] 
    - If low: ["add_green_circle_reaction"]

    IMPORTANT: 
    - Return ONLY the JSON object, no markdown, no code blocks, no additional text
    - Make sure the JSON is valid and parseable
    - Include all keywords you find in the message
  `,
  model: openai('gpt-3.5-turbo'),
  tools: { supportTools },
  scorers: {
    urgencyAccuracy: {
      scorer: scorers.urgencyAccuracyScorer,
      sampling: {
        type: 'ratio',
        rate: 0.3,
      },
    },
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:./mastra.db',
    }),
  }),
});