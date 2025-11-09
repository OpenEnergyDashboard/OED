# 🚀 Quick Start: Team Setup Checklist

> **Goal**: Get your team up and running in 2 hours

---

## 📋 Pre-Work (Before Team Meeting)

### Mentor/Lead Tasks (You - 1 hour)

- [ ] **GitHub Repository**
  - [ ] Verify all team members have repo access (as collaborators)
  - [ ] Review all created files in `.github/` directory
  - [ ] Enable GitHub Projects for the repo
  - [ ] Explain fork relationship (see FORK_WORKFLOW.md)
  - [ ] Set branch protection on `development` branch
  
- [ ] **Discord Server**
  - [ ] Create Discord server
  - [ ] Create channels (see DISCORD_SETUP.md)
  - [ ] Set up GitHub webhook
  - [ ] Add GitHub bot
  - [ ] Invite team members

- [ ] **Documentation Review**
  - [ ] Read PROJECT_MANAGEMENT.md
  - [ ] Read TEAM_TIMELINE.md
  - [ ] Customize with your team's info
  - [ ] Add team member names and availability

- [ ] **Test Case Assignment**
  - [ ] Review available tests
  - [ ] Suggest initial assignments
  - [ ] Update TEAM_TIMELINE.md

---

## 🎯 Team Kickoff Meeting (1 hour)

### Agenda

**1. Introductions (10 min)**
```
Each person shares:
- Name & background
- Timezone & availability
- Experience level
- Preferred communication style
- Questions/concerns
```

**2. Project Overview (15 min)**
```
Share screen: PROJECT_MANAGEMENT.md
- What are we building?
- Why does it matter?
- What will we learn?
- Timeline & milestones
```

**3. Tools Walkthrough (15 min)**
```
Live demo:
- GitHub Projects board
- Discord channels
- Issue templates
- PR process
- Automation features
```

**4. Test Assignment (10 min)**
```
Review TEAM_TIMELINE.md
- Each person claims 2 tests
- Discuss difficulty levels
- Balance workload
- Set Week 1 goals
```

**5. Communication Norms (10 min)**
```
Agree on:
- Daily standup timing
- Response time expectations
- How to ask for help
- Availability windows
- Weekly sync time
```

---

## 👥 Individual Setup (Each Team Member - 1 hour)

### Checklist for Each Student

**Environment Setup (30 min)**
```bash
# 1. Clone repo (NOT fork - clone the shared sandbox)
git clone https://github.com/aldungo/OED-dungo.git
cd OED-dungo

# 2. Install dependencies
npm install

# 3. Start Docker database
docker-compose up -d database

# 4. Create database
npm run createdb

# 5. Build frontend (in separate terminal)
npm run webpack:dev

# 6. Start server (in another terminal)
npm run start:dev

# 7. Run tests to verify
npm test

# 8. Create your feature branch
git checkout -b test/YOUR-TEST-ID
```

**Communication Setup (10 min)**
- [ ] Join Discord server
- [ ] Set Discord status with your timezone
- [ ] Post introduction in `#general`
- [ ] Add your availability to pinned message
- [ ] Enable notifications for @mentions

**Documentation Reading (15 min)**
- [ ] Read PROJECT_MANAGEMENT.md
- [ ] Read test documentation
- [ ] Review your assigned test details
- [ ] Bookmark important links

**First Task (5 min)**
- [ ] Comment on GitHub Issue #962 claiming your test
- [ ] Create GitHub issue using template
- [ ] Update TEAM_TIMELINE.md with your status
- [ ] Post in Discord `#test-progress`

---

## 🔧 Technical Setup Verification

Run these commands to verify setup:

```bash
# Test that database is running
npm run testdb

# Test that server starts
npm start

# Test that tests run
npm test

# Test that linting works
npm run lint

# Test that TypeScript compiles
npm run checkTypescript
```

**All passing?** ✅ You're ready!

**Something failing?** 🚨 Post in Discord `#blockers`

---

## 📱 Day 1 Action Items

### For Everyone

**Morning:**
- [ ] Environment setup complete
- [ ] Communication channels joined
- [ ] Documentation read
- [ ] First test claimed

**Afternoon:**
- [ ] Review similar completed test
- [ ] Identify units and conversions needed
- [ ] Locate expected CSV file
- [ ] Ask questions in Discord

**Evening:**
- [ ] Start implementing test
- [ ] Post first standup in Discord
- [ ] Update GitHub issue progress

---

## 🎬 Week 1 Kickoff

### Monday Goals (Whole Team)

- [ ] All 4 members: Environment set up
- [ ] All 4 members: First test claimed
- [ ] All 4 members: First standup posted
- [ ] Team: Communication norms established
- [ ] Lead: GitHub Actions working
- [ ] Lead: Discord webhooks active

### Tuesday-Thursday Goals

- [ ] Each member: Make progress on Test 1
- [ ] Each member: Daily standups
- [ ] Each member: Help at least 1 teammate
- [ ] Team: First PR opened

### Friday Goals

- [ ] Each member: Test 1 complete or nearly done
- [ ] Team: First PR merged
- [ ] Team: Weekly sync meeting
- [ ] Team: Celebrate first win! 🎉

---

## 📊 Success Metrics (End of Week 1)

