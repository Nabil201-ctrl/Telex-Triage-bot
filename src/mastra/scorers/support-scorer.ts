// src/scorers/support-scorer.ts
import { z } from 'zod';
import { createScorer } from '@mastra/core/scores';
import { openai } from '@ai-sdk/openai';

export const urgencyAccuracyScorer = createScorer({
  name: 'Urgency Accuracy',
  description: 'Evaluates if agent correctly identifies urgency in support messages',
  type: 'agent',
  judge: {
    model: openai('gpt-3.5-turbo'),
    instructions: 'Evaluate if the agent correctly identified urgency and priority in the support message based on the content and context.',
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
      correctPriority: z.boolean(),
      confidence: z.number().min(0).max(1),
      explanation: z.string(),
      suggestedImprovements: z.array(z.string()),
    }),
    createPrompt: ({ results }) => `
      Evaluate if the agent correctly assessed urgency and priority for this support message.
      
      USER MESSAGE:
      """
      ${results.preprocessStepResult.userText}
      """
      
      AGENT RESPONSE:
      """
      ${results.preprocessStepResult.assistantText}
      """
      
      PRIORITY GUIDELINES:
      - HIGH: System failures, crashes, emergencies, critical errors
      - MEDIUM: Functional issues, problems, questions needing assistance
      - LOW: Feature requests, suggestions, general inquiries
      
      Evaluate based on:
      1. Whether urgency assessment matches message severity
      2. Whether priority level is appropriate
      3. Whether keywords were properly identified
      4. Whether suggested actions match the priority
      
      Return JSON with:
      {
        "correctUrgency": boolean (does urgency flag match content?),
        "correctPriority": boolean (is priority level appropriate?),
        "confidence": number 0-1 (confidence in evaluation),
        "explanation": string (detailed reasoning),
        "suggestedImprovements": string[] (suggestions for better assessment)
      }
    `,
  })
  .generateScore(({ results }) => {
    const analysis = (results as any)?.analyzeStepResult || {};
    const urgencyScore = analysis.correctUrgency ? 1 : 0;
    const priorityScore = analysis.correctPriority ? 1 : 0;
    return (urgencyScore + priorityScore) / 2;
  });

export const responseFormatScorer = createScorer({
  name: 'Response Format Compliance',
  description: 'Evaluates if the agent response follows the required JSON format',
  type: 'agent',
  judge: {
    model: openai('gpt-3.5-turbo'),
    instructions: 'Evaluate if the agent response follows the required JSON format with all necessary fields and valid structure.',
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
      hasExtraFields: z.boolean(),
      formatScore: z.number().min(0).max(1),
      validationErrors: z.array(z.string()),
    }),
    createPrompt: ({ results }) => `
      Evaluate if this agent response follows the required JSON format:
      
      RESPONSE:
      """
      ${results.preprocessStepResult.assistantText}
      """
      
      REQUIRED JSON FORMAT:
      {
        "needs_urgent_triage": boolean,
        "priority_level": "low" | "medium" | "high", 
        "suggested_actions": string[],
        "reason": string,
        "keywords_found": string[]
      }
      
      Check for:
      1. Valid JSON syntax
      2. All required fields present
      3. Correct data types
      4. No extra fields
      5. Valid enum values for priority_level
      
      Return JSON with:
      {
        "hasValidJson": boolean,
        "hasAllRequiredFields": boolean, 
        "missingFields": string[],
        "hasExtraFields": boolean,
        "formatScore": number (0-1, 1=perfect),
        "validationErrors": string[]
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