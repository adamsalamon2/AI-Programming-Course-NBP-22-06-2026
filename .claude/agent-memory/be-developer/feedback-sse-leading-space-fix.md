---
name: feedback-sse-leading-space-fix
description: SSE leading-space bug fix pattern — Spring SseEmitter data serialization and the SSE spec leading-space strip rule
metadata:
  type: feedback
---

The Spring `SseEmitter.event().data(value)` builder writes `data:<value>` (no space after colon). The SSE spec (WHATWG) says the client parser strips exactly ONE leading space from the data field value. This means a token like `" mogę"` written as `data: mogę` has its leading space consumed by the parser, resulting in `"mogę"` — concatenated words.

**Fix pattern**: Prepend one space to the content string before passing it to `.data()`:
```java
emitter.send(SseEmitter.event().data(" " + content));
```
The parser strips the extra space, leaving the original content (including its own leading space) intact.

**Why:** The SSE spec rule is: after splitting on colon, if the value starts with U+0020 SPACE, remove it. Spring writes `data:` then the value with no gap — so the value's own leading space is the one removed.

**How to apply:** Any time a token stream (OpenAI, Anthropic, etc.) is forwarded via `SseEmitter.event().data(token)` in Spring MVC, prepend `" "`. The extra space is absorbed by the spec rule; the original token content is preserved.

**Test approach for the fix**: Use a custom `SseEmitter` subclass that overrides `send(SseEventBuilder)`, calls `builder.build()`, iterates `DataWithMediaType.getData()` results, and asserts the content data item starts with the extra space + original token. Note: `build()` returns multiple items (the `"data:"` prefix is stored separately as the first item). The content item starts with the value passed to `.data()`.
