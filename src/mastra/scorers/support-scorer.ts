import { z } from 'zod';
import { createToolCallAccuracyScorerCode } from '@mastra/evals/scorers/code';
import { createCompletenessScorer } from '@mastra/evals/scorers/code';
import { createScorer } from '@mastra/core/scores';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Scorer for appropriate tool usage
export const urgencyAccuracyScorer = createToolCallAccuracyScorerCode({
  expectedTool: 'keywordDetectionTool',
  strictMode: false,
});

// Scorer for response format compliance
export const responseFormatScorer = createScorer({
  name: 'Response Format Compliance',
  description: 'Evaluates if the agent response follows the required JSON format',
  type: 'agent',
  judge: {
    model: openrouter('anthropic/claude-3-haiku'),
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
  })
  .generateReason(({ results, score }) => {
    const analysis = (results as any)?.analyzeStepResult || {};
    return `Format compliance: validJson=${analysis.hasValidJson}, hasAllFields=${analysis.hasAllRequiredFields}, score=${score}`;
  });

// Scorer for urgency detection accuracy  
export const urgencyDetectionScorer = createScorer({
  name: 'Urgency Detection Accuracy',
  description: 'Evaluates if urgency detection matches human judgment',
  type: 'agent',
  judge: {
    model: openrouter('anthropic/claude-3-sonnet'),
    instructions: 'Evaluate if the agent correctly identified urgency in support messages.',
  },
})
  .preprocess(({ run }) => {
    const userText = (run.input?.inputMessages?.[0]?.content as string) || '';
    const assistantText = (run.output?.[0]?.content as string) || '';
    return { userText, assistantText };
  })
  .analyze({
    description: 'Compare agent urgency assessment with expected',
    outputSchema: z.object({
      actualUrgency: z.boolean(),
      expectedUrgency: z.boolean(),
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
      
      Consider these truly urgent indicators:
      - System failures, crashes, data loss
      - Security issues, privacy concerns  
      - Critical business operations blocked
      - Multiple users affected
      
      Return JSON with:
      {
        "actualUrgency": boolean (from agent response),
        "expectedUrgency": boolean (your judgment),
        "confidence": number (0-1),
        "explanation": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const analysis = (results as any)?.analyzeStepResult || {};
    if (analysis.actualUrgency === analysis.expectedUrgency) {
      return Math.max(0.8, analysis.confidence); // Base score + confidence
    }
    return 0.2; // Low score for mismatch
  });

export const scorers = {
  urgencyAccuracyScorer,
  responseFormatScorer,
  urgencyDetectionScorer,
};