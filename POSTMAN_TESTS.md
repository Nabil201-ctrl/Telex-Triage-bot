# Postman Tests

This file contains a collection of tests that can be run with Postman.

## Test 1: Health Check

*   **Method:** GET
*   **URL:** `http://localhost:4000/health`
*   **Expected Response:**
    ```json
    {
        "status": "ok",
        "service": "support-triage-bot",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "message": "A2A Server is running!"
    }
    ```


## Test 2: A2A Endpoint - Urgent Message

*   **Method:** POST
*   **URL:** `http://localhost:4000/a2a/agent/supportTriageAgent`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Body:**
    ```json
    {
        "messages": [
            {
                "role": "user",
                "content": "The login system is completely broken and users are getting error messages when trying to access their accounts. This is urgent!"
            }
        ]
    }
    ```
*   **Expected Response:**
    ```json
    {
        "type": "agent_response",
        "content": "{\"needs_urgent_triage\":true,\"priority_level\":\"high\",\"suggested_actions\":[\"add_red_circle_reaction\",\"post_urgent_thread_reply\"],\"reason\":\"Contains urgent keywords: broken, error, urgent\",\"keywords_found\":[\"broken\",\"error\",\"urgent\"]}",
        "metadata": {
            "agent": "supportTriageAgent",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "triage_decision": {
                "needs_urgent_triage": true,
                "priority_level": "high",
                "suggested_actions": ["add_red_circle_reaction", "post_urgent_thread_reply"],
                "reason": "Contains urgent keywords: broken, error, urgent",
                "keywords_found": ["broken", "error", "urgent"]
            }
        }
    }
    ```

## Test 3: A2A Endpoint - Normal Message

*   **Method:** POST
*   **URL:** `http://localhost:4000/a2a/agent/supportTriageAgent`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Body:**
    ```json
    {
        "messages": [
            {
                "role": "user",
                "content": "How do I change my profile picture?"
            }
        ]
    }
    ```
*   **Expected Response:**
    ```json
    {
        "type": "agent_response",
        "content": "{\"needs_urgent_triage\":false,\"priority_level\":\"low\",\"suggested_actions\":[\"add_green_circle_reaction\"],\"reason\":\"No urgent keywords detected\",\"keywords_found\":[]}",
        "metadata": {
            "agent": "supportTriageAgent",
            "timestamp": "2024-01-15T10:30:00.000Z",
            "triage_decision": {
                "needs_urgent_triage": false,
                "priority_level": "low",
                "suggested_actions": ["add_green_circle_reaction"],
                "reason": "No urgent keywords detected",
                "keywords_found": []
            }
        }
    }
    ```

## Test 4: A2A Endpoint - Medium Priority

*   **Method:** POST
*   **URL:** `http://localhost:4000/a2a/agent/supportTriageAgent`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Body:**
    ```json
    {
        "messages": [
            {
                "role": "user", 
                "content": "I'm having an issue with file uploads, can you help?"
            }
        ]
    }
    ```

## Test 5: A2A Endpoint - Low Priority

*   **Method:** POST
*   **URL:** `http://localhost:4000/a2a/agent/supportTriageAgent`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Body:**
    ```json
    {
        "messages": [
            {
                "role": "user",
                "content": "Thanks for the great service! I have a feature suggestion"
            }
        ]
    }
    ```