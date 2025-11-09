# 🎯 Quick Reference: Workflow Decision Summary

> **TL;DR**: Use Feature Branching + Kanban Board

---

## ✅ Final Decisions

### 1. Repository Structure: **Fork with Shared Access**

```
OpenEnergyDashboard/OED (upstream)
         ↓ 
    aldungo/OED-dungo (origin - your sandbox)
         ↓
    Students clone and branch (NO individual forks)
```

**Why?**
- ✅ Safe learning sandbox (can't break main OED)
- ✅ Real-world open-source workflow
- ✅ All students work in same repo (easier collaboration)
- ✅ Can submit work to main OED later if desired

---

### 2. Branching Strategy: **Feature Branching** ⭐

```
development (protected)
  ├── feature/test-L4-adam
  ├── feature/test-L10-livia
  ├── feature/test-B8-tam
  └── feature/test-LG4-vy
```

**NOT GitFlow** (too complex for 2 weeks)

**Workflow:**
1. Create feature branch from `development`
2. Implement test
3. Open PR to `development`
4. Review + merge
5. Delete branch

---

### 3. Project Board: **Kanban** ⭐

```
📋 Backlog → 🔨 In Progress → 👀 In Review → ✅ Done
```

**NOT Feature Release board** (no releases needed)

**Columns:**
- **Backlog**: All 8 test cases
- **In Progress**: Currently being coded (branch created)
- **In Review**: PR opened, awaiting review
- **Done**: PR merged, test passing

---

### 4. Student Workflow: **No Individual Forks** ⭐

**❌ Wrong (Don't Do This):**
```
Student forks OED-dungo → Works in their fork → PR to OED-dungo
```

**✅ Right (Do This):**
```
Student clones OED-dungo → Creates branch → PR within OED-dungo
```

**Why?**
- ✅ Simulates real team development
- ✅ Easier code review (all in one place)
- ✅ Easier collaboration between students
- ✅ Simpler Git workflow to learn
- ✅ This is how companies work

---

## 📋 Student Git Commands

### Initial Setup (Once)

```bash
# 1. Clone the shared sandbox (NOT fork!)
git clone https://github.com/aldungo/OED-dungo.git
cd OED-dungo

# 2. Check you're on development branch
git branch
# Should show: * development

# 3. That's it! Ready to work.
```

### For Each Test (Repeatable)

```bash
# 1. Make sure development is up to date
git checkout development
git pull origin development

# 2. Create feature branch
git checkout -b feature/test-L4-adam

# 3. Make changes, commit often
git add .
git commit -m "Implement test case L4"

# 4. Push to remote (first time)
git push -u origin feature/test-L4-adam

# 5. Push subsequent commits
git push

# 6. Open PR on GitHub
# From: feature/test-L4-adam → To: development

# 7. After merge, clean up
git checkout development
git pull origin development
git branch -d feature/test-L4-adam
```

---

## 🎨 GitHub Project Board Setup

### Create Board

1. Go to: https://github.com/aldungo/OED-dungo
2. Click "Projects" tab
3. Click "New project"
4. Choose "Board" view
5. Name: "OED Test Cases Sprint"

### Configure Columns

**Column 1: 📋 Backlog**
- Description: "Tests waiting to be started"
- Automation: None

**Column 2: 🔨 In Progress**
- Description: "Currently being coded"
- Automation: Auto-move when issue assigned

**Column 3: 👀 In Review**
- Description: "PR opened, awaiting review"
- Automation: Auto-move when PR opened

**Column 4: ✅ Done**
- Description: "PR merged, test passing"
- Automation: Auto-move when PR merged and closed

### Add Test Cases

Create 8 issues (or use existing Issue #962 sub-tasks):

```markdown
Title: [L4] Line chart quarterly export
Labels: test-case, line-chart
Assigned to: @adam

Title: [L10] Line chart flow & raw units  
Labels: test-case, line-chart
Assigned to: @livia

Title: [B8] Bar chart weekly export
Labels: test-case, bar-chart
Assigned to: @tam

Title: [L21] Line chart groups
Labels: test-case, line-chart, groups
Assigned to: @vy

... (continue for all 8 tests)
```

---

## 🔧 Branch Protection Setup

Protect `development` branch to enforce code review:

1. **Go to**: Settings → Branches
2. **Add rule** for `development`
3. **Enable**:
   - ✅ Require pull request before merging
   - ✅ Require approvals (1 minimum)
   - ✅ Dismiss stale PR approvals when new commits are pushed
   - ✅ Require status checks to pass (if CI set up)
   - ✅ Require branches to be up to date before merging
4. **Save**

**Result**: No one can push directly to `development` - must use PRs!

---

## 📊 Tracking Progress

### Daily Check (Each Student)

**Morning:**
```
1. Check Discord #standups
2. Check GitHub project board
3. Check assigned issues
```

**During Work:**
```
1. Move card to "In Progress"
2. Update issue with progress notes
3. Post in #blockers if stuck
```

**End of Day:**
```
1. Post standup in Discord
2. Push commits to branch
3. Update issue status
```

### Weekly Check (Whole Team)

**Monday:**
```
- Review TEAM_TIMELINE.md
- Update test status table
- Plan week's tests
```

**Friday:**
```
- Count completed tests
- Celebrate merged PRs
- Plan next week (if needed)
```

---

## 🎯 Success Metrics

### Week 1 Goals

- ✅ All 4 students have environment working
- ✅ All 4 students have created at least 1 branch
- ✅ At least 2 PRs opened
- ✅ At least 1 PR merged
- ✅ Daily standups happening
- ✅ No one blocked >24 hours

### Week 2 Goals

- ✅ All 8 tests implemented
- ✅ All 8 PRs merged
- ✅ All tests passing in CI
- ✅ Documentation updated
- ✅ Team retrospective complete

### Bonus Goals

- 🌟 Students helped each other (pair programming)
- 🌟 Code review comments were constructive
- 🌟 No merge conflicts (or resolved well)
- 🌟 Students learned something new
- 🌟 Work quality good enough to submit to main OED

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────┐
│  Student Workflow (Feature Branching)              │
└─────────────────────────────────────────────────────┘

1. Clone OED-dungo
   ↓
2. Create feature branch
   ↓
3. Implement test
   ↓
4. Commit & push to branch
   ↓
5. Open PR (feature → development)
   ↓
6. Team reviews PR
   ↓
7. Make changes if needed
   ↓
8. PR approved & merged
   ↓
9. Delete feature branch
   ↓
10. Start next test (back to step 2)


┌─────────────────────────────────────────────────────┐
│  GitHub Project Board Flow                         │
└─────────────────────────────────────────────────────┘

📋 Backlog
   ↓ (Student assigns themselves)
🔨 In Progress
   ↓ (Student opens PR)
👀 In Review
   ↓ (PR approved & merged)
✅ Done


┌─────────────────────────────────────────────────────┐
│  Communication Flow                                │
└─────────────────────────────────────────────────────┘

Student gets stuck
   ↓
Posts in Discord #blockers
   ↓
Team responds with help
   ↓
Mentor helps if >1 hour stuck
   ↓
Problem solved
   ↓
Update posted in #blockers
```

---

## 📚 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| **FORK_WORKFLOW.md** | Full Git/fork explanation | All (detailed reference) |
| **QUICK_START.md** | Get started in 2 hours | All (first read) |
| **PROJECT_MANAGEMENT.md** | Daily workflow & tools | All (daily reference) |
| **TEAM_PROFILES.md** | Member info & strategies | Mentor (planning) |
| **TEAM_ASSESSMENT.md** | Skill assessment survey | Mentor (pre-kickoff) |
| **TEAM_TIMELINE.md** | Gantt chart & milestones | All (progress tracking) |
| **DISCORD_SETUP.md** | Discord configuration | Mentor (setup) |
| **TOOL_COMPARISON.md** | GitHub vs ClickUp | Mentor (decision making) |
| **WORKFLOW_SUMMARY.md** | This file! | All (quick reference) |

---

## 🚀 Next Steps for Mentor

### Before Kickoff
- [ ] Review FORK_WORKFLOW.md
- [ ] Set up GitHub Project board (Kanban)
- [ ] Set branch protection on `development`
- [ ] Add students as collaborators
- [ ] Create Discord server
- [ ] Send TEAM_ASSESSMENT.md survey

### During Kickoff
- [ ] Explain fork vs branch workflow
- [ ] Demo Git workflow (clone, branch, commit, PR)
- [ ] Show GitHub project board
- [ ] Assign initial tests
- [ ] Do first standup together

### After Kickoff
- [ ] Monitor daily standups
- [ ] Review PRs promptly
- [ ] Help with blockers
- [ ] Update timeline weekly
- [ ] Celebrate wins!

---

## 💡 Why This Setup Works

### ✅ Educational Benefits
- Students learn real team workflows
- Safe environment to make mistakes
- Portfolio-worthy open-source contributions
- Proper Git/GitHub practices

### ✅ Practical Benefits
- Simple enough for 2 weeks
- Minimal overhead
- Easy progress tracking
- Clear responsibilities

### ✅ Professional Benefits
- Matches industry practices
- Good for resumes/interviews
- Real code review experience
- Team collaboration skills

---

## 🎯 The One-Sentence Summary

**Students clone the shared sandbox (`aldungo/OED-dungo`), work on feature branches, open PRs for review, and use a Kanban board to track progress - just like a real software team!**

---

*Last Updated: November 9, 2025*

**Questions?** See [FORK_WORKFLOW.md](FORK_WORKFLOW.md) for detailed explanations.
