# FORK-DELTA — jaywillingham/openclaw vs upstream/main

This file is the inventory of every commit and uncommitted source patch in this fork that does not exist in `origin` (`https://github.com/openclaw/openclaw.git`). It is the cherry-pick checklist for upstream rebases.

**Update protocol:** every time you commit a fork-side patch (or merge a new branch from a PR you didn't push upstream), add a row below.

**Verify protocol:** before every upstream rebase:

1. Run `git fetch origin && git fetch fork`
2. Run `git log --all --oneline --not --remotes=origin` and reconcile against this file
3. Any new commits that show up there but aren't listed → add them
4. Any commits listed here that no longer show up → either landed upstream (remove) or got dropped (decide)

## Committed fork-only patches

| SHA (short)  | Branch                                             | Date       | Title                                                                                    | Why we carry it                                                                                                                                                                                                                                 | Upstream status                                                                          |
| ------------ | -------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `267c0577c0` | `krang/codex-oauth-jwt-skip-refresh-20260428`      | 2026-04-28 | fix(extensions/openai-codex): skip OAuth refresh when access_token JWT still valid       | Eliminates the codex provider's per-request refresh storm and the resulting `refresh_token_reused` cascade that demoted Krang's codex calls to the OpenRouter fallback. Tracks upstream issues #62247, #62198, #26322, #56960, #57107.          | Not yet PR'd. Watch those issues; if upstream merges a JWT-exp short-circuit, drop this. |
| `8e90ede408` | `krang/default-model-sentinel-20260428`            | 2026-04-28 | feat(agents/cron): `@default` model sentinel resolves to `defaults.primary` at fire time | Lets stored cron jobs and pinned sessions follow `defaults.primary` upgrades without manual re-edits. Recognized at every override site (cron payload, session override, agent-config subagent overrides, sessions_spawn, persisted overrides). | Local-only; would need a feature PR to land upstream.                                    |
| `96f98ec0cb` | `krang/origin-scoped-message-guard-20260425`       | 2026-04-25 | Guard subagent direct owner messages                                                     | Origin-scoped guard so subagents can't directly DM the operator without going through the parent agent's delivery path. Local hardening.                                                                                                        | Local-only.                                                                              |
| `cf354ffb91` | `krang/origin-scoped-message-guard-20260425`       | 2026-04-24 | carry: local-media-access state-dir allowance                                            | Re-ports a patch kept across rebases v2026.4.14 → 4.21 → 4.22 → 4.23. Allows `<stateDir>/media/**` as an early-return root in `assertLocalMediaAllowed`.                                                                                        | Was a previous fork-side patch, already re-carried multiple times — verify each rebase.  |
| `a979721433` | `krang/origin-scoped-message-guard-20260425`       | 2026-04-24 | fix: stage WhatsApp runtime deps before setup login                                      | Authored by Peter Steinberger (upstream contributor); cherry-picked into fork ahead of upstream merge.                                                                                                                                          | Likely already merged or PR'd upstream — verify next rebase, drop if landed.             |
| `b40e8fcd7b` | `krang/prompt-internment-skills-snapshot-20260502` | 2026-05-02 | fix(skills): intern skillsSnapshot prompt strings to bound RSS                           | Identical skillsSnapshot prompts duplicated 257× per session, retaining ~1.7 GiB. SHA-1 content-hash internment dedupes string identity. 60% RSS reduction confirmed via heap diff. Tests in `workspace.prompt-intern.test.ts`.                 | Local-only; specific to fork's session model.                                            |

## Uncommitted source patches (working-tree only)

These are real source changes built into `dist/` and running in production but **not yet committed** to any branch. Each one needs to be committed before the next upstream rebase or it will be lost.

_None as of 2026-05-03._

## Local environment / non-source state (for reference, not part of rebase)

The following are infrastructure deltas that don't live in this repo but matter when re-deploying after a rebase:

- **systemd unit** `/etc/systemd/system/openclaw-stable.service` — has `Environment="NODE_OPTIONS=..."` (quoted) to fix the unquoted-whitespace bug that silently dropped `--max-old-space-size`. Mirrored in `/root/backups/openclaw-upgrade-2026-04-23/`.
- **systemd drop-in** `/etc/systemd/system/openclaw-stable.service.d/90-heap-profiling.conf` — adds `EnvironmentFile=/root/.openclaw/credentials/krang-heap-profiling.env`, `MemoryHigh=6G`, `MemoryMax=6500M`. Heap-profiling env file enables `--heapsnapshot-signal=SIGUSR2`.
- **credentials drop-in** `/etc/systemd/system/openclaw-stable.service.d/credentials.conf` — `EnvironmentFile=/opt/openclaw.env` + `EnvironmentFile=/root/.openclaw/credentials/discord-krang.env`.

## Rebase workflow

```bash
cd /root/.openclaw/openclaw-src
git fetch origin
git checkout main && git rebase origin/main          # ff fast-forward main to upstream tip

# For each branch listed in the table above:
for b in krang/codex-oauth-jwt-skip-refresh-20260428 \
         krang/default-model-sentinel-20260428 \
         krang/origin-scoped-message-guard-20260425 \
         krang/prompt-internment-skills-snapshot-20260502; do
  git checkout "$b"
  git rebase origin/main      # resolve conflicts manually; lean on the commit messages above for context
done

# Reconcile the table:
git log --all --oneline --not --remotes=origin
# Any commit shown that's not in the table → add it.
# Any commit listed that's missing → either landed upstream (remove) or got dropped during rebase (decide).
```

## Last verified

| Date       | By    | Notes                                                                                                                                                           |
| ---------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-03 | April | Initial inventory built. 5 committed fork-only commits + 1 uncommitted patch identified.                                                                        |
| 2026-05-03 | April | Prompt-internment patch committed onto `krang/prompt-internment-skills-snapshot-20260502` (`b40e8fcd7b`); table updated; uncommitted-patches section now empty. |
