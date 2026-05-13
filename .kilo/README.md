# Kilo Agent Configuration for HMSP Dashboard

This directory contains Kilo agent configuration for the HMSP Dashboard project.

## Structure

```
.kilo/
├── kilo.jsonc           # Main configuration (validated schema)
├── command/             # Slash commands (invoked with /name)
│   ├── dev.md          # Start dev server
│   ├── build.md        # Production build + typecheck
│   ├── deploy.md       # Deploy to GitHub Pages
│   ├── db.md           # Supabase database operations
│   ├── seed.md         # Seed test data
│   ├── typecheck.md    # TypeScript check only
│   ├── status.md       # App health & environment report
│   ├── env.md          # Env var inspector
│   ├── logs.md         # Log viewers
│   ├── staff.md        # Staff status management
│   ├── staff-manual.md # Manual staff editing/verification
│   ├── feature.md      # Scaffold new features
│   └── ai.md           # Gemini/Groq AI management
├── agent/              # Specialized subagents
│   ├── frontend.md     # React 19 + Vite + Tailwind expert
│   ├── backend.md      # Supabase + RLS + Auth
│   ├── fullstack.md    # End-to-end feature specialist
│   ├── database.md     # Migrations, performance, triggers
│   ├── devops.md       # CI/CD, GitHub Actions, deployment
│   ├── security-reviewer.md  # Security audit specialist
│   └── ai-ocr.md       # Gemini/Groq fallback and quota handling
├── skills/             # Project-specific skills
│   └── hmsp-dashboard/
│       └── SKILL.md    # Comprehensive project handbook
└── node_modules/       # Kilo plugin dependencies (if any)

```

## Configuration

### Main Config: `.kilo/kilo.jsonc`

```jsonc
{
  "$schema": "https://app.kilo.ai/config.json",
  "model": "anthropic/claude-sonnet-4",
  "default_agent": "code",
  "instructions": ["AGENTS.md", "CLAUDE.md", ".kilo/**/*.md"],
  "permission": {
    "bash": "allow",
    "edit": {
      "src/**": "allow",
      ".env.*": "deny",
      "node_modules/**": "deny",
      "*": "ask"
    }
  }
}
```

**Key settings:**
- `model`: Default LLM (Claude Sonnet 4 for best reasoning)
- `instructions`: Additional instruction files loaded into context
- `permission.edit`: Granular file edit permissions (deny secrets + deps, ask on others)
- `permission.bash`: allow (devs need to run npm, git, supabase CLI)
- `skills.paths`: Additional skill directories (project + global + legacy)

### Permissions Model

Three-tier permission system:
1. **Global allow/deny** (bash, read, skill, external_directory)
2. **Pattern-based edit** (first match wins)
3. **Fallback** (`"*": "ask"`) — prompts for any unlisted file

Example:
```json
{
  "permission": {
    "bash": "allow",
    "edit": {
      "src/**": "allow",        // allow all source files
      "supabase/migrations/**": "allow",
      ".env.*": "deny",         // never edit env files via agent
      "dist/**": "deny",        // built assets are read-only
      "*.key": "deny",          // no key files
      "*": "ask"                // everything else asks first
    }
  }
}
```

## Commands Reference

### Development

| Command | Description | Agent |
|---|---|---|
| `/dev` | Start Vite dev server on port 3000 | code |
| `/build` | Build + type-check for production | code |
| `/typecheck` or `/tc` | TypeScript check only (no build) | code |
| `/status` | Full app health report | code |
| `/env` | List VITE_* environment variables | devops |
| `/logs` | Tail dev server or view errors | devops |

### Database

| Command | Description | Agent |
|---|---|---|
| `/db` | Supabase operations (push, reset, status, new migration) | database |
| `/seed` | Seed staff/patient test data | database |

### Deployment

| Command | Description | Agent |
|---|---|---|
| `/deploy` | Deploy to GitHub Pages (workflow or manual) | devops |
| `/deploy workflow` | Trigger GitHub Actions (default) | devops |
| `/deploy manual` | Local build + git push to gh-pages | devops |

### Staff Management

| Command | Description | Agent |
|---|---|---|
| `/staff` | Bulk status operations, list with filters | frontend |
| `/staff-manual` | Detailed edit, verify integrity, find, export | frontend |

### AI/OCR

| Command | Description | Agent |
|---|---|---|
| `/ai` | Gemini/Groq model switch, quota status | ai-ocr |
| `/ai groq` | Force Groq fallback |
| `/ai gemini` | Switch back to Gemini |
| `/ai test` | Test API connectivity |

### Feature Scaffolding

| Command | Description | Agent |
|---|---|---|
| `/feature` | Scaffold new resource (CRUD + migration) | fullstack |

## Agents Reference

### Primary Agent Selection

Use `/agents` or `<leader>a` in TUI to switch agents.

