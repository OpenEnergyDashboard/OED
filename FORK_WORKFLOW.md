# 🔱 Fork Workflow & Repository Structure

> **Important**: This is a LEARNING SANDBOX - OED-dungo is a fork of the main OED project

---

## 📚 Repository Relationship

```
OpenEnergyDashboard/OED (Original/Upstream)
         ↓ (forked by Dungo)
    aldungo/OED-dungo (Our Sandbox)
         ↓ (students work here via branches)
    Student branches (feature/test-L4, feature/test-B8, etc.)
```

### What This Means

**Original Project:**
- 🏛️ **Repository**: https://github.com/OpenEnergyDashboard/OED
- 🎯 **Purpose**: Production open-source energy dashboard
- 👥 **Community**: Large community of contributors
- 📜 **Rules**: Strict code review, CLA required, formal contribution process

**Our Sandbox (OED-dungo):**
- 🎓 **Repository**: https://github.com/aldungo/OED-dungo
- 🎯 **Purpose**: Learning environment for MicroInternship students
- 👥 **Team**: 4 students + 1 mentor (Dungo)
- 🧪 **Rules**: Relaxed, focus on learning, safe space to make mistakes

---

## 🤔 Why Use a Fork?

### ✅ Benefits of This Approach

1. **Safe Learning Environment**
   - Students can't accidentally break the main OED project
   - Freedom to experiment without fear
   - Can reset/force-push if needed (learning git)
   - No need to worry about production impact

2. **Real-World Practice**
   - Same workflow as contributing to any open-source project
   - Learn proper fork → branch → PR → merge cycle
   - Understand upstream/origin relationship
   - Portfolio-worthy: Shows real open-source contribution flow

3. **Controlled Scope**
   - Focus only on Issue #962 (test cases)
   - No distractions from other ongoing OED work
   - Clear beginning and end point
   - Easier to track student progress

4. **Future Contribution Path**
   - If work is good, can be submitted to main OED later
   - Students learn how to contribute to original project
   - Demonstrates professional open-source workflow
   - Can reference in resumes/portfolios

---

## 👥 Student Workflow: No Individual Forks Needed

### ❌ Students Should NOT Fork OED-dungo

**Why not?**
- Adds unnecessary complexity (fork of a fork)
- Makes code review harder (scattered across repos)
- Complicates the PR process
- Harder for team to collaborate
- Not how teams work in real companies

### ✅ Students Work Directly on OED-dungo via Branches

**The Right Way:**

```bash
# 1. Student clones the sandbox repo
git clone https://github.com/aldungo/OED-dungo.git

# 2. Student creates feature branch
git checkout -b feature/test-L4-adam

# 3. Student makes changes and commits
git add .
git commit -m "Implement test case L4"

# 4. Student pushes branch to origin (OED-dungo)
git push origin feature/test-L4-adam

# 5. Student opens PR on GitHub (within OED-dungo)
# From: feature/test-L4-adam → To: development
```

**This simulates real team development:**
- All working in same repository ✅
- Branch protection on `main`/`development` ✅
- Code reviews before merging ✅
- CI/CD runs on PRs ✅
- Team can see each other's work ✅

---

## 🌿 Branching Strategy

### **Option 1: Feature Branching** (RECOMMENDED)

Best for small teams, short projects, continuous integration.

**Structure:**
```
main/development (protected)
  ├── feature/test-L4-adam
  ├── feature/test-L10-livia
  ├── feature/test-B8-tam
  └── feature/test-LG4-vy
```

**Workflow:**
1. Create feature branch from `development`
2. Implement test case
3. Open PR to `development`
4. Review + merge
5. Delete feature branch

**Pros:**
- ✅ Simple and fast
- ✅ Easy to understand
- ✅ Continuous integration
- ✅ Good for learning
- ✅ Matches industry practice

**Cons:**
- ⚠️ All changes go straight to development
- ⚠️ Less structure for releases

**Best for:**
- 2-week projects ⭐
- Small teams (2-5 people) ⭐
- Learning environments ⭐
- Non-production codebases ⭐

---

### **Option 2: GitFlow** (Feature + Release Branches)

More structured, better for production releases, more complex.