### Team Health
- [ ] All 4 members active and engaged
- [ ] Daily standups happening
- [ ] Questions being asked and answered
- [ ] No one blocked >24 hours

### Technical Progress
- [ ] At least 2 tests implemented
- [ ] At least 1 PR merged
- [ ] All tests passing in CI
- [ ] No major blockers

### Process
- [ ] GitHub Actions working
- [ ] Discord integration active
- [ ] Code reviews happening
- [ ] Timeline being updated

---

## 🆘 Troubleshooting

### Common Setup Issues

**Database won't start:**
```bash
# Check if Docker is running
docker ps

# Restart database
docker-compose down
docker-compose up -d database

# Check logs
docker-compose logs database
```

**Node modules error:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Tests failing:**
```bash
# Make sure database is created
npm run createdb

# Check if test database exists
npm run testdb
```

**Webpack build failing:**
```bash
# Clear cache
rm -rf .cache

# Rebuild
npm run webpack:dev
```

### Getting Help

**1. Check existing resources:**
- Search Discord history
- Review similar tests
- Check GitHub issue comments

**2. Ask the team:**
- Post in Discord `#blockers`
- Include error message
- Share what you've tried
- Tag specific member if relevant

**3. Debug together:**
- Schedule pair programming
- Screen share in Discord voice
- Work through problem together

---

## 📝 Daily Standup Template

Post in Discord `#standups` each day:

```
📅 Standup - [Your Name] - [Date]

✅ Yesterday:
- [What you completed]

🔨 Today:
- [What you're working on]

🚧 Blockers:
- [Any issues or "None"]

⏱️ Hours worked: [X]
```

---

## 🎯 First Week Schedule

### Monday
- **Morning**: Kickoff meeting (1 hour)
- **Afternoon**: Individual setup (1-2 hours)
- **Evening**: Start first test

### Tuesday-Thursday
- **Daily**: Work on test (2-3 hours/day)
- **Daily**: Post standup
- **As needed**: Ask for help

### Friday
- **Morning**: Finish test or get close
- **Afternoon**: Create PR if ready
- **Evening**: Weekly sync (30 min)

---

## ✅ Checklist Status

Track your progress:

### Setup Phase
- [ ] Repo access confirmed
- [ ] Discord joined
- [ ] Environment working
- [ ] Documentation read

### Active Phase
- [ ] Test claimed
- [ ] Issue created
- [ ] Branch created
- [ ] Making progress

### Completion Phase
- [ ] Test implemented
- [ ] PR created
- [ ] Review requested
- [ ] PR merged

---

## 🎉 Celebration Moments

Don't forget to celebrate:

### Individual
- ✨ Environment setup complete
- ✨ First test claimed
- ✨ First commit
- ✨ First PR
- ✨ First merge

### Team
- 🎊 Everyone set up
- 🎊 First PR merged
- 🎊 25% complete (2/8)
- 🎊 50% complete (4/8)
- 🎊 All tests complete!

Post in Discord `#general` when these happen!

---

## 📞 Team Contact Card

Fill this out during kickoff:

```markdown
# Team Contact Info

## Member 1: [Name]
- GitHub: @username
- Discord: user#1234
- Timezone: EST
- Available: Mon-Wed 6-9pm
- Tests: L4, L21

## Member 2: [Name]
- GitHub: @username
- Discord: user#5678
- Timezone: PST
- Available: Tue-Thu 5-8pm
- Tests: L10, L23

## Member 3: [Name]
- GitHub: @username
- Discord: user#9012
- Timezone: CST
- Available: Mon-Fri 7-9am
- Tests: B8, B9

## Member 4: [Name]
- GitHub: @username
- Discord: user#3456
- Timezone: EST
- Available: Wed-Sat 8-10pm
- Tests: LG4, LG21

## Best Meeting Times
- Wednesday 6-8pm EST (3/4 members)
- Saturday afternoon (3/4 members)
```

---

## 🚀 Ready to Launch?

**Before you start:**
- [ ] This checklist complete
- [ ] Team has met
- [ ] Everyone has access
- [ ] First tests assigned
- [ ] Communication working

**Let's do this! 💪**

Post in Discord `#general`:
```
🚀 Team kickoff complete!

✅ All members set up
✅ Tests assigned
✅ Ready to code

Let's ship 8 tests! 🎯
```

---

## 📚 Quick Reference Links

**During Development:**
- [PROJECT_MANAGEMENT.md](./PROJECT_MANAGEMENT.md) - Full PM guide
- [TEAM_TIMELINE.md](./TEAM_TIMELINE.md) - Timeline & progress
- [DISCORD_SETUP.md](./DISCORD_SETUP.md) - Discord guide

**For Decisions:**
- [TOOL_COMPARISON.md](./TOOL_COMPARISON.md) - GitHub vs ClickUp
- [CLICKUP_GUIDE.md](./CLICKUP_GUIDE.md) - Optional ClickUp setup

**Test Documentation:**
- Test implementation guide (link)
- GitHub Issue #962 (link)
- Expected CSV files (link)

---

**Questions?** Ask in Discord `#general`!

**Ready to code?** Check [TEAM_TIMELINE.md](./TEAM_TIMELINE.md) for your assignment!

*Let's build something awesome together! 🔥*
