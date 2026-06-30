---
name: feedback-spring-boot-4-facts
description: Spring Boot 4.x package renames, starter names, and test slice changes confirmed from local Maven cache
metadata:
  type: feedback
---

Spring Boot 4.1.0 GA was released 2026-06-10. The following renames are confirmed from the local Maven cache at `~/.m2/repository/org/springframework/boot/`:

**Starter renames:**
- Web starter: `spring-boot-starter-web` → `spring-boot-starter-webmvc`
- New test starter for MVC slice: `spring-boot-starter-webmvc-test` (test scope)

**`@WebMvcTest` moved to a new package:**
- Boot 3: `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest`
- Boot 4: `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`
- The class lives in `spring-boot-webmvc-test` jar (pulled in by `spring-boot-starter-webmvc-test`)
- `spring-boot-test-autoconfigure` in Boot 4 no longer contains a `web/servlet` subpackage

**`spring-boot-starter-test`** still exists at the same coordinates.

**Why:** Boot 4 (Spring Framework 7) reorganised the web layer into a separate `spring-boot-webmvc-*` family of artifacts to decouple the web module.

**How to apply:** Always add `spring-boot-starter-webmvc-test` (test scope) alongside `spring-boot-starter-test` when writing `@WebMvcTest` slices in Boot 4 projects.

**Jackson 3.x package rename (Boot 4):**
- Boot 4 uses Jackson 3.x: `tools.jackson.core:jackson-databind:3.1.x`
- `ObjectMapper` moved to `tools.jackson.databind.ObjectMapper` — NOT `com.fasterxml.jackson.databind.ObjectMapper`
- Annotations (`@JsonPropertyDescription`, `@JsonValue`, etc.) remain in `com.fasterxml.jackson.annotation.*` via the compat jar
- The old `com.fasterxml.jackson.core:jackson-databind:2.x` jar coexists (pulled by OpenAI SDK) but Spring Boot does NOT register a `com.fasterxml.jackson.databind.ObjectMapper` bean
- Always use `tools.jackson.databind.ObjectMapper` in production code and tests that work with the Spring context

**WireMock 3.13.x + Boot 4 Jetty incompatibility:**
- `org.wiremock:wiremock:3.13.2` depends on `jetty-servlet:11.0.26` alongside Boot 4's `jetty-server:12.x`
- This mixed Jetty version causes `FatalStartupException: Jetty 11 is not present`
- Workaround: use Mockito to mock the OpenAI SDK's streaming service directly instead of WireMock HTTP stubs
- The `ChatCompletionService.createStreaming()` method is mockable with `mock(StreamResponse.class)` + `when().stream().thenReturn(Stream.of(...))`

**`@WebMvcTest` + `CorsConfig` using `AppProperties`:**
- `@WebMvcTest` slices don't load `@ConfigurationProperties` beans like `AppProperties`
- Solution: make `CorsConfig` use `@Value("${app.cors.allowed-origin:http://localhost:4200}")` directly instead of injecting `AppProperties`, so `@Import(CorsConfig.class)` works in `@WebMvcTest`

**Multiple `Executor` beans + `@Qualifier`:**
- Spring Boot 4 with virtual threads registers a `taskScheduler` Executor alongside the custom `virtualThreadExecutor`
- Services injecting `Executor` by type get ambiguity errors
- Fix: `@Qualifier("virtualThreadExecutor")` on the constructor parameter
