import express from 'express';
import cors from 'cors';
import { mastra } from '../src/mastra';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.SERVER_PORT) || 3000;

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


// 1. Agent Discovery Endpoint (REQUIRED)
app.get('/.well-known/agent.json', (req, res) => {
    const agentCard = {
        name: "Support Triage Agent",
        description: "Automatically triages support messages for urgency and priority",
        url: `https://${req.get('host')}`,
        version: "1.0.0",
        provider: {
            organization: "Your Organization",
            url: "https://your-organization.com"
        },
        capabilities: {
            streaming: false,
            pushNotifications: false,
            stateTransitionHistory: false
        },
        defaultInputModes: ["text/plain"],
        defaultOutputModes: ["application/json"],
        skills: [
            {
                id: "support_triage",
                name: "Support Triage",
                description: "Analyzes support messages for urgency and priority levels",
                inputModes: ["text/plain"],
                outputModes: ["application/json"],
                examples: [
                    {
                        input: {
                            parts: [{
                                text: "Our system is broken and customers can't login",
                                contentType: "text/plain"
                            }]
                        },
                        output: {
                            parts: [{
                                text: JSON.stringify({
                                    needs_urgent_triage: true,
                                    priority_level: "high",
                                    suggested_actions: ["add_red_circle_reaction", "post_urgent_thread_reply"],
                                    reason: "Found urgent keywords",
                                    keywords_found: ["broken"]
                                }),
                                contentType: "application/json"
                            }]
                        }
                    }
                ]
            }
        ]
    };

    res.json(agentCard);
});

// 2. Main JSON-RPC Endpoint (REQUIRED)
app.post('/', async (req, res) => {
    try {
        const { jsonrpc, method, id, params } = req.body;

        console.log('📨 Received A2A request:', { method, id });

        // Validate JSON-RPC 2.0
        if (jsonrpc !== '2.0') {
            return res.json({
                jsonrpc: '2.0',
                id,
                error: { code: -32600, message: 'Invalid Request' }
            });
        }

        // Route methods
        let result;
        switch (method) {
            case 'message/send':
                result = await handleMessageSend(params);
                break;
            case 'tasks/get':
                result = await handleTasksGet(params);
                break;
            default:
                return res.json({
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: 'Method not found' }
                });
        }

        console.log('✅ Sending A2A response');
        res.json({
            jsonrpc: '2.0',
            id,
            result
        });

    } catch (error) {
        console.error('❌ A2A error:', error);
        res.json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: { code: -32603, message: 'Internal error' }
        });
    }
});

// Message handler
async function handleMessageSend(params: any) {
    const { message } = params;

    // Extract text content
    const textPart = message.parts?.find((part: any) => part.kind === 'text');
    const userMessage = textPart?.text || '';

    console.log('Processing message:', userMessage);

    // Your triage logic
    let triageResult;
    try {
        const agent = mastra.getAgent('supportTriageAgent');
        if (agent) {
            const response = await agent.generate([
                { role: 'user', content: `Analyze: "${userMessage}"` }
            ]);
            triageResult = JSON.parse(response.text);
        } else {
            throw new Error('Agent not available');
        }
    } catch (error) {
        triageResult = fallbackTriageAnalysis(userMessage);
    }

    // A2A Message response
    return {
        role: "agent",
        parts: [
            {
                kind: "text",
                text: JSON.stringify(triageResult)
            }
        ],
        kind: "message",
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskId: message.taskId,
        contextId: message.contextId
    };
}

// Tasks handler (minimal implementation)
async function handleTasksGet(params: any) {
    return {
        id: params.taskId,
        status: {
            state: "completed"
        },
        kind: "task"
    };
}

// Keep your existing health checks
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 A2A Server running on port ${port}`);
    console.log(`🔍 Discovery: http://localhost:${port}/.well-known/agent.json`);
    console.log(`📨 Endpoint: http://localhost:${port}/`);
});
