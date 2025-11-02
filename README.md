# Support Triage Bot (Triborg)

This project is a "Support Triage Bot" built with TypeScript, Node.js, and the Mastra framework. Its primary purpose is to automatically analyze incoming support messages, determine their urgency, and take appropriate actions based on the priority level. The bot is designed to be integrated with the platform called Telex.im.

## Features

*   **Automatic Triage**: Automatically analyzes support messages for urgency.
*   **Priority Levels**: Assigns a priority level (high, medium, or low) to each message.
*   **Automated Actions**: Performs automated actions based on the priority level, such as adding reactions, posting replies, and notifying the support team.
*   **AI-Powered**: Uses an AI model to analyze messages, with a fallback to keyword matching.
*   **Extensible**: Built with the Mastra framework, which allows for easy customization and extension.
*   **Integrated with Telex.im**: Designed to be integrated with the Telex.im platform.

## Technologies Used

*   **TypeScript**: The primary programming language.
*   **Node.js**: The runtime environment.
*   **Express**: The web framework for the A2A server.
*   **Mastra**: The framework for building AI agents and workflows.
*   **OpenAI**: The AI model for message analysis.
*   **Telex.im**: The platform that the bot is designed to be integrated with.

## Project Structure

```
C:\Users\PC\Desktop\working-curve\HNG13\telebot\telex\
├───.env.example
├───.gitignore
├───package-lock.json
├───package.json
├───telex-workflow.json
├───.git\...
├───.mastra\...
├───.vscode\
│   └───mcp.json
├───node_modules\...
├───server\
│   └───a2a-server.ts
└───src\
    └───mastra\
        ├───index.ts
        ├───mastra.ts
        ├───agents\
        │   └───support-triage-agent.ts
        ├───scorers\
        │   └───support-scorer.ts
        ├───tools\
        │   └───support-tool.ts
        └───workflows\
            └───support-workflow.ts
```

*   **`.env.example`**: An example environment file.
*   **`.gitignore`**: A file that specifies which files and directories to ignore in a Git repository.
*   **`GEMINI.md`**: A file that provides a high-level overview of the workflow, customization options, and testing procedures for the bot.
*   **`package.json`**: Defines the project's dependencies, scripts, and metadata.
*   **`telex-workflow.json`**: Defines the workflow for the Telex.im platform.
*   **`server/a2a-server.ts`**: Sets up an Express server to handle A2A communication with the Telex.im platform.
*   **`src/mastra/index.ts`**: The main entry point for the Mastra application.
*   **`src/mastra/mastra.ts`**: A more basic Mastra configuration file.
*   **`src/mastra/agents/support-triage-agent.ts`**: Defines the core logic of the support triage agent.
*   **`src/mastra/scorers/support-scorer.ts`**: Defines the scorers for evaluating the agent's performance.
*   **`src/mastra/tools/support-tool.ts`**: Defines the tools that the agent can use.
*   **`src/mastra/workflows/support-workflow.ts`**: Defines the workflow for the support triage process.

## Workflow

The support triage workflow is defined in the `telex-workflow.json` file. It consists of the following steps:

1.  **Trigger**: The workflow is triggered when a new message is posted in the support channel.
2.  **Triage**: The message is sent to the `supportTriageAgent` for analysis.
3.  **Actions**: Based on the priority level assigned by the agent, the following actions are taken:
    *   **High Priority**: A red circle reaction is added to the message, an urgent thread reply is posted, and the support team is notified in the `#support` channel.
    *   **Medium Priority**: A yellow circle reaction is added to the message, and a standard thread reply is posted.
    *   **Low Priority**: A green circle reaction is added to the message.

## Getting Started

To get started with the project, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/your-repository.git
    ```
2.  **Install the dependencies**:
    ```bash
    npm install
    ```
3.  **Create a `.env` file**:
    ```bash
    cp .env.example .env
    ```
4.  **Update the `.env` file**:
    *   `OPENROUTER_API_KEY`: Your OpenRouter API key.
    *   `DATABASE_URL`: The URL of your database.
5.  **Start the development server**:
    ```bash
    npm run dev
    ```

## Testing

To test the bot, you can use Postman to send requests to the A2A endpoint. The `GEMINI.md` file provides example JSON payloads for different priority levels.

## Customization

The bot can be customized by modifying the following files:

*   **`telex-workflow.json`**: To change the workflow, such as the trigger, actions, and conditions.
*   **`src/mastra/agents/support-triage-agent.ts`**: To change the agent's instructions, priority rules, and action rules.
*   **`src/mastra/tools/support-tool.ts`**: To change the tools that the agent can use.
*   **`src/mastra/workflows/support-workflow.ts`**: To change the workflow steps.
