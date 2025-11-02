# Support Triage Agent Server

This is an Agent-to-Agent (A2A) communication server that automatically triages support messages for urgency and priority. It uses a language model to analyze messages and provides a structured JSON output with the triage analysis.

## Features

- **Automatic Triage:** Analyzes incoming support messages to determine their priority level (high, medium, or low).
- **Urgency Detection:** Identifies urgent messages based on keywords.
- **Suggested Actions:** Provides suggested actions based on the triage analysis.
- **JSON-RPC API:** Implements a JSON-RPC 2.0 compliant API for A2A communication.
- **Agent Discovery:** Provides an agent discovery endpoint at `/.well-known/agent.json`.
- **Health Check:** Includes a `/health` endpoint to monitor the server's status.
- **Fallback Mechanism:** Uses a fallback mechanism for triage analysis if the primary language model is unavailable.

## API Endpoints

- `GET /.well-known/agent.json`: Agent discovery endpoint that returns the agent's capabilities and metadata.
- `POST /`: The main JSON-RPC endpoint for handling A2A messages. It supports the `message/send` and `tasks/get` methods.
- `GET /health`: Health check endpoint that returns the server's status.

## Running the server

To run the server, you need to have Node.js and npm installed.

1. **Install the dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the root of the project and add the following environment variables:
   ```
   SERVER_PORT=3000
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

The server will be running on `http://localhost:3000` by default.

## Project Structure

```
.
├── a2a-server.ts       # The main server file
├── package.json        # Project metadata and dependencies
├── package-lock.json   # Exact versions of dependencies
├── README.md           # This file
└── tsconfig.json       # TypeScript compiler options
```

## Dependencies

### Production Dependencies

- `cors`: For enabling Cross-Origin Resource Sharing.
- `dotenv`: For loading environment variables from a `.env` file.
- `express`: Web framework for Node.js.

### Development Dependencies

- `@types/cors`: Type definitions for `cors`.
- `@types/express`: Type definitions for `express`.
- `@types/node`: Type definitions for Node.js.
- `ts-node`: To run TypeScript files directly without pre-compiling.
- `typescript`: The TypeScript compiler.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the ISC License.