# 📝 Mentor Cheat Sheet - Quick Answers

> Quick reference for common student questions and situations

---

## 🔥 Most Common Questions

### "Should I fork the repository?"

**Answer:** ❌ **NO!** Don't fork. Just clone it:
```bash
git clone https://github.com/aldungo/OED-dungo.git
```

**Explain:** "We're all working in the same sandbox repo via branches, like a real team. Forking would separate you from the team. See FORK_WORKFLOW.md for why."

---

### "I committed to the wrong branch / I committed to development!"

**Answer:** Don't panic! Easy fix:
```bash
# If you committed to 'development' instead of feature branch:

# 1. Create the feature branch (it will have your commits)
git checkout -b feature/test-L4-adam

# 2. Go back to development
git checkout development

# 3. Reset development to match remote
git reset --hard origin/development

# 4. Go back to feature branch
git checkout feature/test-L4-adam

# 5. Push your feature branch
git push -u origin feature/test-L4-adam
```

**Explain:** "Your commits are safe on the feature branch now, and we reset development to its original state."

---

### "I have merge conflicts!"

**Answer:** Normal! Let's fix them:
```bash
# 1. Update development
git checkout development
git pull origin development

# 2. Go back to your branch
git checkout feature/test-L4-adam

# 3. Merge development into your branch
git merge development
# Git will show conflicts

# 4. Open the conflicted files and look for:
# <<<<<<< HEAD (your changes)
# =======
# >>>>>>> development (their changes)

# 5. Edit the file to keep what you want

# 6. Stage and commit
git add .
git commit -m "Resolve merge conflicts"
git push
```

**Explain:** "Conflicts happen when two people change the same code. Git marks both versions, and you choose what to keep."

---

### "What should my branch be named?"

**Answer:** Use this format:
```
feature/test-[TEST_ID]-[your-name]
```

**Examples:**
- `feature/test-L4-adam`
- `feature/test-B8-tam`
- `feature/test-LG21-livia`

**Explain:** "This tells everyone what you're working on and who you are. Makes it easy to find branches."

---

### "How do I know what test to implement?"

**Answer:** 
1. Check GitHub Project board → Backlog column
2. Look at TEAM_TIMELINE.md for assignments
3. Check Discord pinned message in #test-progress
4. Ask: "Which test should I start with?"

**Explain:** "We divided up 8 tests among 4 people, so each person does 2. Let's make sure you have clear assignments."

---

### "Where do I find the expected CSV file?"

**Answer:** Check the test documentation or existing tests:
```bash
# Look for expected data in similar tests
grep -r "expected" src/server/test/web/

# Expected files are usually in:
src/server/test/web/expectedData/
```

**Explain:** "Each test compares API output to an expected CSV. You'll generate this file using LibreOffice Calc formulas - see test docs."

---

### "My tests are failing!"

**Answer:** Let's debug step by step:
```bash
# 1. Run just your test
npm test -- --grep "L4"

# 2. Check the error message carefully
# Common issues:
# - Expected CSV file missing
# - Expected data doesn't match actual data
# - Database not seeded properly
# - Wrong units or conversions

# 3. Run database seed again if needed
npm run createdb
```

**Explain:** "Test failures are learning opportunities! Let's read the error together and figure out what's expected vs what we're getting."

---

### "How do I run just my test?"

**Answer:**
```bash
# Run one test file
npm test src/server/test/web/readingsLineTest.js

# Run tests matching a pattern
npm test -- --grep "L4"

# Run all tests (to make sure you didn't break anything)
npm test
```

**Explain:** "You can run just your test while developing, but run ALL tests before opening a PR."

---

### "Should I push every commit?"

**Answer:** **Yes!** Push frequently:
```bash
# After each meaningful change
git add .
git commit -m "Add test structure for L4"
git push

# Push again after next change
git commit -m "Add expected CSV for L4"
git push

# Keep pushing!
git commit -m "Fix test assertion"
git push
```

**Explain:** "Frequent pushes = backup in the cloud + team can see your progress + easier to help if you get stuck."

