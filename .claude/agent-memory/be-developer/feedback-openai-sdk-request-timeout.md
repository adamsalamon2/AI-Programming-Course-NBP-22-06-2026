---
name: feedback-openai-sdk-request-timeout
description: How to add per-request timeouts to OpenAI Java SDK blocking calls via RequestOptions
metadata:
  type: feedback
---

The `OpenAIOkHttpClient` blocking `create()` calls have no client-side timeout by default. A stalled OpenRouter call hangs the virtual thread indefinitely.

**Fix pattern**: Use `RequestOptions` with a `Timeout` for blocking (non-streaming) LLM calls:
```java
private static final RequestOptions REQUEST_OPTIONS = RequestOptions.builder()
        .timeout(Timeout.builder()
                .request(Duration.ofSeconds(60))
                .build())
        .build();

// Then use the two-arg overload:
client.chat().completions().create(params, REQUEST_OPTIONS);
```

**Why:** The `ChatCompletionService` has both `create(params)` (default options) and `create(params, RequestOptions)` (explicit options). `RequestOptions.timeout()` takes a `com.openai.core.Timeout` which has `connect`, `read`, `write`, `request` durations — `request` is the total end-to-end timeout.

**How to apply:** Add to `VisionAnalyzer` and `DecisionEngine` (non-streaming blocking calls). Do NOT add to `StreamingChatClient` — streaming calls have a different timeout model (OkHttp read timeout per chunk, not total request time).

**Timeout value choice:** 60 seconds is a reasonable default for vision+decision calls (legitimate LLM latency can be 10-30s). Streaming chat uses `SseEmitter` with 120s emitter timeout; its `createStreaming()` call doesn't need a request-level timeout here.

**Test pattern:** Capture `RequestOptions` via `ArgumentCaptor<RequestOptions>`, then assert `options.getTimeout()` is not null, and `options.getTimeout().request()` is ≥ 1 second. Note: `getTimeout()` returns `Timeout` directly (not `Optional<Timeout>`).
