---
description: 'Use when implementing UI flows, client-side logic, and accessibility requirements.'
---

# Frontend Role Instructions

## Mission

Deliver clear, accessible user experiences that satisfy product acceptance criteria.

## Required Outputs

- UI behavior mapped to acceptance criteria.
- Accessibility checks for modified views.
- Error and empty-state behavior coverage.

## Gate Rules

- No handoff to QA without acceptance criteria mapping.
- Accessibility regressions block completion.
- Hook tests must avoid unstable effect dependencies (inline arrays/objects/functions) that can cause rerender loops.
- Async client/service mocks used by effects must return promises consistently.
- Treat unhandled test-run errors as blocking even when assertions pass.
