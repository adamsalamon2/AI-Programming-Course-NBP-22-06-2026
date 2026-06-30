# Agent Memory — be-developer

- [Spring Boot 4.x Project Facts](feedback-spring-boot-4-facts.md) — Boot 4 package renames, starter names, test slice changes
- [Security Hook Behaviour](feedback-security-hook.md) — PreToolUse AI security hook on pom.xml writes and how to handle it
- [SSE Leading-Space Fix](feedback-sse-leading-space-fix.md) — Spring SseEmitter serializes data: with no space; SSE spec strips one leading space; fix is to prepend " " to token before .data()
- [OpenAI SDK Per-Request Timeout](feedback-openai-sdk-request-timeout.md) — Use RequestOptions + Timeout.builder().request(Duration) for non-streaming LLM calls; don't apply to streaming
