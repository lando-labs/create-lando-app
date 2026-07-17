# {{PROJECT_NAME}}

The instructions for this project live in `AGENTS.md` — one brief, shared by every
AI tool, so they can't drift apart. It is imported below.

@AGENTS.md

## Claude Code specifics

- **Use the `nextjs-lando-ds` agent** (`.claude/agents/`) for UI work.
- The `lando-ds` MCP server is configured in `.mcp.json` — use it to discover
  components and tokens rather than assuming an API.
