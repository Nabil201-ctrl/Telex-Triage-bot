import express from 'express';
import cors from 'cors';
import { mastra } from '../src/mastra';

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// A2A Endpoint for Support Triage Agent
app.post('/a2a/agent/supportTriageAgent', async (req, res) => {
    try {
        console.log(' Received A2A request');

        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: 'Invalid message format',
                details: 'Messages array is required and cannot be empty'
            });
        }

        // Get the latest user message
        const latestMessage = messages[messages.length - 1];
        const userMessage = latestMessage.content;

        if (!userMessage || typeof userMessage !== 'string') {
            return res.status(400).json({
                error: 'Invalid message content',
                details: 'Message content must be a non-empty string'
            });
        }

        console.log('Processing message:', userMessage);

        // Get the support triage agent
        const agent = mastra.getAgent('supportTriageAgent');
        if (!agent) {
            throw new Error('Support Triage Agent not configured');
        }

        // Process the message
        const response = await agent.generate([
            {
                role: 'user',
                content: `Analyze this support message for urgency: "${userMessage}"`
            }
        ]);

        console.log('Raw agent response:', response.text);

        // Parse JSON response
        let triageResult;
        try {
            triageResult = JSON.parse(response.text);
            console.log('Successfully parsed JSON');
        } catch (parseError) {
            console.error('Failed to parse agent response as JSON:', response.text);
            console.log('Response type:', typeof response.text);

            // Try to extract JSON if it's wrapped in other text
            try {
                const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    triageResult = JSON.parse(jsonMatch[0]);
                    console.log('Extracted JSON from text');
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (secondError) {
                // Fallback to keyword analysis
                console.log('🔄 Using fallback keyword analysis');
                triageResult = fallbackTriageAnalysis(userMessage);
            }
        }

        // Format for Telex.im A2A protocol
        const telexResponse = {
            type: 'agent_response',
            content: JSON.stringify(triageResult),
            metadata: {
                agent: 'supportTriageAgent',
                timestamp: new Date().toISOString(),
                triage_decision: triageResult
            }
        };

        console.log('Sending response to Telex:', triageResult);
        res.json(telexResponse);

    } catch (error) {
        console.error('Error in supportTriageAgent:', error);

        const errorResponse = {
            type: 'agent_response',
            content: JSON.stringify({
                needs_urgent_triage: false,
                priority_level: "low",
                suggested_actions: ["System temporarily unavailable"],
                reason: "An error occurred while processing your request",
                keywords_found: []
            }),
            metadata: {
                agent: 'supportTriageAgent',
                timestamp: new Date().toISOString(),
                error: true
            }
        };

        res.json(errorResponse);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'support-triage-bot',
        timestamp: new Date().toISOString(),
        message: 'A2A Server is running!'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Support Triage Bot A2A Server',
        endpoints: {
            health: '/health',
            a2a: '/a2a/agent/supportTriageAgent'
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Mastra A2A Server running on port ${port}`);
    console.log(`A2A Endpoint: http://localhost:${port}/a2a/agent/supportTriageAgent`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Root: http://localhost:${port}/`);
});

export default app;