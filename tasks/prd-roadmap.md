# Workout Planner Plugin - Implementation Roadmap

## Overview

This roadmap outlines the incremental implementation of improvements identified in the optimization report. The primary goal is to **reduce friction and repetition in daily workout logging**.

## Phase Summary

| Phase | Focus | Effort | Key Deliverables |
|-------|-------|--------|------------------|
| [Phase 1](prd-phase1-quick-wins.md) | Quick Wins | Low | Timer Presets, Default exactMatch, Exercise Name Audit |
| [Phase 2](prd-phase2-core-features.md) | Core Features | Medium | Auto-Generate Blocks, Progressive Overload Tracking |
| [Phase 3](prd-phase3-advanced-features.md) | Advanced Features | Medium | Protocol Logging, Duration Calculator |
| [Phase 4](prd-phase4-integrations.md) | Integrations | High | Mobile Quick Entry, Templater, Dataview, Canvas |
| [Phase 5](prd-phase5-refactoring.md) | Refactoring | Medium | Constants Split (817 → 5 focused files) |

## Dependencies

```
Phase 1 (Quick Wins)
    │
    ├──► Phase 2 (Core Features)
    │        │
    │        └──► Phase 3 (Advanced Features)
    │
    └──► Phase 4 (Integrations)

Phase 5 (Refactoring) ──► Independent, can be done anytime
```

## Priority Metrics

Based on the optimization report analysis:

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Timer Presets | Low | Medium | P1 |
| Default exactMatch | Minimal | Low | P1 |
| Exercise Name Audit | Medium | High | P1 |
| Auto-Generate Exercise Block | Medium | High | P2 |
| Progressive Overload Tracking | High | High | P2 |
| Protocol-Aware Logging | Medium | Medium | P3 |
| Workout Duration Calculator | Medium | Medium | P3 |
| Mobile Quick Entry | High | High | P2 |
| Templater Support | Low | Medium | P2 |
| Dataview Integration | Medium | Medium | P3 |
| Canvas Export | Medium | Low | P4 |
| Constants Split | Medium | Medium | P3 |

## User Story Count by Phase

| Phase | User Stories | Complexity |
|-------|-------------|------------|
| Phase 1 | 7 | Low-Medium |
| Phase 2 | 8 | Medium |
| Phase 3 | 9 | Medium-High |
| Phase 4 | 10 | Medium-High |
| Phase 5 | 8 | Low |
| **Total** | **42** | - |

## Implementation Notes

### Getting Started
1. Start with Phase 1 - minimal risk, immediate value
2. Each phase can be released independently
3. User stories within a phase can be parallelized where noted

### Breaking Changes
- **Phase 1:** `exactMatch` default changes (existing blocks unaffected if explicit)
- **Phase 3:** CSV schema adds `protocol` column (backward compatible)
- **Phase 5:** Import paths change (can keep barrel export for compatibility)

### Testing Strategy
- Each phase should have passing tests before release
- Manual testing checklist in each PRD's acceptance criteria
- Browser verification required for UI stories

## Success Criteria

After all phases complete:
- [ ] Timer configuration reduced from 5 lines to 1 line
- [ ] Zero exercise name mismatches in vault
- [ ] Mobile logging under 5 seconds per set
- [ ] Protocol usage tracked for 30%+ of sets
- [ ] Constants file split into 5 focused modules
- [ ] All tests passing with 80%+ coverage
