import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { supportTools } from '../tools/support-tool';
import { scorers } from '../scorers/support-scorer';
import { openai } from '@ai-sdk/openai';

// Fallback keyword-based triage function
function fallbackTriageAnalysis(message: string) {
  const lowerMessage = message.toLowerCase();

  const highPriorityKeywords = ['broken', 'crash', 'emergency', 'urgent', 'not working', 'error', 'failed', 'down'];
  const mediumPriorityKeywords = ['issue', 'problem', 'help', 'question', 'how to', 'stuck', 'trouble'];
  const lowPriorityKeywords = ['thanks', 'thank you', 'feature', 'suggestion', 'idea'];

  const foundHigh = highPriorityKeywords.filter(keyword => lowerMessage.includes(keyword));
  const foundMedium = mediumPriorityKeywords.filter(keyword => lowerMessage.includes(keyword));
  const foundLow = lowPriorityKeywords.filter(keyword => lowerMessage.includes(keyword));

  let needsUrgentTriage = foundHigh.length > 0;
  let priorityLevel: 'low' | 'medium' | 'high' = 'low';

  if (foundHigh.length > 0) {
    priorityLevel = 'high';
  } else if (foundMedium.length > 0) {
    priorityLevel = 'medium';
  }

  const suggestedActions = [];
  if (needsUrgentTriage) {
    suggestedActions.push('add_red_circle_reaction', 'post_urgent_thread_reply');
  } else if (priorityLevel === 'medium') {
    suggestedActions.push('add_yellow_circle_reaction', 'post_standard_thread_reply');
  } else {
    suggestedActions.push('add_green_circle_reaction');
  }

  return {
    needs_urgent_triage: needsUrgentTriage,
    priority_level: priorityLevel,
    suggested_actions: suggestedActions,
    reason: `Found keywords: high=[${foundHigh.join(', ')}], medium=[${foundMedium.join(', ')}], low=[${foundLow.join(', ')}]`,
    keywords_found: [...foundHigh, ...foundMedium, ...foundLow]
  };
}

// Try to create OpenAI, but have fallback
let aiModel;
try {
  aiModel = openai('gpt-3.5-turbo');
} catch (error) {
  console.warn('OpenAI not available, using fallback logic');
  aiModel = {
    doGenerate: async (messages: any[]) => {
      const userMessage = messages[messages.length - 1]?.content || '';
      const analysis = fallbackTriageAnalysis(userMessage);

      return {
        text: JSON.stringify(analysis),
        usage: { promptTokens: 0, completionTokens: 0 },
        finishReason: 'stop' as const
      };
    }
  };
}

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
  model: aiModel,
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