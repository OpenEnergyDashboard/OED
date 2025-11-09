---
name: Test Case Implementation
about: Track implementation of a specific OED test case
title: '[TEST-ID] Test Case Description'
labels: test, enhancement
assignees: ''
---

## Test Case Information

**Test ID**: (e.g., L4, B7, CG15)
**Test Type**: (Line/Bar/Compare/3D/Range)
**File Location**: `src/server/test/web/readings[Type][Meter/Group][Unit].js`

## Test Details

**Meter Unit**: 
**Graphic Unit**: 
**Units Needed**: (e.g., u1, u2, u3)
**Conversions Needed**: (e.g., c1, c2)
**Time Range**: 
**Expected File**: 

## Checklist

### Before Starting
- [ ] Commented on [Issue #962](https://github.com/OpenEnergyDashboard/OED/issues/962) claiming this test
- [ ] Read documentation thoroughly
- [ ] Identified similar completed test as reference
- [ ] Confirmed expected CSV file location

### Implementation
- [ ] Created test function in correct file
- [ ] Set up units array correctly
- [ ] Set up conversions array correctly
- [ ] Set up meter/group data
- [ ] Called `prepareTest()` with correct parameters
- [ ] Loaded expected CSV with `parseExpectedCsv()`
- [ ] Made API call with correct parameters
- [ ] Used correct assertion helper function

### Testing & Validation
- [ ] Test passes: `npm run testsome [filepath]`
- [ ] Code follows existing patterns
- [ ] No eslint errors
- [ ] Comments added for clarity

### Pull Request
- [ ] PR created with descriptive title
- [ ] PR references this issue (e.g., "Closes #123")
- [ ] All CI checks passing
- [ ] Requested review from team

## Notes

<!-- Add any implementation notes, questions, or blockers here -->

## Time Tracking

- **Estimated time**: 2-4 hours
- **Actual time**: 
- **Blocked time**: 
