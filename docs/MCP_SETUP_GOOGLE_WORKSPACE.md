# MCP Setup Runbook — Google Workspace access for Claude Code

**Goal:** install `google-docs-mcp` so Claude Code has direct read/write access to Google Drive, Sheets, Docs, Gmail, and Calendar in whichever Google account you OAuth with.

**Estimated time:** ~30 min.

**One-time setup, persistent capability** — after this you don't need to do it again unless you move machines, switch the underlying Google account, or rotate OAuth credentials.

---

## High-level shape

```
Google Cloud Project (free)
       │
       ├── Enables Drive + Sheets + Docs + Gmail + Calendar APIs
       │
       ├── Creates an OAuth Client ID + Secret (client_secret.json)
       │
       └── Hosts the OAuth consent screen
                  ↑
                  │ first time only: you click through to grant scopes
                  │
       google-docs-mcp (Node.js process)
                  ↑
                  │ launched on demand by Claude Code
                  │
       Claude Code (~/.claude.json mcpServers entry)
                  ↑
                  │ I see new tools: mcp__google-docs-mcp__*
```

**Which Google account to authenticate with:** I'd default to your **personal** account since it has the broadest natural access (and can be shared into for content owned by other accounts like `rowellfamilyreunion2026@gmail.com`). You can always re-OAuth or add a second MCP server instance later for a different account.

---

## Part 1 — Google Cloud Project + OAuth credentials (~15 min)

This is the slowest part. Google's console UI changes occasionally; steps below are accurate as of 2026-05-17 but small label changes happen — don't worry, the flow is the same.

