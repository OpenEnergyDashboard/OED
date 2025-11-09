# 📊 Initial Team Assessment Questions

> **Purpose**: Gauge team readiness and identify support needs before starting  
> **Timing**: Send before kickoff meeting or during first 15 minutes  
> **Format**: Can be Google Form, Discord survey, or live discussion

---

## 🎯 Assessment Goals

1. ✅ Understand technical skill levels
2. ✅ Identify who needs help with environment setup
3. ✅ Gauge familiarity with OED, Git, and testing
4. ✅ Spot potential blockers early
5. ✅ Tailor onboarding to team needs

---

## 📝 Assessment Survey

### Section 1: OED Familiarity ⭐ CRITICAL

**Q1: Have you explored the OED (Open Energy Dashboard) application?**
- [ ] Yes, I've run it locally and understand what it does
- [ ] Yes, I've looked at it but haven't run it locally yet
- [ ] I've seen screenshots/demos but not used it myself
- [ ] No, this is my first time hearing about it

**Q2: If you've run OED locally, which features have you tested?**
- [ ] Line charts (viewing meter/group data over time)
- [ ] Bar charts (viewing meter/group data in bar format)
- [ ] Compare charts (comparing different time periods)
- [ ] Map view (geographic visualization)
- [ ] Admin features (creating meters, groups, units)
- [ ] Export features (CSV downloads)
- [ ] I haven't run it locally yet

**Q3: Do you understand what OED is used for?**
*(Open-ended - write in your own words)*

```
Example answer: "OED helps organizations track and visualize 
energy consumption data to identify patterns and reduce usage."
```

**Q4: Have you looked at the OED user interface and chart types?**
- [ ] Yes, I'm comfortable navigating the interface
- [ ] I've seen it but need more time to explore
- [ ] Not yet, but I'd like to
- [ ] No

---

### Section 2: Development Environment 🔧 CRITICAL

**Q5: Can you successfully run OED on your local machine?**
- [ ] Yes, everything works perfectly
- [ ] Yes, but I had some issues (describe below)
- [ ] No, I'm stuck on setup (describe blocker below)
- [ ] I haven't tried yet

**If you answered "had issues" or "stuck", please describe:**
```
[Space for details]
```

**Q6: Which parts of the development setup are working for you?**
- [ ] Docker is installed and running
- [ ] Database container starts successfully
- [ ] npm install completed without errors
- [ ] Frontend builds (webpack)
- [ ] Server starts successfully
- [ ] I can access OED at localhost:3000
- [ ] Tests run successfully (npm test)
- [ ] None of the above yet

**Q7: What's your operating system?**
- [ ] macOS (version: ______)
- [ ] Windows (version: ______)
- [ ] Linux (distribution: ______)

**Q8: Any environment setup blockers?**
*(Open-ended)*
```
[Space for details - Docker not starting, npm errors, etc.]
```

---

### Section 3: Git & GitHub Experience 🌿 IMPORTANT

**Q9: How comfortable are you with Git/GitHub?**
- [ ] Very comfortable - I use it regularly
- [ ] Somewhat comfortable - I've done some projects
- [ ] Basic knowledge - I know clone/commit/push
- [ ] New to Git - I need guidance
- [ ] Never used it before

**Q10: Which Git operations have you done before?** (Select all)
- [ ] Clone a repository
- [ ] Create branches
- [ ] Make commits
- [ ] Push to remote
- [ ] Create pull requests
- [ ] Review others' code
- [ ] Resolve merge conflicts
- [ ] Rebase or cherry-pick
- [ ] None of these yet

**Q11: Have you contributed to projects on GitHub before?**
- [ ] Yes, multiple projects
- [ ] Yes, one or two projects
- [ ] No, this will be my first
- [ ] I have a GitHub account but haven't contributed

**Q12: What's your biggest concern about using Git/GitHub?**
*(Open-ended)*
```
Example: "I'm worried about merge conflicts" or 
"I don't understand pull request reviews"
```

---

### Section 4: Testing Knowledge 🧪 IMPORTANT

**Q13: Have you written automated tests before?**
- [ ] Yes, I write tests regularly
- [ ] Yes, a few times in school projects
- [ ] I've seen tests but never written them
- [ ] No, this will be my first time

