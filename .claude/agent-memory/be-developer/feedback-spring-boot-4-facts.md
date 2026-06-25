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