| Agent | Purpose | When to Use |
|---|---|---|
| `code` | General coding (default) | Most tasks |
| `frontend` | React/Vite/Tailwind specialist | UI components, styling, animations |
| `backend` | Supabase & RLS policies | Database queries, auth, real-time |
| `fullstack` | Cross-layer features | New features spanning frontend + backend |
| `database` | Migrations, performance, triggers | Schema changes, indexes, views |
| `devops` | CI/CD, GitHub Actions, deployment | Build failures, secrets, workflows |
| `security-reviewer` | Security audit | Auth, input validation, API keys |
| `ai-ocr` | Gemini integration, fallback strategies | OCR extraction, quota management |

### Agent Specializations

**frontend** — React 19 patterns, state management (Zustand + React Query), Tailwind CSS utilities, Motion animations, responsive design, component architecture, code splitting, performance optimization.

**backend** — Supabase client usage, real-time subscriptions, RLS policy design, row-level security, authentication flows, session management, error handling with toast notifications.

**fullstack** — End-to-end feature delivery: schema → service → UI → routing. Understands all service layers and their responsibilities.

**database** — SQL migrations (idempotent, backward-compatible), PL/pgSQL triggers, indexes, views, constraints, performance tuning with pg_stat_statements, schemas.

**devops** — GitHub Actions YAML, Vite config, environment variable injection, GitHub Secrets management, deployment troubleshooting, bundle size optimization.

**security-reviewer** — API key exposure detection, SQL injection prevention, XSS mitigation, input validation with Zod, secret scanning, RLS audit checklist.

**ai-ocr** — Gemini API best practices, fallback patterns (Groq, OpenAI, Ollama), quota monitoring, structured JSON extraction, image preprocessing, error recovery.

## Skills

### Loading Skills

Skills are markdown files at `skills/<name>/SKILL.md` inside any config directory (`.kilo/`, `.kilocode/`, `.opencode/`, global `~/.config/kilo/`).

The project includes **1 built-in skill**:

