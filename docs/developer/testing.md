# E2E Test Plan: WhatsApp Inspection Workflow

**Issue:** #9  
**Prepared by:** Casey 🧪  
**Date:** 2026-02-16  
**Dependencies:** #6 (complete/report tools), #7 (PDF generation), #8 (OpenClaw skill)

---

## Test Environment Setup

- [ ] OpenClaw with ai-inspection skill installed
- [ ] MCP server running (`node server/dist/index.js`)
- [ ] WhatsApp channel configured
- [ ] Test property address ready
- [ ] Camera/photos available for testing

---

## Test Cases

### TC-01: Happy Path - Full Inspection

**Objective:** Complete a full inspection from start to finish

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send "Start inspection at 123 Test St for John Smith" | Inspection started, first section prompt received |
| 2 | Receive section prompt | Shows section name, checklist items, asks for findings |
| 3 | Send text finding "Minor crack in wall" | Finding recorded, asked for photo |
| 4 | Send photo | Photo attached to finding, confirmation received |
| 5 | Send "next" | Navigate to next section |
| 6 | Repeat for all sections | Each section recorded |
| 7 | Send "complete" or reach final section | Inspection marked complete |
| 8 | Receive PDF report | PDF generated and sent via WhatsApp |

**Pass Criteria:**
- All sections visited
- All findings recorded with photos
- PDF received and readable
- PDF contains all findings and photos

---

### TC-02: Finding Without Photo

**Objective:** Record a finding with no photo attached

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start inspection | Inspection started |
| 2 | Send text finding "No issues observed" | Finding recorded |
| 3 | Send "no photo" or "skip photo" | Moves on without photo |
| 4 | Continue to next section | Finding saved without photo |

**Pass Criteria:**
- Finding saved without photo
- No error thrown
- PDF shows finding without image placeholder

---

### TC-03: Multiple Photos Per Finding

**Objective:** Attach multiple photos to a single finding

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send finding text | Finding started |
| 2 | Send photo 1 | Photo attached |
| 3 | Send photo 2 | Second photo attached |
| 4 | Send photo 3 | Third photo attached |
| 5 | Send "done" or next finding | All photos saved |

**Pass Criteria:**
- Multiple photos attached to single finding
- All photos appear in PDF report
- Photos have correct captions

---

### TC-04: Navigation - Back to Previous Section

**Objective:** Navigate back to re-visit a section

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete section 1 | Move to section 2 |
| 2 | Send "back" or "previous" | Return to section 1 |
| 3 | Add another finding | Finding added to section 1 |
| 4 | Send "next" | Return to section 2 |

**Pass Criteria:**
- Can navigate backwards
- New findings added to correct section
- Forward navigation resumes correctly

---

### TC-05: Navigation - Skip Section

**Objective:** Skip a section with no findings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Receive section prompt | Section displayed |
| 2 | Send "skip" or "no issues" | Section marked complete with no findings |
| 3 | Move to next section | Next section prompt |

**Pass Criteria:**
- Section skipped without error
- PDF shows "No issues found" or similar for skipped section
- Progress tracked correctly

---

### TC-06: Status Check - "Where am I?"

**Objective:** Get current status mid-inspection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Mid-inspection | Some sections complete |
| 2 | Send "where am I" or "status" | Current section, progress shown |
| 3 | Shows completed sections | Count and list |
| 4 | Shows remaining sections | What's left |

**Pass Criteria:**
- Current section name displayed
- Progress percentage/count shown
- Remaining sections listed

---

### TC-07: Status Check - "What's Left?"

**Objective:** See remaining work

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Mid-inspection | Some sections complete |
| 2 | Send "what's left" | Remaining sections listed |
| 3 | Shows count | "3 sections remaining" |

**Pass Criteria:**
- Accurate count of remaining sections
- Section names listed
- Estimated time if available

---

### TC-08: Resume After Timeout

**Objective:** Resume inspection after conversation gap

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start inspection | Inspection active |
| 2 | Wait 30+ minutes (simulate timeout) | Session may expire |
| 3 | Send "resume" or "continue" | Inspection state restored |
| 4 | Continue from last section | No data lost |

**Pass Criteria:**
- Inspection state persisted
- Can resume without restarting
- All previous findings preserved

---

### TC-09: Invalid/Unclear Input

**Objective:** Handle garbage or unclear input gracefully

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Mid-inspection | Waiting for input |
| 2 | Send "asdfghjkl" | Polite clarification request |
| 3 | Send unclear command | Suggests valid options |

**Pass Criteria:**
- No crash or error
- Helpful response provided
- Suggests valid commands/options

---

### TC-10: Photo Handling - Large File

**Objective:** Handle large photo files

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send very large photo (>5MB) | Photo accepted or graceful rejection |
| 2 | If accepted | Photo compressed for report |
| 3 | If rejected | Clear error message, retry option |

**Pass Criteria:**
- Large files handled without crash
- Clear feedback to user
- PDF stays under 100MB limit

---

### TC-11: Photo Handling - Invalid Format

**Objective:** Handle non-image files

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send PDF or video instead of photo | Rejected with clear message |
| 2 | Ask for valid image | User can retry |

**Pass Criteria:**
- Invalid formats rejected
- Clear error message
- No crash

---

### TC-12: Complete Inspection - No Findings

**Objective:** Complete inspection with zero findings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Skip all sections | No findings recorded |
| 2 | Complete inspection | PDF generated |
| 3 | PDF shows "no issues" | Clean report |

**Pass Criteria:**
- Empty inspection allowed
- PDF generated successfully
- Report shows no issues found

---

### TC-13: PDF Quality Check

**Objective:** Verify PDF meets professional standards

| Check | Criteria |
|-------|----------|
| Cover page | Job #, address, client, date visible |
| Table of contents | All sections listed |
| Section headers | Clear and consistent |
| Photos | Embedded with captions, good quality |
| Conclusions | Match finding severity |
| Page numbers | Present and correct |
| File size | Under 100MB for WhatsApp |

**Pass Criteria:**
- Matches professional PPI template style
- All data accurate
- Readable and well-formatted

---

### TC-14: Concurrent Inspections (Edge Case)

**Objective:** Handle multiple inspections (if supported)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start inspection A | A active |
| 2 | Try to start inspection B | Either: B starts (A paused) OR rejected with message |

**Pass Criteria:**
- Clear behavior defined
- No data corruption
- User informed of state

---

### TC-15: Network Interruption

**Objective:** Handle network issues gracefully

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Mid-inspection | Sending finding |
| 2 | Network drops | Message queued or error shown |
| 3 | Network restored | Can continue, no data lost |

**Pass Criteria:**
- Partial data not corrupted
- Clear feedback on failure
- Recovery possible

---

## Summary Checklist

### Happy Path
- [ ] TC-01: Full inspection complete

### Findings
- [ ] TC-02: Finding without photo
- [ ] TC-03: Multiple photos per finding

### Navigation
- [ ] TC-04: Back to previous section
- [ ] TC-05: Skip section
- [ ] TC-06: Status check - where am I
- [ ] TC-07: Status check - what's left

### Error Handling
- [ ] TC-08: Resume after timeout
- [ ] TC-09: Invalid input
- [ ] TC-10: Large photo
- [ ] TC-11: Invalid format

### Edge Cases
- [ ] TC-12: No findings
- [ ] TC-13: PDF quality
- [ ] TC-14: Concurrent inspections
- [ ] TC-15: Network interruption

---

## Notes

- Testing blocked until #6 and #7 complete
- Will document bugs as GitHub issues
- Re-test after fixes

---

*Test plan prepared by Casey 🧪*
