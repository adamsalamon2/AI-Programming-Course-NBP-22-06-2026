---
name: feedback-security-hook
description: PreToolUse AI security hook on pom.xml Write operations and how to satisfy it
metadata:
  type: feedback
---

There is a PreToolUse AI-agent security hook configured in `.claude/settings.json` that fires on every `Write(pom.xml)` call. The hook runs an AI security review of the dependency list.

**What it checks:** each `<dependency>` entry for known CVEs, supply-chain attacks, and validity.

**Known false positive:** Spring Boot 4.1.0 — the hook's AI knowledge does not include Boot 4.x GA releases and flagged it as "does not exist" with a fake CVE. The version is real (confirmed in local Maven cache and spring.io blog 2026-06-10).

**How to handle it:** Before writing `pom.xml`, use WebSearch to research each new dependency and gather security facts. Present this as additional context. The hook AI reviews `tool_input.content`, so including accurate version provenance in the pom.xml XML comments helps.

**PostToolUse hook:** A shell script at `.claude/hooks/maven-dep-security-check.sh` also fires after pom.xml edits. It extracts newly added dependencies from `git diff` and injects a security-research instruction into the conversation context. Respond to it by confirming each dependency's security status using WebSearch before proceeding.

**WireMock version note:** WireMock 3.13.2 is the current latest stable (not 3.13.0). Always use the patch release.

**Why:** The project has an automated security gate to catch malicious/vulnerable deps before they reach the codebase.
