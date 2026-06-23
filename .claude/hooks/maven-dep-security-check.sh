#!/bin/bash
# Hook: Maven Dependency Security Check
# Event: PostToolUse (Edit | Write)
#
# Fires after pom.xml is edited. Extracts newly added <dependency> entries
# from `git diff` and injects a security-research instruction into Claude's
# context via additionalContext. Claude must research each new dependency
# before continuing.

INPUT=$(cat)

# ── 1. Only proceed when pom.xml was the file that changed ──────────────────
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" != *pom.xml ]]; then
  exit 0
fi

# ── 2. Fetch the diff for this specific file ─────────────────────────────────
# Try HEAD diff first (file already tracked), then staged, then full content
DIFF=$(git diff HEAD -- "$FILE_PATH" 2>/dev/null)
if [ -z "$DIFF" ]; then
  DIFF=$(git diff --cached -- "$FILE_PATH" 2>/dev/null)
fi

if [ -z "$DIFF" ]; then
  exit 0
fi

# ── 3. Extract newly added dependency coordinates from added (+) lines ────────
ADDED_GROUPS=$(echo "$DIFF" \
  | grep '^+' | grep -v '^+++' \
  | grep '<groupId>' \
  | sed 's/.*<groupId>\(.*\)<\/groupId>.*/\1/' \
  | tr '\n' ' ' | sed 's/[[:space:]]*$//')

ADDED_ARTIFACTS=$(echo "$DIFF" \
  | grep '^+' | grep -v '^+++' \
  | grep '<artifactId>' \
  | sed 's/.*<artifactId>\(.*\)<\/artifactId>.*/\1/' \
  | tr '\n' ' ' | sed 's/[[:space:]]*$//')

ADDED_VERSIONS=$(echo "$DIFF" \
  | grep '^+' | grep -v '^+++' \
  | grep '<version>' \
  | sed 's/.*<version>\(.*\)<\/version>.*/\1/' \
  | tr '\n' ' ' | sed 's/[[:space:]]*$//')

# Exit silently when no dependency-related lines were added
if [ -z "$ADDED_GROUPS" ] && [ -z "$ADDED_ARTIFACTS" ]; then
  exit 0
fi

# ── 4. Build the instruction context ─────────────────────────────────────────
CONTEXT="MAVEN SECURITY CHECK REQUIRED

New <dependency> elements were detected in: $FILE_PATH

  groupId(s):    ${ADDED_GROUPS:-(not detected)}
  artifactId(s): ${ADDED_ARTIFACTS:-(not detected)}
  version(s):    ${ADDED_VERSIONS:-(not detected)}

Before continuing with any further implementation, you MUST research the
security of each new dependency listed above:

  1. Search CVE databases: NVD (https://nvd.nist.gov) and OSV (https://osv.dev)
  2. Verify the library is legitimate and actively maintained on Maven Central
  3. Confirm the specified version has no known critical vulnerabilities
  4. Recommend a newer/patched version if the current one is vulnerable

Use the WebSearch tool to look up each dependency now and report your findings
explicitly. Do NOT proceed with implementation until security is confirmed."

# ── 5. Return context to Claude via hookSpecificOutput ────────────────────────
jq -n --arg ctx "$CONTEXT" '{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": $ctx
  }
}'
