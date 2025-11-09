# OED Test Case Team - Project Management Hub

> **Project**: Implement OED reading test cases  
> **Team**: 4 members  
> **Duration**: 2 weeks  
> **Goal**: Complete 8 test cases with full CI/CD automation

**📌 Important**: This is a learning sandbox! `aldungo/OED-dungo` is a fork of the main [OpenEnergyDashboard/OED](https://github.com/OpenEnergyDashboard/OED) project. Students work via **branches** in this shared repository (NOT individual forks). See [FORK_WORKFLOW.md](FORK_WORKFLOW.md) for details.

---

## 📚 Quick Links

| Resource | Link | Purpose |
|----------|------|---------|
| 🎯 **Project Board** | [GitHub Projects](../../projects) | Task tracking & workflow |
| 📊 **Timeline** | [TEAM_TIMELINE.md](./TEAM_TIMELINE.md) | Gantt chart & milestones |
| 💬 **Discord** | [Setup Guide](./DISCORD_SETUP.md) | Team communication |
| 📋 **ClickUp** | [Integration Guide](./CLICKUP_GUIDE.md) | Optional PM tool |
| 🔧 **Test Docs** | [OED Docs](link) | Test implementation guide |
| 🐛 **Issue Tracker** | [GitHub Issue #962](https://github.com/OpenEnergyDashboard/OED/issues/962) | Test case allocation |

---

## 🚀 Getting Started

### New Team Member Onboarding (Day 1)

**Step 1: Environment Setup (1-2 hours)**
```bash
# Clone repository (NOT fork - clone the shared sandbox)
git clone https://github.com/aldungo/OED-dungo.git
cd OED-dungo

# Install dependencies
npm install

# Set up database
docker-compose up -d database
npm run createdb

# Build frontend
npm run webpack:dev

# Run server
npm run start:dev

# Verify tests run
npm test
```

**Step 2: Join Communication Channels**
- [ ] Join Discord server (see [DISCORD_SETUP.md](./DISCORD_SETUP.md))
- [ ] Introduce yourself in `#general`
- [ ] Review pinned resources in `#resources`
- [ ] Post availability schedule

**Step 3: Claim Your First Test**
- [ ] Read test documentation thoroughly
- [ ] Pick an available test from [TEAM_TIMELINE.md](./TEAM_TIMELINE.md)
- [ ] Comment on [Issue #962](https://github.com/OpenEnergyDashboard/OED/issues/962)
- [ ] Create GitHub issue using template
- [ ] Update timeline with your assignment

**Step 4: Implement Your Test** (3-4 hours)
- [ ] Follow test implementation checklist
- [ ] Run test locally
- [ ] Create pull request
- [ ] Request code review

---

## 📁 Repository Structure

```
OED-dungo/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── test-case.md              # Test case issue template
│   └── workflows/
│       └── test-case-automation.yml  # GitHub Actions automation
│
├── src/
│   ├── server/
│   │   ├── test/
│   │   │   ├── web/
│   │   │   │   ├── readingsLineMeterQuantity.js   # Line quantity tests
│   │   │   │   ├── readingsLineMeterFlow.js       # Line flow tests
│   │   │   │   ├── readingsBarMeterQuantity.js    # Bar quantity tests
│   │   │   │   ├── readingsCompareMeterQuantity.js # Compare tests
│   │   │   │   ├── readings3DMeterQuantity.js     # 3D tests
│   │   │   │   └── readingsData/                  # Expected CSV files
│   │   │   └── util/
│   │   │       └── readingsUtils.js               # Test helper functions
│   │   └── routes/
│   │       └── unitReadings.js                    # API routes being tested
│   └── client/
│       └── app/
│           └── components/                        # React components
│
├── TEAM_TIMELINE.md          # Project timeline & Gantt chart
├── DISCORD_SETUP.md          # Discord server setup guide
├── CLICKUP_GUIDE.md          # ClickUp integration guide (optional)
└── PROJECT_MANAGEMENT.md     # This file
```

---

## 🔄 Workflow Overview

### 1. Pick a Test Case

```
Team Timeline → Available Test → Comment on Issue #962 → Create GitHub Issue
```

### 2. Implement Test

```
Read Docs → Set Up Code → Copy Expected CSV → Write Test → Run Locally
```

### 3. Submit for Review

```
Create PR → Auto-moved to "Testing" → Request Review → CI Checks
```

### 4. Merge & Complete

```
Approval → Merge PR → Auto-moved to "Done" → Discord Notification
```

---

## 🤖 Automation Features

### GitHub Actions Automation

**Automatic Project Board Updates:**
- ✅ New test issue → Moves to "Backlog"
- ✅ Assign to member → Moves to "In Progress"  
- ✅ Open PR → Moves to "Testing"
- ✅ Merge PR → Moves to "Done"

**Discord Notifications:**
- 📝 Test case assigned → Posts to `#test-progress`
- 🔍 PR opened → Posts to `#code-reviews`
- ✅ PR merged → Posts to `#general` (celebration!)

**CI/CD Pipeline:**
- 🧪 Runs all tests on PR
- 🔍 Linting checks
- ✅ Must pass before merge

### Discord Webhook Setup

1. **Get webhook URL:**
   - Discord server → Channel settings → Integrations → Webhooks
   - Copy webhook URL

2. **Add to GitHub:**
   - Repo settings → Secrets and variables → Actions
   - New secret: `DISCORD_WEBHOOK`
   - Paste URL

3. **Done!** Automation will now post to Discord

---

## 📊 Project Tracking

### Daily Workflow

**Morning (5 min):**
1. Check Discord `#standups` for team updates
2. Review GitHub project board for your tasks
3. Check `#blockers` to help teammates

**During Work (ongoing):**
1. Update issue subtasks as you progress
2. Post in `#blockers` if stuck >30 min
3. Commit frequently with clear messages

**End of Day (5 min):**
1. Post standup in Discord `#standups`
2. Update GitHub issue with progress
3. Push code changes

### Weekly Workflow

**Monday:**
- Review timeline in [TEAM_TIMELINE.md](./TEAM_TIMELINE.md)
- Update test status table
- Plan week's work

**Wednesday:**
- Mid-week check-in (async or sync)
- Address any blockers
- Adjust timeline if needed

**Friday:**
- Team sync meeting (30 min)
- Update metrics
- Plan next week

---

## 📈 Metrics & KPIs

Track in [TEAM_TIMELINE.md](./TEAM_TIMELINE.md):

| Metric | Target | Current |
|--------|--------|---------|
| Tests Completed | 8 | 0 |
| Avg Time/Test | 3-4 hrs | TBD |
| Tests Passing | 100% | TBD |
| Code Review Time | <24 hrs | TBD |
| PRs Merged | 8 | 0 |

**Success Criteria:**
- ✅ All 8 tests implemented and passing
- ✅ All code reviewed by peer
- ✅ All PRs merged to development
- ✅ CI/CD pipeline green
- ✅ Documentation updated

---

## 🆘 Getting Help

### Self-Service (Try first)
1. Check existing test implementations as examples
2. Review test documentation
3. Search Discord `#test-progress` history
4. Check GitHub issue comments

### Ask the Team (If still stuck)
1. Post in Discord `#blockers` with context
2. Tag specific member if they have relevant experience
3. Request pair programming session

### Escalation (If urgent)
1. @mention team lead in Discord
2. Schedule emergency sync call
3. Document blocker for retrospective

---

## 🎯 Best Practices

### Code Quality
- ✅ Follow existing test patterns
- ✅ Use meaningful variable names
- ✅ Add comments for complex logic
- ✅ Keep functions focused and small
- ✅ Test locally before PR

### Communication
- ✅ Post daily standups (even if minimal progress)
- ✅ Update issue status regularly
- ✅ Respond to reviews within 24 hours
- ✅ Celebrate team wins
- ✅ Be kind and supportive

### Git Workflow
- ⚠️ **Do NOT fork this repo!** Clone directly and work on branches
- ✅ Branch naming: `feature/test-L4-adam`
- ✅ Commit messages: `feat: Add test L4 for daily points`
- ✅ PR titles: `[L4] Implement daily points test`
- ✅ Link issue in PR: `Closes #123`
- ✅ Request review from 1-2 teammates
- 📖 Full workflow guide: [FORK_WORKFLOW.md](FORK_WORKFLOW.md)

---

## 🎓 Learning Objectives

By completing this project, you'll learn:

**Technical Skills:**
- ✅ Backend API testing with Mocha/Chai
- ✅ Working with time-series data
- ✅ Unit conversions and aggregations
- ✅ Test-driven development (TDD)

**Collaboration Skills:**
- ✅ Async team coordination
- ✅ Code review process
- ✅ GitHub project management
- ✅ CI/CD workflows

**Project Management:**
- ✅ Sprint planning
- ✅ Task estimation
- ✅ Progress tracking
- ✅ Risk management

---

## 📅 Meeting Schedule

### Weekly Team Sync (30 min)
**When**: [TBD based on team availability]  
**Where**: Discord 🔊 Team Sync  
**Format**:
1. Progress updates (5 min)
2. Demo completed tests (10 min)
3. Discuss blockers (10 min)
4. Plan next week (5 min)

### Optional Office Hours
**When**: [TBD]  
**Where**: Discord 🔊 Pair Programming  
**Purpose**: Drop-in debugging help

---

## 🔍 Code Review Guidelines

### As Author
- ✅ Self-review before requesting review
- ✅ Test passes locally
- ✅ Write clear PR description
- ✅ Link to issue
- ✅ Respond to feedback constructively

### As Reviewer
- ✅ Review within 24 hours
- ✅ Test the code locally
- ✅ Check against test documentation
- ✅ Provide constructive feedback
- ✅ Approve when satisfied

**Review Checklist:**
- [ ] Test follows existing patterns
- [ ] Units/conversions correctly configured
- [ ] Expected CSV file in correct location
- [ ] Test passes locally
- [ ] Code is readable and commented
- [ ] No eslint errors

---

## 🎉 Celebration Points

Let's celebrate achievements in Discord `#general`:

**Individual Wins:**
- 🎯 First test implemented
- ✅ First PR merged
- 🐛 Helped teammate debug
- 📚 Learned new concept

**Team Milestones:**
- 🎊 25% complete (2/8 tests)
- 🎊 50% complete (4/8 tests)
- 🎊 75% complete (6/8 tests)
- 🎉 100% complete (8/8 tests)
- 🏆 All PRs merged
- 🚀 Project complete!

---

## 🔄 Retrospective (End of Sprint)

**When**: After all tests merged  
**Format**: Discord text or sync call

**Discuss:**
1. What went well? 🎉
2. What could be improved? 🔧
3. What did we learn? 📚
4. What should we do differently next time? 💡

**Document in**: `RETROSPECTIVE.md`

---

## 📞 Team Contacts

| Member | GitHub | Discord | Timezone | Availability |
|--------|--------|---------|----------|--------------|
| Member 1 | @user1 | user1#1234 | EST | Mon-Wed 6-9pm |
| Member 2 | @user2 | user2#5678 | PST | Tue-Thu 5-8pm |
| Member 3 | @user3 | user3#9012 | CST | Mon-Fri 7-9am |
| Member 4 | @user4 | user4#3456 | EST | Wed-Sat 8-10pm |

---

## 🛠️ Tools & Technologies

**Development:**
- Node.js + Express (Backend)
- React + TypeScript (Frontend)
- PostgreSQL (Database)
- Mocha + Chai (Testing)
- Docker (Containerization)

**Project Management:**
- GitHub Projects (Task tracking)
- GitHub Actions (CI/CD)
- Discord (Communication)
- Markdown (Documentation)

**Optional:**
- ClickUp (Advanced PM - see CLICKUP_GUIDE.md)

---

## 📖 Additional Resources

**OED Documentation:**
- [Developer Guide](https://openenergydashboard.org/developer/)
- [Testing Documentation](link)
- [API Documentation](link)

**Learning Resources:**
- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

**Team Resources:**
- [Test Documentation](link-to-full-doc)
- [Expected CSV Files](link)
- [GitHub Issue #962](https://github.com/OpenEnergyDashboard/OED/issues/962)

---

## ❓ FAQ

**Q: How do I claim a test case?**  
A: Comment on [Issue #962](https://github.com/OpenEnergyDashboard/OED/issues/962) saying "I'm working on test [ID]", then create a GitHub issue using our template.

**Q: What if I'm stuck?**  
A: Post in Discord `#blockers` with context. The team will help!

**Q: How long should each test take?**  
A: Typically 3-4 hours including implementation, testing, and PR creation.

**Q: Can I work on multiple tests at once?**  
A: Better to complete one test fully before starting another. Easier to review and merge.

**Q: What if the test fails?**  
A: Double-check your units, conversions, and expected CSV file. If still failing, ask in `#blockers`.

**Q: Do I need to use ClickUp?**  
A: No, it's optional. GitHub Projects is our primary tool.

---

## 🚀 Let's Ship It!

Ready to start? Head to [TEAM_TIMELINE.md](./TEAM_TIMELINE.md) to see available tests and claim yours!

**Remember:**
- 💬 Communicate early and often
- 🤝 Help your teammates  
- 🎯 Focus on quality over speed
- 🎉 Celebrate small wins
- 📚 Learn and grow together

*Good luck team! Let's build something great! 🔥*

---

*Last Updated: 2025-11-09*  
*Questions? Ask in Discord `#general`*
