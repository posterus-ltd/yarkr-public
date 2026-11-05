# elevenlabs

ElevenLabs' official hosted MCP server, focused on ElevenLabs conversational agents: create, configure, duplicate and delete agents (system prompt, voice, language, first message), read and search their conversation transcripts, manage their tools, knowledge base and MCP servers, create and run tests, work with branches and deployments, estimate LLM cost, and generate speech audio from text as a short-lived download link.

## Variables

None required: sign in with your ElevenLabs account (OAuth) in the browser on first use, choose the workspace and approve the requested permissions. No API key is stored in the client.

## Notes

- Data residency workspaces use their own URL: EU `https://api.eu.residency.elevenlabs.io/v1/mcp`, India `https://api.in.residency.elevenlabs.io/v1/mcp`, Singapore `https://api.sg.residency.elevenlabs.io/v1/mcp`. Sign in with that environment's account.
- Agent updates are published directly (to `main` by default), not staged as drafts, and deleting an agent is permanent: keep write tools behind approval prompts.
- The older local `uvx elevenlabs-mcp` server (API key, broader audio tools such as voice cloning and transcription) is deprecated and no longer maintained.

Docs: https://elevenlabs.io/docs/agents-platform/operate/hosted-mcp
