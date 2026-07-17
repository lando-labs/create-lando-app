# START HERE — first session only

**This file is for the AI, and it is temporary.** It exists to run one first-run
onboarding, then it should be gone. `AGENTS.md` is the permanent brief.

## If you are an AI reading this

This project was just scaffolded with `npm create lando-app` and nobody has
worked in it yet. Do this once, then delete this file.

**1. Read `AGENTS.md` first.** It's the brief: the stack, the hard rules, and how
theming works here. Everything below assumes it.

**2. Check that the design-system MCP is actually alive.** Call the `lando-ds`
server — list the components. If it responds, the project is wired correctly and
you can build UI by querying the DS instead of guessing.

If it doesn't respond, say so plainly and tell the human what you tried. The
likely cause is that their editor hasn't picked up the MCP config yet
(`.mcp.json` for Claude Code, `.cursor/mcp.json` for Cursor,
`.codex/config.toml` for Codex) — restarting the editor usually fixes it. Don't
carry on pretending the design system is available; without the MCP you'd be
guessing at component APIs, which is the one thing `AGENTS.md` tells you not to do.

**3. Greet the human and orient them.** Briefly — a few sentences, not a lecture:

- `npm run dev` serves the getting-started page on **port {{DEV_PORT}}**. That
  page shows the app's live colors and how to change them.
- The theme preset is set in `app/providers.tsx`.
- `app/page.tsx` is meant to be replaced — it's a starting point, not furniture.
- They can just describe what they want to build and you'll use the design system
  to build it.

**4. Ask what they want to build.** Then get out of the way.

**5. Delete this file.** `rm START_HERE.md`. Its job is done — the permanent
instructions live in `AGENTS.md`, and leaving this around means every future
session re-reads a first-run script that no longer applies.

---

*Human reading this instead? Nothing here is required of you. Start your AI
assistant and it'll walk through the above — or just delete this file and read
`AGENTS.md` yourself.*
