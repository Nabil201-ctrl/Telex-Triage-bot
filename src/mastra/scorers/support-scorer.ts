import { z } from 'zod';
import { createScorer } from '@mastra/core/scores';
import { openai } from '@ai-sdk/openai';

// Simple scorer for tool usage
export const urgencyAccuracyScorer = createScorer({
  name: 'Urgency Accuracy',
  description: 'Evaluates if agent correctly uses tools for urgency detection',
  type: 'agent',
  judge: {
    model: openai('gpt-3.5-turbo'),
    instructions: 'Evaluate if the agent correctly identified urgency in the support message.',
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || '';
    const assistantText = (run.output?.[0]?.content as string) || '';
    return { userText, assistantText };
  })
  .analyze({
    description: 'Check urgency detection accuracy',
    outputSchema: z.object({
      correctUrgency: z.boolean(),
      confidence: z.number().min(0).max(1),
      explanation: z.string(),
    }),
    createPrompt: ({ results }) => `
      Evaluate if the agent correctly assessed urgency for this support message.
      
      User Message:
      """
      ${results.preprocessStepResult.userText}
      """
      
      Agent Response:
      """
      ${results.preprocessStepResult.assistantText}
      """
      
      Return JSON with:
      {
        "correctUrgency": boolean,
        "confidence": number (0-1),
        "explanation": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const analysis = (results as any)?.analyzeStepResult || {};
    return analysis.confidence || 0.5;
  });

// Scorer for response format compliance
export const responseFormatScorer = createScorer({
  name: 'Response Format Compliance',
  description: 'Evaluates if the agent response follows the required JSON format',
  type: 'agent',
  judge: {
    model: openai('gpt-3.5-turbo'),
    instructions: 'Evaluate if the agent response follows the required JSON format with all necessary fields.',
  },
})
  .preprocess(({ run }) => {
    const assistantText = (run.output?.[0]?.content as string) || '';
    return { assistantText };
  })
  .analyze({
    description: 'Check JSON format and required fields',
    outputSchema: z.object({
      hasValidJson: z.boolean(),
      hasAllRequiredFields: z.boolean(),
      missingFields: z.array(z.string()),
      formatScore: z.number().min(0).max(1),
    }),
    createPrompt: ({ results }) => `
      Evaluate if this agent response follows the required JSON format:
      
      Response:
      """
      ${results.preprocessStepResult.assistantText}
      """
      
      Required JSON format:
      {
        "needs_urgent_triage": boolean,
        "priority_level": "low" | "medium" | "high", 
        "suggested_actions": string[],
        "reason": string,
        "keywords_found": string[]
      }
      
      Return JSON with:
      {
        "hasValidJson": boolean,
        "hasAllRequiredFields": boolean, 
        "missingFields": string[],
        "formatScore": number (0-1, 1=perfect)
      }
    `,
  })
  .generateScore(({ results }) => {
    const analysis = (results as any)?.analyzeStepResult || {};
    return analysis.formatScore || 0;
  });

export const scorers = {
  urgencyAccuracyScorer,
  responseFormatScorer,
};