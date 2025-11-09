# ClickUp Integration Guide for OED Test Cases

## Why ClickUp for This Project?

**Pros:**
- ✅ Time tracking built-in
- ✅ Gantt charts with dependencies
- ✅ Automations without code
- ✅ Multiple views (List, Board, Calendar, Gantt)
- ✅ Great for learning PM tools

**Cons:**
- ⚠️ Extra tool to maintain
- ⚠️ Requires manual sync with GitHub
- ⚠️ Learning curve

---

## Setup Steps

### 1. Create ClickUp Workspace

**Hierarchy:**
```
OED Test Cases (Workspace)
└── Sprint 1 (Space)
    └── Line Tests (Folder)
        ├── Quantity Tests (List)
        ├── Flow Tests (List)
        └── Raw Tests (List)
    └── Bar Tests (Folder)
    └── Compare Tests (Folder)
    └── 3D Tests (Folder)
```

### 2. Task Template

Create a template for each test case:

**Task Name**: `[TEST-ID] Description`

**Custom Fields:**
- Test ID (Text)
- Test Type (Dropdown: Line/Bar/Compare/3D)
- Meter Unit (Text)
- Graphic Unit (Text)
- GitHub Issue # (Number)
- PR Link (URL)
- Estimated Hours (Number: 3-4)

**Subtasks:**
- [ ] Claim test on GitHub Issue #962
- [ ] Set up development environment
- [ ] Identify units and conversions needed
- [ ] Copy expected CSV file
- [ ] Implement test function
- [ ] Run test locally
- [ ] Create pull request
- [ ] Code review
- [ ] Merge to development

**Tags:**
- Priority (High/Medium/Low)
- Status (Not Started/In Progress/Blocked/Review/Done)
- Member (Member1/Member2/Member3/Member4)

### 3. GitHub Integration

**Option A: Native Integration (Requires ClickUp Business plan)**
- Connect ClickUp to GitHub
- Auto-create tasks from issues
- Sync PR status

**Option B: Zapier (Free tier available)**
```
Trigger: New GitHub Issue (labeled "test")
Action: Create ClickUp Task

Trigger: GitHub PR merged
Action: Update ClickUp Task status to "Done"
```

**Option C: Manual Sync (Free, but manual)**
- Use issue template to create both GitHub issue and ClickUp task
- Update both when status changes
- Link them via task description

### 4. Automation Examples

**Auto-assign based on tag:**
```
When: Task is created
And: Tag is "Member1"
Then: Assign to Member 1
```

**Move to In Progress when started:**
```
When: Subtask "Implement test function" is checked
Then: Move task to "In Progress" status
```

**Notify on blocker:**
```
When: Status changes to "Blocked"
Then: Send notification to Discord webhook
```

**Time tracking reminder:**
```
When: Task is in "In Progress" for 4 hours
And: No time tracked
Then: Send reminder to assignee
```

### 5. Views Setup

**Board View** - Sprint planning
- Columns: Backlog | In Progress | Testing | Done
- Group by: Assignee
- Filter: Current sprint

**List View** - Detailed tracking
- Sort by: Priority, then Due Date
- Show: All custom fields
- Filter: Not completed

**Gantt View** - Timeline visualization
- Show dependencies between tests
- Color code by member
- Display milestones

**Calendar View** - Due dates
- Group by: Week
- Color by: Member

**Workload View** - Balance distribution
- Show capacity per member
- Identify overallocation

---

## Recommended Workflow

### Daily
1. **Start of day**: Check ClickUp for assigned tasks
2. **During work**: Track time, update subtasks
3. **End of day**: Post standup in Discord

### Per Test Case
1. **Create task** in ClickUp from template
2. **Link GitHub issue** in task description
3. **Start timer** when beginning work
4. **Update subtasks** as you progress
5. **Log blockers** in comments
6. **Close task** when PR merged

### Weekly
1. **Review Gantt chart** - Are we on track?
2. **Check Workload view** - Balance tasks
3. **Team sync** - Discuss progress
4. **Update timeline** in GitHub markdown

---

## Discord + ClickUp Integration

Use ClickUp webhooks to post to Discord:

**Setup:**
1. In Discord: Create webhook in channel settings
2. In ClickUp: Settings → Integrations → Webhooks
3. Configure triggers:
   - Task status changed → Post to #test-progress
   - Task blocked → Post to #blockers
   - Task completed → Post to #general

**Example Discord Message:**
```
🎯 Task Update

Member 1 moved "L4 - Daily points test" to Testing
⏱️ Time tracked: 3.5 hours
📊 Progress: 6/8 subtasks complete
🔗 View task: [ClickUp link]
```

---

## Alternative: GitHub Projects (Recommended for this project)

**Why I recommend GitHub Projects instead:**

1. **Already integrated** - No extra tool
2. **Free** - No subscription needed
3. **Single source of truth** - Code + tasks together
4. **Simpler** - Less context switching
5. **Good enough** - Has boards, labels, milestones

**Use ClickUp if:**
- You want to learn professional PM tools
- Need advanced time tracking
- Want pretty Gantt charts
- Planning to manage multiple projects

**Use GitHub Projects if:**
- Want to stay lean
- Focus on coding
- Keep everything in GitHub
- Minimize tool overhead

---

## My Recommendation

**For this 2-week sprint:**
1. **Use GitHub Projects** - Keep it simple
2. **Use TEAM_TIMELINE.md** - Manual Gantt chart
3. **Use Discord** - Communication
4. **Track time manually** - In Discord standups

**For learning ClickUp:**
1. Set it up in parallel (optional)
2. Don't require team to use it
3. Experiment with automations
4. Compare experience with GitHub Projects
5. Decide for next sprint

---

## Quick Start Commands

### GitHub CLI (Create issues)
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Create test case issue
gh issue create \
  --title "[L4] Daily points for hourly readings" \
  --label "test,enhancement" \
  --body-file .github/ISSUE_TEMPLATE/test-case.md
```

### ClickUp CLI (If you choose ClickUp)
```bash
# Install ClickUp CLI
npm install -g clickup-cli

# Create task
clickup task create \
  --name "[L4] Daily points test" \
  --list "Quantity Tests" \
  --assignee "member1@email.com"
```

---

## Learning Resources

**GitHub Projects:**
- [GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Project automation](https://docs.github.com/en/actions)

**ClickUp:**
- [ClickUp University](https://university.clickup.com/)
- [Automation recipes](https://clickup.com/features/automations)
- [API documentation](https://clickup.com/api)

---

*Decision Point: After Day 1 setup, choose one primary tool and stick with it for this sprint*