**Structure:**
```
main (production-ready)
  ↑
release/v1.0 (preparing release)
  ↑
development (integration)
  ├── feature/test-L4-adam
  ├── feature/test-L10-livia
  ├── feature/test-B8-tam
  └── feature/test-LG4-vy
```

**Workflow:**
1. Create feature branch from `development`
2. Implement test case
3. PR to `development`
4. When ready for release, create `release/v1.0` from `development`
5. Test and fix bugs in release branch
6. Merge to `main` + tag version
7. Merge back to `development`

**Pros:**
- ✅ Clear release process
- ✅ Can prepare release while developing next features
- ✅ Production-like workflow
- ✅ Good for portfolios

**Cons:**
- ⚠️ More complex
- ⚠️ Overkill for 2-week project
- ⚠️ More merge conflicts
- ⚠️ Steeper learning curve

**Best for:**
- Production software
- Large teams
- Multiple releases
- Enterprise environments

---

## 🎯 Recommendation for Your Team

### **Use Feature Branching (Option 1)** ⭐

**Why?**
1. **2-week timeline** - No time for complex GitFlow
2. **Learning focus** - Keep it simple, focus on core Git skills
3. **4 people** - Small enough to not need heavy process
4. **Sandbox environment** - Not production, less risk
5. **Clear goal** - 8 test cases, then done

**What Students Learn:**
- ✅ Branch creation
- ✅ Commits and commit messages
- ✅ Pull requests
- ✅ Code reviews
- ✅ Merge conflict resolution
- ✅ CI/CD (tests running on PRs)

This is **exactly** what they'll use at most companies! 🎯

---

## 🎨 GitHub Project Board Setup

With Feature Branching, use **Kanban board**:

### Kanban Columns

```
📋 Backlog → 🔍 In Progress → 👀 In Review → ✅ Done
```

**Backlog:**
- Test L4: Line chart quarterly export
- Test L10: Line chart flow & raw units
- Test B8: Bar chart weekly export
- Test L21: Line chart groups
- Test L23: Line chart 4 weeks
- Test LG4: Line chart group flow
- Test LG21: Line chart group quantity
- Test C9: Compare chart meters

**In Progress:**
- Card moves here when student starts (branch created)
- Shows who's working on what

**In Review:**
- Card moves here when PR opened
- Link PR to card
- Shows what needs code review

**Done:**
- Card moves here when PR merged
- Celebration time! 🎉

---

## 📊 Feature Release Board (Alternative)

If you wanted to try GitFlow (not recommended for 2 weeks), you'd use:

```
📋 To Do → 🔨 Development → 🧪 Testing → 🚀 Release Ready → ✅ Released
```

**But this is overkill for your project.**

---

## 🔧 Git Commands Students Need to Know

### Essential (Must Know)

```bash
# Clone the repo
git clone https://github.com/aldungo/OED-dungo.git

# Create and switch to new branch
git checkout -b feature/test-L4-adam

# Check status
git status

# Stage changes
git add src/server/test/web/readingsLineTest.js

# Commit
git commit -m "Add test case L4 for quarterly line export"

# Push to remote
git push origin feature/test-L4-adam

# Pull latest changes from development
git checkout development
git pull origin development

# Update feature branch with latest development
git checkout feature/test-L4-adam
git merge development
```

### Nice to Have (Will Learn)

```bash
# Stash changes temporarily
git stash
git stash pop

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Resolve merge conflicts
# (handled manually in files, then:)
git add .
git commit -m "Resolve merge conflicts"
```

### Advanced (Don't Need Yet)

```bash
# Interactive rebase
git rebase -i HEAD~3

# Cherry-pick commits
git cherry-pick abc123

# Sync with upstream (for you, not students)
git fetch upstream
git merge upstream/development
```

---

## 🎓 Teaching Git: Step-by-Step

### Week 1, Day 1: The Basics

**Live demo for students:**

```bash
# 1. Show them the GitHub repo
https://github.com/aldungo/OED-dungo

# 2. Clone together
git clone https://github.com/aldungo/OED-dungo.git
cd OED-dungo

# 3. Show branches
git branch -a

# 4. Create feature branch together
git checkout -b feature/test-example-adam
git push origin feature/test-example-adam

# 5. Make a small change (add comment to a file)
# 6. Commit and push
git add .
git commit -m "Test commit for learning"
git push origin feature/test-example-adam

# 7. Show them how to open PR on GitHub
# 8. Walk through PR review
# 9. Merge it
# 10. Delete branch
```