---

### "When should I open a PR?"

**Answer:** **When your test passes locally:**
```bash
# 1. Make sure your test passes
npm test -- --grep "L4"
# ✅ Should show all green

# 2. Make sure all tests pass
npm test
# ✅ Should show all green

# 3. Push final changes
git push

# 4. Open PR on GitHub
# From: feature/test-L4-adam
# To: development
# Title: [L4] Implement quarterly line chart test
```

**Explain:** "Don't wait for perfection, but do make sure tests pass. We can polish during code review."

---

### "Who should review my PR?"

**Answer:** Tag 1-2 teammates:
```markdown
In PR description:
@livia @tam Could you review this? I'd love feedback on:
- Test structure
- Expected CSV generation
- Any edge cases I missed
```

**Explain:** "Pick people who might learn from your code, or who worked on similar tests. Code review is a learning opportunity for everyone!"

---

### "My PR has been approved - now what?"

**Answer:** 
1. **If no changes requested:** Merge it! (or ask mentor to merge)
2. **After merge:** Clean up:
```bash
# Switch back to development
git checkout development

# Pull the merged changes
git pull origin development

# Delete your feature branch
git branch -d feature/test-L4-adam

# Start next test!
git checkout -b feature/test-L21-adam
```

**Explain:** "Merged PRs mean your code is now part of the main project! Celebrate, then start the next test."

---

## 🎯 Quick Standup Examples

### Good Standup ✅
```
📅 Standup - Adam - Nov 10

✅ Yesterday:
- Implemented test L4 structure
- Generated expected CSV with LibreOffice
- Test passing locally

🔨 Today:
- Open PR for L4
- Start research on test L21 (groups)

🚧 Blockers:
- None

⏱️ Hours: 3
```

### Needs Improvement ⚠️
```
Working on stuff.
```

**Better:** Be specific! What stuff? Any progress? Any help needed?

---

## 🚨 When Students Get Stuck

### 🟢 Small Issue (<30 min stuck)
**Student should:**
1. Search Discord history
2. Check similar test files
3. Read error messages carefully
4. Google the error
5. Post in Discord #blockers

### 🟡 Medium Issue (30 min - 2 hours stuck)
**You should:**
1. Review their Discord post
2. Ask clarifying questions
3. Point to resources/examples
4. Pair program if needed (screen share)

### 🔴 Major Blocker (>2 hours stuck)
**You should:**
1. Schedule immediate 1-on-1
2. Screen share and debug together
3. May need to re-assign test (too hard)
4. Check if multiple students have same issue
5. Update documentation to prevent future blocks

---

## 🎨 Code Review Guidelines

### What to Look For

**✅ Must Have:**
- Test structure matches existing tests
- Test passes locally (student confirmed)
- Expected CSV file included
- Clear test description
- No console.logs left in code

**✅ Nice to Have:**
- Good variable names
- Comments explaining complex logic
- Edge cases considered
- Follows project code style

**❌ Don't Nitpick:**
- Minor style differences (if lint passes)
- Personal preferences
- Over-optimization

### Review Comment Templates

**Requesting Changes:**
```markdown
Great start! Before we merge, could you:

1. Add the expected CSV file (I don't see it in the PR)
2. Remove the console.log on line 47
3. Update the test description to match our format

Let me know if you need help with any of these!
```

**Approving:**
```markdown
Nice work! 🎉

I like how you:
- Structured the test clearly
- Handled edge cases for quarterly data
- Generated accurate expected output

One tiny suggestion for next time: Consider extracting the date logic into a helper function if you use it again.

Approved! ✅
```

**Asking Questions:**
```markdown
Looks good overall! Quick question:

On line 82, why did you choose to use `moment.utc()` instead of regular `moment()`? Just curious about the timezone handling.

(Not blocking approval, just learning!)
```

---

## 📊 Progress Tracking

### Daily Check (5 min)

**Morning:**
- Check Discord #standups (everyone posted?)
- Check GitHub PRs (any waiting for review?)
- Check #blockers (anyone stuck?)