### Step 1.1 — Create the project
1. Go to `https://console.cloud.google.com/`
2. Top-left, next to "Google Cloud," click the project picker dropdown → `NEW PROJECT`
3. Project name: `claude-code-mcp-bridge` (or anything; doesn't matter functionally)
4. Organization: leave as default
5. Click `CREATE`. Wait ~10 sec. When the bell icon shows "Project created," click `SELECT PROJECT` from the notification.

### Step 1.2 — Enable the APIs
1. In the left sidebar, `APIs & Services → Library`
2. Search for and enable each of these (click each, click `ENABLE`):
   - **Google Drive API**
   - **Google Sheets API**
   - **Google Docs API**
   - **Gmail API**
   - **Google Calendar API**

(If you only want a subset, skip the ones you don't want — fewer permissions to grant.)

### Step 1.3 — Configure the OAuth consent screen
1. Left sidebar, `APIs & Services → OAuth consent screen`
2. User Type: `External` → `CREATE`
3. Fill in:
   - App name: `Claude Code Bridge`
   - User support email: your email
   - Developer contact: your email
4. Click `SAVE AND CONTINUE`
5. **Scopes screen**: click `ADD OR REMOVE SCOPES`. Search for and check:
   - `.../auth/drive` (full Drive)
   - `.../auth/spreadsheets`
   - `.../auth/documents`
   - `.../auth/gmail.modify`
   - `.../auth/calendar`
   - (or check whichever subset matches the APIs you enabled)
   - Click `UPDATE` → `SAVE AND CONTINUE`
6. **Test users screen**: click `+ ADD USERS` → add the Google account you'll OAuth as (your personal Gmail). This account needs to be in the list since the app is in "Testing" mode and only test users can use it. Click `SAVE AND CONTINUE`.
7. Click `BACK TO DASHBOARD`.

### Step 1.4 — Create the OAuth Client ID
1. Left sidebar, `APIs & Services → Credentials`
2. Top, `+ CREATE CREDENTIALS → OAuth client ID`
3. Application type: `Desktop app`
4. Name: `claude-code-mcp-client`
5. Click `CREATE`
6. A popup appears with your Client ID + Client Secret. Click `DOWNLOAD JSON`.
7. Save the downloaded file as `~/.config/google-docs-mcp/client_secret.json`. Create the parent directory if needed:
   ```bash
   mkdir -p ~/.config/google-docs-mcp
   mv ~/Downloads/client_secret_*.json ~/.config/google-docs-mcp/client_secret.json
   ```

You now have `~/.config/google-docs-mcp/client_secret.json` containing your Cloud project's OAuth credentials.

---

## Part 2 — Install google-docs-mcp (~5 min)

```bash
cd ~/Documents
git clone https://github.com/a-bonus/google-docs-mcp.git
cd google-docs-mcp
npm install
npm run build
```

(If `npm run build` errors, check `package.json` — some forks use `tsc` directly; running `npx tsc` is an equivalent fallback.)

After build, the entry point should be at `~/Documents/google-docs-mcp/build/index.js` (or `dist/index.js` depending on the build script). Note this path — you'll need it for the Claude Code config.

---

## Part 3 — One-time OAuth grant (~3 min)

`google-docs-mcp` ships a small helper that runs the OAuth flow and saves a token. The exact command varies slightly between versions of the project — check the project's README, but it's typically:

```bash
cd ~/Documents/google-docs-mcp
node build/index.js --auth
```

This:
1. Opens a browser window
2. You log in as your personal Google account
3. Click "Continue" through the warning ("Google hasn't verified this app" — yes, because it's *your* app)
4. Grant the listed permissions
5. The browser shows "You can close this window" — the token has been saved to `~/.config/google-docs-mcp/token.json` (or similar)

If the project doesn't ship an `--auth` flag, run it once with no args and follow on-screen instructions. The README is the source of truth.

---

## Part 4 — Wire it into Claude Code (~3 min)

Claude Code's MCP config lives at `~/.claude.json` (or `~/.config/claude/claude_desktop_config.json` on some installs). To find the right one:

```bash
# Try these in order — the one that exists is your config file
ls -la ~/.claude.json 2>/dev/null
ls -la ~/.config/claude/claude_desktop_config.json 2>/dev/null
ls -la "~/Library/Application Support/Claude/claude_desktop_config.json" 2>/dev/null
```

Open that file. Find (or add) the `mcpServers` block at the top level. Add this entry:

```json
{
  "mcpServers": {
    "google-docs-mcp": {
      "command": "node",
      "args": [
        "/Users/slaycorp/Documents/google-docs-mcp/build/index.js"
      ],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "/Users/slaycorp/.config/google-docs-mcp/client_secret.json",
        "GOOGLE_OAUTH_TOKEN": "/Users/slaycorp/.config/google-docs-mcp/token.json"
      }
    }
  }
}
```

**Adjust the paths** to match where you actually installed the server + where the OAuth token landed. Save.

(The exact env-var names may differ slightly per the project's README — `GOOGLE_OAUTH_CREDENTIALS` is the common one. Check the project's docs.)

---

## Part 5 — Restart Claude Code + verify

1. **Quit and re-open Claude Code** (or your terminal session) so it picks up the new MCP config
2. In the next Claude Code session, I should see new tools surface in a `<system-reminder>` listing — names like:
   - `mcp__google-docs-mcp__sheets_get_values`
   - `mcp__google-docs-mcp__sheets_update_values`
   - `mcp__google-docs-mcp__drive_list_files`
   - `mcp__google-docs-mcp__drive_copy_file`
   - `mcp__google-docs-mcp__docs_get_document`
   - (...and many more)

3. **Smoke test in our chat**: ask me to "list the files in your reunion Drive folder" — I'll call `drive_list_files` and report. If that works, the setup is solid.

---

## Common gotchas

- **"This app isn't verified"**: expected. Click `Advanced → Go to Claude Code Bridge (unsafe)` → continue. The app is unverified because it's your private project, not because it's actually unsafe.
- **OAuth scope mismatch**: if a tool fails with a permission error, the scope wasn't granted in Part 1.3. Re-do the consent screen step with the missing scope + re-authorize via Part 3.
- **Token expires**: refresh tokens are long-lived but can be revoked from `myaccount.google.com → Security → Third-party apps`. If a tool starts failing after months, re-run Part 3.
- **MCP server doesn't show up in Claude Code**: check the path in the config JSON resolves to a real file. Run `node /path/to/build/index.js` manually in a terminal — if it errors, the server itself is broken.
- **Quota errors**: Google APIs have generous free quotas (1M reads/day on Sheets API, etc.) — easy to exceed during bulk migrations but normal use is fine.

---

## After setup — adding the reunion account too (optional)

If you want me to also have direct access to the reunion account's content **without** sharing it into your personal account, repeat Parts 2–4 with:
- A separate install of google-docs-mcp (e.g., `~/Documents/google-docs-mcp-reunion`)
- A separate OAuth flow logged in as `rowellfamilyreunion2026@gmail.com`
- A separate Claude Code `mcpServers` entry (e.g., key `google-docs-mcp-reunion`)

You'd see two sets of tools: `mcp__google-docs-mcp__*` (your account) and `mcp__google-docs-mcp-reunion__*` (reunion account). I'd pick the right one per task.

For now, the single-personal-account setup is the lightest start — share specific reunion folders/sheets into your personal account as needed.

---

## When you're done

Reply in chat with:
1. **"Setup complete"** + which Google account you OAuth'd as
2. **Whether you'd like me to test by listing files in a specific folder/Sheet** (give me an ID or name)

I'll verify the tools are exposed correctly and we'll go from there.