**Q14: Which testing frameworks/tools have you used?** (Select all)
- [ ] Mocha/Chai (JavaScript)
- [ ] Jest (JavaScript)
- [ ] JUnit (Java)
- [ ] pytest (Python)
- [ ] Other: ____________
- [ ] None yet

**Q15: Do you understand what we're testing in this project?**
- [ ] Yes - We're validating API responses match expected CSV outputs
- [ ] Partially - I understand we're testing something
- [ ] Not yet - I need clarification
- [ ] I'm not sure

**Q16: Have you looked at the example tests in the codebase?**
- [ ] Yes, I've reviewed several test files
- [ ] I've looked at one or two
- [ ] No, but I'd like to know where they are
- [ ] No, not yet

---

### Section 5: JavaScript/Node.js Experience 💻 NICE TO KNOW

**Q17: How comfortable are you with JavaScript/Node.js?**
- [ ] Very comfortable - It's my main language
- [ ] Comfortable - I've built projects with it
- [ ] Learning - I know basics but still growing
- [ ] Beginner - Just started learning
- [ ] Unfamiliar - I mainly use other languages

**Q18: Which JavaScript concepts are you familiar with?** (Select all)
- [ ] Async/await and Promises
- [ ] Arrow functions
- [ ] Array methods (map, filter, reduce)
- [ ] Object destructuring
- [ ] Modules (import/export)
- [ ] Classes
- [ ] Callbacks
- [ ] Not familiar with these yet

**Q19: Have you worked with any of these before?** (Select all)
- [ ] Express.js (backend framework)
- [ ] React (frontend framework)
- [ ] PostgreSQL or other SQL databases
- [ ] Docker
- [ ] npm/yarn package managers
- [ ] None of these

---

### Section 6: Time & Communication ⏰ CRITICAL

**Q20: What's your timezone?**
- [ ] PST (Pacific)
- [ ] MST (Mountain)
- [ ] CST (Central)
- [ ] EST (Eastern)
- [ ] Other: ____________

**Q21: What times are you typically available to work?** (Select all)
- [ ] Early morning (6am-9am)
- [ ] Morning (9am-12pm)
- [ ] Afternoon (12pm-5pm)
- [ ] Evening (5pm-9pm)
- [ ] Late night (9pm-12am)
- [ ] Varies day by day

**Q22: How many hours per week can you dedicate to this project?**
- [ ] 5-10 hours
- [ ] 10-15 hours
- [ ] 15-20 hours
- [ ] 20+ hours
- [ ] It depends on the week

**Q23: What's your preferred communication style?**
- [ ] Async text (Discord, GitHub comments)
- [ ] Quick voice calls when stuck
- [ ] Scheduled video meetings
- [ ] Mix of all - depends on situation

**Q24: How quickly do you typically respond to messages?**
- [ ] Within an hour during my active hours
- [ ] Within a few hours
- [ ] Within 24 hours
- [ ] It varies based on my schedule

---

### Section 7: Learning Goals & Concerns 🎯 IMPORTANT

**Q25: What do you most want to learn from this internship?** (Rank 1-5)
- [ ] Testing and quality assurance practices
- [ ] Git/GitHub workflow and collaboration
- [ ] Working on a large real-world codebase
- [ ] Team communication and project management
- [ ] Specific technical skills (JavaScript, APIs, etc.)

**Q26: What's your biggest concern about this internship?**
*(Open-ended)*
```
Example: "Worried I'm not skilled enough" or 
"Concerned about time management with school"
```

**Q27: How do you learn best?**
- [ ] Documentation and reading
- [ ] Video tutorials
- [ ] Hands-on experimentation
- [ ] Pair programming with others
- [ ] Structured guidance step-by-step
- [ ] Mix of everything

**Q28: When you get stuck, what do you usually do first?**
- [ ] Search documentation/Stack Overflow
- [ ] Experiment and debug on my own
- [ ] Ask for help immediately
- [ ] Take a break and come back
- [ ] Look for similar examples

---

### Section 8: Quick Wins & Readiness ⚡ NICE TO KNOW

**Q29: Have you claimed your first test case yet?**
- [ ] Yes, I know which tests I'm working on
- [ ] Not yet, waiting for assignment
- [ ] I don't know how to claim one

**Q30: What would make you feel ready to start coding?**
*(Open-ended)*
```
Example: "A clear example to follow" or 
"Understanding the test file structure better"
```