**Evening:**
- Review day's commits
- Reply to any questions
- Update TEAM_TIMELINE.md if needed

### Weekly Check (30 min)

**Monday:**
- Review week's goals
- Check test assignments
- Plan any pair programming sessions

**Friday:**
- Count completed tests (celebrate!)
- Update TEAM_TIMELINE.md
- Plan next week
- Weekly sync meeting

---

## 🎯 Week-by-Week Expectations

### Week 1
**Expected:**
- Everyone set up and coding
- 2-4 tests complete
- 1-2 merged PRs
- Students asking questions (good!)
- Some git confusion (normal!)

**Red Flags:**
- Someone can't run OED locally (help immediately)
- No one has pushed code by Wednesday
- Someone silent in Discord for 2+ days

### Week 2
**Expected:**
- 6-8 tests complete
- Multiple merged PRs
- Less questions (more confident)
- Students helping each other
- High energy to finish

**Red Flags:**
- Less than 4 tests done by Monday
- Students overwhelmed
- Git problems still happening
- No communication

---

## 💬 Common Scenarios

### Student: "I don't understand what this test should do"

**Response:**
```
Great question! Let's break down test L4:

1. What it tests: Line chart with quarterly data
2. Input: Meter data with specific readings
3. Output: CSV export with quarterly averages
4. Expected: Compare API output to pre-generated CSV

Want to jump on a call and I'll walk through a similar test?
```

### Student: "I don't have time to finish both tests"

**Response:**
```
No problem! Let's prioritize:

1. Finish your first test completely (better to have 1 done well)
2. If time allows, start the second
3. We can adjust assignments as needed

Which test do you want to focus on? The easier one or the one you're more interested in?
```

### Student: "Someone else's PR broke my test"

**Response:**
```
Ah, this happens! Let's fix it:

1. Pull latest development:
   git checkout development
   git pull origin development

2. Merge into your branch:
   git checkout feature/test-L4-adam
   git merge development

3. Fix any conflicts or test failures
4. Push and update your PR

This is good practice for working on a team!
```

### Student: "I want to contribute to the real OED project"

**Response:**
```
Awesome! That's a great goal! Here's how:

1. Finish your tests in our sandbox first
2. Make sure they're high quality
3. If they're good, we can submit to main OED
4. You'll need to sign their CLA
5. Follow their contribution guidelines

Let's get your current tests polished first, then we can talk about the process!
```

---

## 🎉 Celebration Moments

Don't forget to celebrate:

### Individual Wins
- ✨ First commit
- ✨ First PR
- ✨ First test passing
- ✨ PR merged
- ✨ Helped a teammate

### Team Wins
- 🎊 First PR merged
- 🎊 25% complete (2/8 tests)
- 🎊 50% complete (4/8 tests)
- 🎊 All tests complete!
- 🎊 Zero blockers day

**Post in Discord #general:**
```
🎉 Congrats @adam on your first merged PR!

Test L4 is now part of OED-dungo!

Who's next? 🚀
```

---

## 📚 Quick Resource Links

**For Students:**
- [Git Branching Tutorial](https://learngitbranching.js.org/)
- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/api/assert/)

**For You:**
- [Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/reviewer/)
- [Managing Remote Teams](https://about.gitlab.com/company/culture/all-remote/guide/)

---

## 🆘 Emergency Contacts

**Git Disasters:**
```bash
# EMERGENCY: Reset everything to remote state
git fetch origin
git reset --hard origin/development

# EMERGENCY: Undo last commit (keep changes)
git reset --soft HEAD~1

# EMERGENCY: Completely start over
git checkout development
git pull origin development
git branch -D feature/test-L4-adam
git checkout -b feature/test-L4-adam
```

**When to Intervene Immediately:**
1. Student can't run OED after 1 day
2. Student completely confused about Git
3. Student hasn't communicated in 2+ days
4. Test is way too difficult for skill level
5. Team conflict or communication breakdown

---

*Print this out or keep it handy during the sprint!*

**Questions?** Add them to this cheat sheet as you go!
