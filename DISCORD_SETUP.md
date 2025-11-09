# Discord Server Setup for OED Test Case Team

## Server Structure

```
📁 OED Test Cases Team
├── 📢 INFORMATION
│   ├── #welcome
│   ├── #resources
│   └── #timeline
├── 💬 COMMUNICATION
│   ├── #general
│   ├── #random
│   └── #standups
├── 🔨 DEVELOPMENT
│   ├── #test-progress
│   ├── #blockers
│   ├── #code-reviews
│   └── #git-notifications
├── 🎤 VOICE CHANNELS
│   ├── 🔊 Pair Programming
│   └── 🔊 Team Sync
└── 📊 STATUS
    └── #metrics
```

---

## Channel Purposes

### #welcome
**Purpose**: Onboarding new team members

**Pinned Messages:**
```
🎯 Welcome to OED Test Case Team!

Quick Links:
• GitHub Repo: [link]
• Project Board: [link]  
• Documentation: [link]
• Issue #962: [link]

Getting Started:
1. Set up dev environment (see #resources)
2. Read test documentation
3. Claim a test case
4. Post in #general to introduce yourself!
```

### #resources
**Purpose**: Links, docs, guides

**Pinned:**
- Link to test documentation
- Link to TEAM_TIMELINE.md
- Link to expected CSV files location
- Link to helper function documentation
- Quick reference for npm commands

### #timeline
**Purpose**: Auto-posted updates from timeline

**Bot Posts:**
- Weekly progress summaries
- Milestone achievements
- Deadline reminders

### #general
**Purpose**: Team chat, questions, discussions

### #standups
**Purpose**: Daily async standups

**Format (Post daily):**
```
📅 Standup - [Your Name] - [Date]

✅ Yesterday:
- Completed setup for test L4
- Reviewed line reading documentation

🔨 Today:
- Implement test L4
- Copy expected CSV file
- Run first test

🚧 Blockers:
- Need help understanding unit conversions

⏱️ Hours worked: 2.5
```

### #test-progress
**Purpose**: Updates when test status changes

**Auto-posted from GitHub Actions:**
```
✅ Test L4 Completed!
👤 Member: @user1
📝 PR: #123
⏱️ Time: 3.5 hours
🎉 Tests passing: 1/8
```

### #blockers
**Purpose**: Ask for help

**Template:**
```
🚨 Blocker

👤 Who: @yourname
🧪 Test: L4
❌ Issue: Test failing with unit mismatch error
📎 Context: [code snippet or screenshot]
🔗 PR/Branch: [link]

@team Please help when available!
```

### #code-reviews
**Purpose**: Request and track code reviews

**Post format:**
```
📝 PR Ready for Review

Test: L4 - Daily points for hourly readings
Author: @user1
PR: https://github.com/[repo]/pull/123
Changes: 
- Added test function
- Copied expected CSV
- All tests passing locally

Reviewers needed: 1
@team Please review!
```

### #git-notifications
**Purpose**: Automated GitHub updates

**Connected via webhooks - posts:**
- New issues created
- PRs opened
- PRs merged  
- Comments on your issues
- CI failures

---

## Discord Bots

### 1. GitHub Bot (Recommended)
**Purpose**: Auto-post GitHub updates

**Setup:**
1. Go to Server Settings → Integrations
2. Add GitHub bot
3. Connect to your repository
4. Subscribe #git-notifications to repo events

**Events to subscribe:**
- Issues
- Pull requests
- Commits (optional)
- Releases

### 2. Simple Poll Bot
**Purpose**: Quick team decisions

**Example uses:**
- "Which time works for sync meeting?"
- "Should we push deadline by 1 day?"
- "Review priority for PRs?"

**Command:**
```
!poll "Weekly sync time?" "Monday 6pm" "Tuesday 7pm" "Wednesday 5pm"
```

### 3. Reminder Bot
**Purpose**: Scheduled reminders

**Examples:**
```
!remind #standups "Post your daily standup!" every day at 9am
!remind #general "Weekly sync in 1 hour!" every Monday at 5pm
!remind @user "Review PR #123" in 24 hours
```

### 4. Statbot (Optional)
**Purpose**: Team statistics

**Tracks:**
- Message activity per member
- Most active channels
- Response times

---

## Workflow Integration

### Setting up Discord Webhook for GitHub Actions

