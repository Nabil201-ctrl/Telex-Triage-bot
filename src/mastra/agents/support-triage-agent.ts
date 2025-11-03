// src/agents/support-triage-agent.ts
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { supportTools } from '../tools/support-tool.js'; // 🔧 FIX: Corrected import from singular to plural
import { scorers } from '../scorers/support-scorer.js';
import { openai } from '@ai-sdk/openai';

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
    - HIGH: "broken", "crash", "emergency", "urgent", "not working", "error", "failed", "down", "critical"
    - MEDIUM: "issue", "problem", "help", "question", "how to", "stuck", "trouble", "not sure", "confused"  
    - LOW: "thanks", "thank you", "feature", "suggestion", "idea", "maybe", "when", "can you"

    ACTION RULES:
    - If urgent: ["add_red_circle_reaction", "post_urgent_thread_reply", "notify_engineering_team"]
    - If medium: ["add_yellow_circle_reaction", "post_standard_thread_reply"] 
    - If low: ["add_green_circle_reaction", "post_follow_up_later"]

    IMPORTANT: 
    - Return ONLY the JSON object, no markdown, no code blocks, no additional text
    - Make sure the JSON is valid and parseable
    - Include all keywords you find in the message
    - If unsure, default to medium priority
    - Consider message tone and context in addition to keywords
  `,
  // 🚀 FIX: Using gpt-3.5-turbo-0125 for explicit JSON format support
  model: openai('gpt-3.5-turbo-0125'),

  tools: supportTools,
  scorers: {
    urgencyAccuracy: {
      scorer: scorers.urgencyAccuracyScorer,
      sampling: {
        type: 'ratio',
        rate: 0.3,
      },
    },
    responseFormat: {
      scorer: scorers.responseFormatScorer,
      sampling: {
        type: 'ratio',
        rate: 0.2,
      },
    },
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:./mastra.db',
    }),
  }),
});