**Q31: On a scale of 1-5, how confident are you about starting?**
- [ ] 5 - Very confident, ready to go
- [ ] 4 - Mostly confident, minor questions
- [ ] 3 - Neutral, need some guidance
- [ ] 2 - Not very confident, need support
- [ ] 1 - Not confident at all, need lots of help

---

## 🎨 How to Use This Assessment

### Option 1: Google Form (Recommended)
1. Copy questions into Google Forms
2. Send link before kickoff meeting
3. Review responses before meeting
4. Tailor kickoff based on results

### Option 2: Live Discussion
1. Use as discussion guide during kickoff
2. Go around room for key questions
3. Note who needs what support
4. Follow up individually as needed

### Option 3: Discord Survey
1. Post in Discord as a message
2. Have team members reply in thread
3. Casual but gets the info

---

## 📊 Interpreting Results

### Red Flags 🚩 (Need Immediate Support)
- Can't run OED locally → Pair setup session needed
- Never used Git → Git tutorial + pairing
- Unfamiliar with testing → Test walkthrough needed
- Less than 5 hours/week → Reset expectations
- Not confident (1-2 rating) → Extra 1-on-1 time

### Yellow Flags ⚠️ (Watch & Support)
- Haven't explored OED yet → Quick demo needed
- Basic Git knowledge → Share resources, monitor PRs
- New to testing → Point to examples, offer help
- Timezone challenges → Ensure async workflow works

### Green Flags ✅ (Ready to Go!)
- OED running locally → Can start immediately
- Comfortable with Git → Can help others
- Testing experience → Can be code review lead
- High confidence → Give challenging tests

---

## 🎯 Sample Response Patterns

### Scenario 1: "The Newbie" 🐣
**Responses:**
- Never ran OED locally
- New to Git/GitHub
- Never written tests
- Low confidence (1-2)

**Action Plan:**
1. Schedule 1-on-1 setup session
2. Pair with stronger teammate
3. Assign simpler tests first
4. Check in daily

---

### Scenario 2: "The Self-Starter" 🚀
**Responses:**
- OED running locally
- Comfortable with Git
- Some testing experience
- High confidence (4-5)

**Action Plan:**
1. Minimal onboarding needed
2. Assign interesting/challenging tests
3. Ask them to help others
4. Give code review responsibilities

---

### Scenario 3: "The Almost-There" 💪
**Responses:**
- Looked at OED but setup stuck
- Basic Git knowledge
- Seen tests but not written
- Medium confidence (3)

**Action Plan:**
1. Quick setup troubleshooting
2. Provide solid examples
3. Pair for first test
4. Build confidence through wins

---

### Scenario 4: "The Time-Crunched" ⏰
**Responses:**
- Skills are good
- Very limited availability
- Timezone challenges
- Worried about time management

**Action Plan:**
1. Set realistic expectations
2. Ensure async workflow
3. Break work into small chunks
4. Flexible deadlines

---

## ✅ Next Steps After Assessment

1. **Review all responses** before kickoff
2. **Identify support needs** for each person
3. **Prepare targeted help** (tutorials, pair sessions)
4. **Adjust timeline** if needed
5. **Plan pairings** (strong with developing)
6. **Set up 1-on-1s** for anyone struggling

---

## 💬 Suggested Opening Message

Post this in Discord or send via email:

```
Hey team! 👋

Before our kickoff meeting, I'd love to understand where 
everyone's at so I can tailor our onboarding to help you 
succeed.

Please fill out this quick assessment (10 minutes):
[GOOGLE FORM LINK]

This helps me:
✅ Know who needs help with setup
✅ Understand your experience levels
✅ Identify potential blockers early
✅ Make sure we support everyone well

**No judgment on answers!** We're all learning, and 
this just helps me know how to best support you.

Thanks! See you at the kickoff! 🚀

- Dungo
```

---

## 🎯 Success Metrics

After using this assessment, you should know:

✅ Who can start coding immediately  
✅ Who needs setup help  
✅ Who needs Git/testing tutorials  
✅ Communication preferences  
✅ Time availability and timezone coordination  
✅ Individual learning styles and concerns  

**Result**: Tailored onboarding that gets everyone productive fast! 🔥

---

*Save team responses for reference throughout the project*