**hmsp-dashboard** — Comprehensive project handbook (this file's sibling). Auto-loaded. Covers:
- Project overview, live URL, tech stack
- Data models and business rules
- Service layer pattern
- Development workflow
- Database schema details
- MCP server usage
- UI/UX conventions
- Common pitfalls and gotchas

### Adding Custom Skills

Create: `.kilo/skills/my-custom-skill/SKILL.md` with frontmatter:
```yaml
---
name: my-custom-skill
description: What this skill does
triggers:
  - keyword1
  - keyword2
---
Skill content here...
```

Skills auto-load and trigger on keyword matches.

## MCP Servers

MCP (Model Context Protocol) servers extend agent capabilities.

### Configured Servers

**Supabase MCP** — Database access via `supabase mcp serve`. Start with:
```bash
npx supabase mcp serve
```
Configured in global `~/.qwen/settings.json` or Kilo MCP section.

**Chrome DevTools MCP** — Browser automation, E2E testing.
```bash
npx chrome-devtools-mcp@latest --quiet
```

**Git MCP** — Version control operations. Auto-detected.

**Sequential Thinking MCP** — Planning and reasoning.

**Memory MCP** — Knowledge graph storage (this memory!)

### Adding New MCP Server

```bash
# Install globally or locally
npm install -g your-mcp-server

# Add to .kilo/kilo.jsonc
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["node", "/path/to/server.js"],
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

Then restart Kilo to load the new server.

## Quick Start Guide

### First-time Setup

1. **Verify Kilo version** (needs Kilo 0.8.0+)
   ```bash
   kil --version
   ```

2. **Project auto-detects `.kilo/`** — no extra config needed. Kilo loads:
   - `.kilo/kilo.jsonc` (config)
   - `.kilo/command/*.md` (commands)
   - `.kilo/agent/*.md` (agents)
   - `.kilo/skills/*/SKILL.md` (skills)

3. **Start a session** — Kilo automatically loads all commands and agents.

### Common Workflows

**Start developing:**
```
/dev
```
Starts Vite dev server on port 3000.

**Add a new migration:**
```
/db new add_staff_status_column
```
Edits the created SQL file, then:
```
/db push
```

**Deploy:**
```
/deploy
```
Triggers GitHub Actions workflow.

**Fix a staff record:**
```
/staff-manual edit NC-KHI-0001 status Active
```

**Check Gemini quota:**
```
/ai status
```
If quota exceeded:
```
/ai groq
```

**Run type check before commit:**
```
/typecheck
```

### Finding Commands

All commands are accessible via:
- TUI command palette: `Ctrl+P` → type command name
- Slash command: `/command-name` in chat
- Leader key: `<leader>c` (compact), `<leader>l` (sessions), etc. (TUI only)

List all: `/help` or in TUI Ctrl+P.

## Troubleshooting

### Commands Not Found

If `/dev` or other commands don't appear:

1. Check `.kilo/command/` directory exists and has `.md` files
2. Validate config: `kilo validate`
3. Restart Kilo session (config reloads on start)
4. Verify schema: `kilo config validate`

### Agent Not Selectable

Agent must have `mode: primary` or `mode: all` to appear in agent picker.
Check agent file frontmatter:
```yaml
---
mode: primary  # or 'all' for both primary + subagent
---
```
Subagent-only (`mode: subagent`) is only available via Task tool, not agent picker.

### Build Fails in /dev

Likely missing dependencies:
```bash
npm ci  # clean install from package-lock.json
```

If still failing:
- Check Node version: should be 20+ (node -v)
- Clear Vite cache: delete node_modules/.vite
- Rebuild: /build then check errors

### Environment Variables Missing

If `/env` shows empty values:
- Local: ensure `.env.local` exists with `VITE_` prefixed vars
- Restart dev server after changing `.env.local`
- For deploy: check GitHub Secrets are named exactly as workflow expects

### MCP Server Not Starting

Check server logs:
```bash
# For Supabase MCP
npx supabase mcp serve --debug
```

Ensure port not in use (MCP uses stdio, not network usually).

### Permission Denied on File Edit

`.kilo/kilo.jsonc` `permission.edit` controls access. If editing a file is denied:
1. Check pattern matching (order matters, first match wins)
2. Add explicit allow for that pattern if safe
3. Use `"*": "ask"` fallback to be prompted

### Agent Ignoring Instructions

Agents load instruction files in order:
1. Agent file itself (highest priority)
2. `instructions` globs from config (in order)
3. Global instructions (if any)
4. Built-in system prompt

Check `AGENTS.md` and `CLAUDE.md` might override project-specific context. Rename or edit those files if needed.

## Updating Configuration

### Add New Command

1. Create file: `.kilo/command/mycommand.md`
2. Add frontmatter:
   ```yaml
   ---
   description: What this command does
   agent: frontend    # optional, defaults to 'code'
   subtask: false    # true = non-blocking, runs in background
   ---
   Command body...
   ```
3. No restart needed — new commands auto-detected on next session.

### Add New Agent

1. Create file: `.kilo/agent/myagent.md`
2. Add frontmatter:
   ```yaml
   ---
   description: When to use this agent
   mode: subagent   # 'primary' | 'subagent' | 'all'
   model: anthropic/claude-sonnet-4  # optional, overrides default
   steps: 25        # max agentic iterations
   color: "#ff5733" # UI accent color
   permission:
     bash: allow
     edit:
       "src/**": allow
       "*": ask
   ---
   System prompt for this agent...
   ```
3. Agent appears in picker if `mode` includes primary.

### Change Default Model

In `kilo.jsonc`:
```json
{
  "model": "anthropic/claude-sonnet-4",
  "small_model": "anthropic/claude-haiku-3"  // for quick tasks
}
```

Valid model IDs: `provider/model` format (e.g., `anthropic/claude-sonnet-4`, `openai/gpt-4o`, `google/gemini-2.0-flash`).

### Enable/Disable Providers

```json
{
  "disabled_providers": ["openai"],   // hide OpenAI models
  "enabled_providers": ["anthropic"]  // ONLY Anthropic (blacklist others)
}
```

## Tips & Best Practices

1. **Use specialized agents** — switch to `frontend` for UI work, `database` for migrations, `devops` for CI/CD
2. **Permission granularity** — keep `"*": "ask"` fallback; only promote patterns you trust
3. **Command discovery** — users can `/help` to see all available commands
4. **Agent context** — each agent loads its own instructions plus global ones; keep agent prompts focused
5. **Skill triggers** — choose distinctive keywords; avoid generic terms that misfire
6. **Subtask vs blocking** — `subtask: true` for long-running tasks (scaffolding, seeding) so user can continue chat
7. **MCP tool permissions** — per-tool: `"github_*": "ask"`, `"github_get_file_contents": "allow"`
8. **Keep config minimal** — Kilo loads remote config too; avoid duplicating everything locally
9. **Validate config** — `kilo validate` checks schema and permission syntax
10. **Share agent config** — commit `.kilo/command/` and `.kilo/agent/` to repo for team-wide consistency

## Resources

- Kilo Docs: https://app.kilo.ai/docs
- Config Schema: https://app.kilo.ai/config.json
- Agent Builder Guide: `/docs/agent-builder` in TUI
- MCP SDK: https://github.com/modelcontextprotocol/sdk
- Project AGENTS.md: `AGENTS.md` (root)
- Skill reference: `.kilo/skills/hmsp-dashboard/SKILD.md`

## Maintenance

### Regenerate after changes
Kilo auto-reloads config on file changes in most environments. If commands don't appear:
1. Save config files with proper extension (.md, .jsonc)
2. Restart Kilo session
3. Run `/reload` (if available) or restart CLI

### Clean up unused commands/agents
Simply delete the `.md` file. They disappear on next reload.

### Version control
**Commit `.kilo/` directory** to project repo so all team members share the same commands and agents.

`.gitignore` normally excludes:
- `.kilo/node_modules/`
- `.kilo/*.log`
- `.kilo/.cache/`

Keep: config files, command markdown, agent markdown, skill markdown.

---

**Setup complete!** The HMSP Dashboard now has a full Kilo integration with 13 commands, 7 specialized agents, and 1 project skill.

To verify: run `/help` to see all commands; switch agents with `<leader>a` (TUI) or Task tool.
