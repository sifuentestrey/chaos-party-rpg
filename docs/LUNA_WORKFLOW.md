# Working cheaply without weakening the game

**Date: October 27, 2026.** Read `AGENTS.md` and `CURRENT_STATUS.md` first. This guide is for coding assistants, not the model running the game.

## Assessment

The tested foundation already protects multiplayer turn ownership, authoritative dice/state, exact item identities, ownership and saves. It is not a finished creative DM or a physically accepted game-night build. Passing tests does not establish fun, truthful prose, or every possible action.

Luna can complete substantial predesigned milestones autonomously when file boundaries, acceptance criteria and escalation rules are explicit. Small commits are an internal implementation practice, not a requirement to ask the owner between steps. It is not an appropriate sole designer/reviewer for a new mechanic, save format, network protocol or AI authority boundary. No architecture can make arbitrary unreviewed code changes harmless.

## Task lanes

| Lane | Suitable work | Required review |
| --- | --- | --- |
| Green | Values in the validated campaign text JSON; assigned documentation; small additional test fixtures using existing helpers | Check the diff, run verification, and review wording/assertions. Content still needs a semantic/editorial glance. |
| Yellow | A specified visual/copy adjustment, licensed sprite integration, a small adapter or renderer change | A clear reference/acceptance case, screenshots when relevant, and SOL or human review before promotion. Some frontend files also contain critical controller code. |
| Red | New action behavior, physics/materials, rewards/difficulty, NPC/item aliases, save migrations, multiplayer/credentials, provider/quota settings, AI validation, new region types, build/security rules | SOL designs the change and acceptance tests; Luna may implement a bounded part. Strong review is required. |

Give Luna a complete milestone rather than an undefined “build the rest of the game” request. It may work continuously through the milestone, commit intermediate steps, fix in-scope failures and queue independent blocked items for one stronger review. See [the assigned game-night presentation and QA milestone](LUNA_MILESTONE_GAME_NIGHT.md). This is an explicitly specified yellow-lane assignment; it does not expand the content-only checker. Major world expansion and travel voting still wait for the physical game-night gate.

## First enforced content lane

`public/content/campaign-text.json` contains only the existing procedural (`wild-*`) location prefixes, ambient rumors and quest titles. The build validates fixed keys, counts and plain-text limits, then generates a frozen JavaScript module. This supports older browser module loading without runtime JSON imports. Initial tavern/clearing/ruins names are outside this lane, and already saved regions retain their saved text; do not rewrite campaigns to force a wording change.

The file does not define rewards, NPC/item identities, objectives, materials, physics, exits or save schemas. Adding one of those fields must fail validation; changing it requires a separate design task. Changing rumor wording can still create a misleading story claim, so schema validation cannot replace reading the text.

For a text-only task:

1. Record the base commit and exact wording goal. Work on a small separate branch and preserve unrelated files.
2. Edit only `public/content/campaign-text.json` by hand. Keep the existing keys and array counts. Do not modify the validator or tests to make bad data pass.
3. Run `npm run build`. It regenerates `public/content/campaign-text.generated.js` and the bundled `src/framework.mjs`; include their resulting diffs, but never hand-edit them.
4. Run `node scripts/accept-content-task.mjs <approved-full-base-sha>`. This enforces the content file boundary before and after `npm run verify`. If it reports generated drift, regenerate and inspect the generated diff before rerunning. Do not suppress the check.
5. Inspect `git diff --name-only`. Stop and report if the task needs any additional engine, schema, test-oracle or infrastructure edits.
6. Commit the small patch with the verification result. Passing CI is evidence, not automatic approval to merge or deploy.

## What verification enforces

- `npm test` launches the suite in a child environment with game AI disabled and inherited provider credentials/configuration removed. A disposable default data directory protects against a test accidentally using the development campaign; it is removed after success or failure. Tests can still use their explicit synthetic adapters and explicit per-test data directories.
- `npm run verify` snapshots tracked generated files **before** the suite rebuilds them, compares them after tests and after the static build, and fails on missing or stale output. A passing test run cannot silently hide an uncommitted regeneration.
- The GitHub offline-check workflow runs tests/build with read-only repository permissions. It does not deploy, run live model benchmarks, download weights or enable paid providers.

These are development checks, not an operating-system sandbox or configured branch-protection rule. A worker able to edit the checks could weaken them; keep those files outside ordinary Luna task scope and review their changes separately.

## Cheap task card

Give the worker only the relevant files, one goal and a short acceptance list:

```text
Task: [one precise requested change]
Base: [current tested commit/branch]
Allowed manual files: [explicit paths]
Allowed generated output: [only output produced by the approved build]
Keep: first declaration, dice/state authority, saves, identities and current defaults
Pass: [specific positive and negative behavior checks] + npm run verify
Stop: if another file, changed mechanic, weaker assertion or new service is needed
Report: changed paths, checks actually run, failures/limits, commit
```

For green content work, fill the paths from the content lane above. For tests, specify the expected outcome independently; a worker must not simply copy current behavior into an assertion and call it correct.

## Keep usage low

Use SOL once to define a consequential change and its boundaries, then let Luna do the bounded implementation. Batch review of small green changes rather than asking SOL to reread the whole repository for each wording edit. Escalate a failed invariant or ambiguous mechanic with a short reproduction instead of guessing.

Read only the assigned paths and their relevant tests after the short handoff. Keep full verification output in an ignored log file and report its summary plus any failures; do not paste the whole suite or repeatedly enumerate assets. Do not manufacture busywork or add features just to keep a worker active when the next real acceptance gate is blocked.

Live Groq calls, `ai:check`, qualification scripts in live mode and provider configuration are outside ordinary Luna tasks. They consume a separate game-service allowance and need the existing approved procedure. A new task/chat is not a quota reset. No paid service, deployment, model activation or save replacement follows from this guide.

## Enforced content-task acceptance

A reviewer records the full immutable base commit **before** Luna starts. Run:

```sh
node scripts/accept-content-task.mjs <approved-full-base-sha>
```

The content policy permits exactly the JSON catalog and its two generated outputs. It checks the entire change since that base, including committed, staged, working-tree and non-ignored untracked files. It rejects changes outside those paths, missing files, symlinks, executable modes and non-ancestor/abbreviated bases. Scope is checked before and after offline verification. Documentation or test changes need their own task and review; do not expand the content allowlist to accommodate them.

The reviewer chooses and retains the base SHA. Luna must not move the base to hide changes. Run the approved checker from trusted code: inspect that acceptance/check/verification scripts, package scripts, tests and CI match the approved base before executing worker code. This local check is not independent protection against an assistant deliberately modifying the checker, choosing another base, racing filesystem changes or editing ignored local files. Ignored data and credentials must remain outside the worker's assignment; isolated checkouts and separate disposable test data remain required. Passing this command does not authorize merge, deployment or a new mechanic.

Review still checks wording for unsupported promises, invented world facts and misleading rewards. Automated schema checks cannot judge those meanings. A worker reports the exact base, command/result, changed paths and unresolved questions. Never weaken an oracle or update a golden baseline merely because a task fails.