**Step 1: Create Discord Webhook**
1. Go to channel settings (#test-progress)
2. Integrations → Webhooks
3. Create webhook
4. Copy webhook URL

**Step 2: Add to GitHub Secrets**
1. GitHub repo → Settings → Secrets
2. New repository secret
3. Name: `DISCORD_WEBHOOK`
4. Value: [paste webhook URL]

**Step 3: Already done!**
The GitHub Actions workflow I created earlier will now post to Discord automatically.

---

## Discord Rules & Best Practices

### Communication Guidelines

**DO:**
✅ Use threads for detailed discussions
✅ React with emoji to acknowledge messages
✅ Tag people when you need their attention
✅ Post standups even if "nothing to report"
✅ Celebrate wins (completed tests, merged PRs)
✅ Ask questions - no question is dumb

**DON'T:**
❌ Use @everyone or @here (except emergencies)
❌ Post code without formatting (use ```backticks```)
❌ DM for technical questions (ask in channels)
❌ Leave blockers unposted for >2 hours

### Async Communication Tips

**Since you're working async:**

1. **Over-communicate**
   - Document decisions in channels
   - Link to relevant resources
   - Explain your thinking

2. **Use timestamps**
   - "I'll be online 6-8pm EST today"
   - "Available for quick call anytime before 10pm"

3. **Thread conversations**
   - Keep related discussions together
   - Easier to catch up later

4. **Pin important info**
   - Pin key decisions
   - Pin recurring reminders
   - Pin helpful resources

---

## Discord Slash Commands

### Quick Reference

```
/github subscribe owner/repo
/github unsubscribe owner/repo
/github link issue 123
/poll "Question?" "Option1" "Option2"
/remind #channel "Message" in 1 hour
```

### Custom Bot Commands (If you create one)

```
/test status              - Show all test progress
/test claim L4 @user      - Claim a test case
/test complete L4         - Mark test complete
/metrics                  - Show team metrics
/standup                  - Get standup template
```

---

## Voice Channel Usage

### 🔊 Pair Programming
**Use for:**
- Debugging together
- Code walkthrough
- Learning session
- Stuck on a problem

**Etiquette:**
- Share screen when explaining
- Mute when not talking
- Use push-to-talk if background noise
- Record if sharing knowledge

### 🔊 Team Sync
**Use for:**
- Weekly meetings
- Sprint planning
- Retrospectives
- Celebrations 🎉

---

## Status & Availability

### Set your Discord status

**Custom status examples:**
```
🔨 Working on test L4
📚 Reading docs
🐛 Debugging
💤 Away - back at 6pm
✅ Available for review
🚫 DND - Focus time
```

### Availability Schedule (Pin in #general)

```markdown
# Team Availability (Times in your timezone)

**Member 1**: Mon-Wed 6-9pm, Sat 10am-2pm
**Member 2**: Tue-Thu 5-8pm, Sun 1-5pm  
**Member 3**: Mon-Fri 7-9am, Sat-Sun flexible
**Member 4**: Wed-Sat 8-10pm, Sun morning

📍 Best overlap times:
- Wednesday 6-8pm (3 members)
- Saturday afternoon (3 members)
```

---

## Discord Emojis for Quick Reactions

Create custom emojis for your server:

**Status:**
- `:pr_ready:` - PR ready for review
- `:test_passing:` - Test passed
- `:test_failing:` - Test failed
- `:blocked:` - Need help
- `:reviewing:` - Currently reviewing

**Quick responses:**
- `:eyes:` - I see this, will look later
- `:+1:` - Agreed / Approved
- `:thinking:` - Needs discussion
- `:party:` - Celebration!

---

## Weekly Sync Meeting Agenda Template

Post in #general before meeting:

```
📅 Weekly Sync - [Date]
⏰ Time: [Time]
📍 Location: 🔊 Team Sync voice channel

**Agenda:**
1. ✅ Wins this week (5 min)
2. 📊 Progress review (10 min)
3. 🚧 Blockers & challenges (10 min)
4. 📅 Next week planning (10 min)
5. 💡 Knowledge sharing (10 min)
6. ❓ Open discussion (5 min)

**Preparation:**
- Review your progress
- Update your test status
- List any blockers
- Questions to ask team

See you there! 🚀
```

---

## Example Week in Discord

### Monday
```
#standups - Everyone posts daily standup
#timeline - Bot posts: "📅 Week 2 begins! 4 tests remaining"
```

### Tuesday  
```
#test-progress - "@user1 started test L4"
#blockers - "@user2 posted blocker on unit conversion"
#general - Discussion helping @user2
```

### Wednesday
```
#test-progress - "✅ @user1 completed test L4!"
#code-reviews - "@user1 requests review for PR #123"
Voice: Pair Programming - @user3 and @user4 debug together
```

### Thursday
```
#git-notifications - "PR #123 merged to development"
#test-progress - "🎉 2/8 tests complete!"
```

### Friday
```
#standups - Weekly summaries
#metrics - Bot posts team statistics
Voice: Team Sync - Weekly meeting
```

---

## Setting Up Everything (30 min checklist)

- [ ] Create Discord server
- [ ] Set up channels (copy structure above)
- [ ] Add GitHub bot
- [ ] Create webhook for GitHub Actions
- [ ] Add webhook URL to GitHub secrets
- [ ] Pin welcome message
- [ ] Pin resources
- [ ] Create custom emojis (optional)
- [ ] Invite team members
- [ ] Post initial standup template
- [ ] Schedule first team sync

---

## Pro Tips

1. **Use Discord on mobile** - Stay connected even when away
2. **Enable notifications for @mentions only** - Reduce noise
3. **Organize channels in folders** - Cleaner view
4. **Use Discord search** - Find past discussions
5. **Archive old threads** - Keep channels clean

---

*Ready to collaborate? Let's build something great! 🚀*
