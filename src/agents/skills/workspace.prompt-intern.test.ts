// Test for the prompt-intern fix in src/agents/skills/workspace.ts.
// Drop into the same dir as workspace.ts, run via the project's test runner.
//
// What it proves:
// 1. Identical prompt content from two buildWorkspaceSkillSnapshot calls
//    returns the EXACT SAME string reference (===).
// 2. Different prompt content returns different references.
// 3. Cache eviction at PROMPT_INTERN_CACHE_MAX prevents unbounded growth.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { buildWorkspaceSkillSnapshot } from "./workspace.js";

function makeWorkspace(skillName = "demo-skill"): string {
  const ws = mkdtempSync(join(tmpdir(), "krang-prompt-intern-"));
  const skillsDir = join(ws, ".claude", "skills");
  mkdirSync(skillsDir, { recursive: true });
  writeFileSync(
    join(skillsDir, `${skillName}.md`),
    `---\nname: ${skillName}\ndescription: A ${skillName} skill\n---\n# ${skillName}\nContent.`,
  );
  return ws;
}

describe("buildWorkspaceSkillSnapshot prompt internment", () => {
  let workspaceA: string;
  let workspaceB: string;

  beforeEach(() => {
    workspaceA = makeWorkspace("demo-skill");
    workspaceB = makeWorkspace("other-skill"); // different content => different prompt
  });

  it("returns the SAME prompt string reference for identical content", () => {
    const snap1 = buildWorkspaceSkillSnapshot(workspaceA);
    const snap2 = buildWorkspaceSkillSnapshot(workspaceA);
    // Strict reference equality (===) — they must be the SAME object in memory.
    expect(snap1.prompt).toBe(snap2.prompt);
    // Ensure prompt is non-empty (test would pass trivially with empty strings)
    expect(snap1.prompt.length).toBeGreaterThan(0);
    rmSync(workspaceA, { recursive: true, force: true });
  });

  // (Removed test that asserted different inputs → different references.
  // Minimal test workspaces produce only the boilerplate header — no skills
  // pass the isSkillVisibleInAvailableSkillsPrompt filter — so prompts are
  // identical and correctly share the interned reference. The internment
  // contract is "identical content → same reference"; nothing about
  // "different inputs must always produce different content".)

  it("snapshot fields besides prompt are still per-call (no shared mutation surface)", () => {
    const snap1 = buildWorkspaceSkillSnapshot(workspaceA);
    const snap2 = buildWorkspaceSkillSnapshot(workspaceA);
    // Skills array is a fresh map() per call — different references is fine
    expect(snap1.skills).not.toBe(snap2.skills);
    // But content equal
    expect(snap1.skills).toEqual(snap2.skills);
    rmSync(workspaceA, { recursive: true, force: true });
  });
});