**They'll understand the full cycle!**

---

## 🚨 Common Git Issues & Solutions

### Issue 1: "I committed to the wrong branch"

```bash
# If you committed to 'development' instead of your feature branch:

# 1. Create the feature branch (it will have your commits)
git checkout -b feature/test-L4-adam

# 2. Go back to development
git checkout development

# 3. Reset development to match remote
git reset --hard origin/development

# 4. Go back to feature branch and push
git checkout feature/test-L4-adam
git push origin feature/test-L4-adam
```

### Issue 2: "Merge conflicts!"

```bash
# 1. Pull latest development
git checkout development
git pull origin development

# 2. Go to your branch
git checkout feature/test-L4-adam

# 3. Merge development into your branch
git merge development

# 4. Git will show conflicts - open files and fix them
# Look for <<<<<<< HEAD and >>>>>>> development

# 5. After fixing, stage and commit
git add .
git commit -m "Resolve merge conflicts with development"
git push origin feature/test-L4-adam
```

### Issue 3: "I need to undo everything"

```bash
# Discard all local changes
git reset --hard HEAD

# Or discard changes to specific file
git checkout -- src/server/test/web/mytest.js
```

---

## 🎯 Branch Naming Convention

### Format: `type/issue-description-name`

**Examples:**
- `feature/test-L4-adam`
- `feature/test-B8-tam`
- `bugfix/test-L10-typo-livia`
- `docs/update-readme-vy`

**Rules:**
- Use lowercase
- Use hyphens (not underscores)
- Include your name (for clarity)
- Be descriptive but concise

---

## 📋 Pull Request Template

When students open PRs, they should include:

```markdown
## Test Case Implementation

**Test ID:** L4
**Test Type:** Line chart
**Author:** @adam

### Changes Made
- [ ] Implemented test case L4
- [ ] Generated expected CSV file
- [ ] Added test to test suite
- [ ] Verified test passes locally

### Testing
```bash
npm test -- --grep "L4"
```

### Checklist
- [ ] Code follows project style
- [ ] Test passes locally
- [ ] Expected CSV file committed
- [ ] No console errors

### Questions/Notes
Any issues or questions that came up during implementation.
```

---

## 🔄 Keeping Fork in Sync (Mentor Only)

As the mentor, you may want to sync with upstream OED occasionally:

```bash
# 1. Check remotes
git remote -v
# Should show:
# origin    https://github.com/aldungo/OED-dungo.git
# upstream  https://github.com/OpenEnergyDashboard/OED.git

# 2. Fetch from upstream
git fetch upstream

# 3. Merge upstream changes
git checkout development
git merge upstream/development

# 4. Push to your fork
git push origin development
```

**Note:** Only do this if you need new features from main OED. For a 2-week project, you probably don't need to.

---

## 🎉 Summary

### ✅ What We're Doing

- Using **aldungo/OED-dungo** as learning sandbox (fork of main OED)
- Students work via **branches** (not individual forks)
- Using **Feature Branching** workflow (simple, effective)
- Using **Kanban board** for tracking (not GitFlow release board)

### ✅ Why This Works

- Safe environment to learn and make mistakes
- Real-world team collaboration workflow
- Simple enough for 2-week project
- Professional enough for portfolios
- Easy to potentially contribute to main OED later

### ✅ What Students Learn

- Professional Git workflow (branch, commit, PR, review, merge)
- Team collaboration in one repository
- Code review process
- CI/CD integration
- Merge conflict resolution

**Perfect balance of learning and simplicity!** 🎯

---

## 📚 Additional Resources

**For Students:**
- [Git Branching Tutorial](https://learngitbranching.js.org/)
- [Pull Request Best Practices](https://github.com/blog/1943-how-to-write-the-perfect-pull-request)
- [Markdown Guide](https://www.markdownguide.org/)

**For Mentor:**
- [Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow)
- [GitFlow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Managing Fork Sync](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork)

---

*Last Updated: November 9, 2025*
