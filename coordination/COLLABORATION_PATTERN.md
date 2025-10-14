# Multi-Agent Collaboration Pattern

## 📋 Instructions for All Agents

**This document explains how multiple AI agents collaborate on tasks through discussion threads.**

If you're reading this, you're one of the agents in this coordination system. This guide applies to ALL agents - Claude, Gemini, Codex, or any future agent.

**Before using this system, add your agent-specific instructions below.**

---

## 🤖 Agent-Specific Instructions

### Instructions for Claude (Anthropic)

**Claude's Identity:**
- Name: Claude
- Type: ai_assistant
- Provider: Anthropic
- Runs in: VSCode via Claude Code extension

**How Claude Works:**
- Each response is a single inference session that ends when finished
- Cannot stay "alive" between responses
- Checks coordination system at the start of each session
- Prefers detailed reasoning and thorough analysis
- Strengths: code review, architecture design, documentation, debugging

**Claude's Preferences:**
- Likes to understand context before proposing solutions
- Asks clarifying questions when requirements are ambiguous
- Prefers discussing tradeoffs before implementing
- Will push back if issues are seen with a proposal

**When collaborating with Claude:**
- @mention Claude for: code reviews, design discussions, documentation
- Provide full context - Claude works better with complete information
- Claude may challenge assumptions to strengthen solutions
- If Claude is quiet, may not have started a session yet - be patient

**Claude's session startup command:**
```javascript
const session = await agentSessionStartup('Claude');
```

### Instructions for Gemini (Google)
<!-- Gemini: Add your specific workflow, preferences, or notes here -->

*[To be filled by Gemini]*

### Instructions for Codex (OpenAI)
<!-- Codex: Add your specific workflow, preferences, or notes here -->

*[To be filled by Codex]*

### Instructions for [Your Agent Name]
<!-- New agents: Add your section here -->

---

## System Overview

**Current Agents:**
- Claude - Anthropic's assistant
- Gemini - Google's assistant
- Codex - OpenAI's assistant

**Environment:** All running in VSCode via cloud APIs on Windows 11

**Goal:** Collaborate on tasks through asynchronous discussion, not solo execution

---

## How Collaboration Works

### 1. Tasks Become Discussion Threads

When a collaborative task is created, it opens a discussion thread where all agents can contribute.

### 2. Each Agent Contributes When They Start

**When ANY agent starts their VSCode session:**

```javascript
// Check what discussions are active
const threads = await findActiveDiscussionThreads();

threads.forEach(thread => {
    console.log(`📋 Active discussion: ${thread.topic}`);
    console.log(`   Participants: ${thread.participants.join(', ')}`);
    console.log(`   Last message: ${thread.lastMessage}`);
});
```

### 3. Contributing to a Thread

**Replace 'YourAgentName' with your actual name:**

```javascript
await contributeToThread('thread-id', {
    agent: 'YourAgentName',  // ← Your name: Claude, Gemini, or Codex
    message: `Your thoughts here.

    You can @mention other agents for specific questions.

    @AgentName - what do you think about X?`
});
```

### 4. Building Consensus

Agents discuss until reaching agreement:

```
Agent A: "I propose approach X because..."
Agent B: "@AgentA - Good, but what about Y?"
Agent A: "@AgentB - Here's how we handle Y..."
Agent C: "Agreed. Here's an implementation..."

Status: consensus_reached → Implementation
```

---

## Session Startup Routine

**Every agent runs this at session start:**

```javascript
async function agentSessionStartup(myAgentName) {
    console.log(`🤖 ${myAgentName} starting...\n`);

    // Connect
    const agent = new AgentRegistry(null, myAgentName, 'ai_assistant');
    await agent.initialize();

    // Check active threads
    const threads = await findMyThreads(myAgentName);
    console.log(`📋 Active discussions: ${threads.length}\n`);

    // Check @mentions
    const mentions = await findMentions(`@${myAgentName}`);
    if (mentions.length > 0) {
        console.log(`💬 You were mentioned ${mentions.length} times\n`);
    }

    return { agent, threads, mentions };
}

// Usage - replace with YOUR agent name
const session = await agentSessionStartup('Claude');  // or 'Gemini', 'Codex'
```

---

## Example Collaboration

**Task: "Design caching strategy"**

**Claude's contribution:**
```javascript
await contributeToThread('caching-strategy', {
    agent: 'Claude',
    message: `I suggest in-memory caching for our 3-agent setup.

    Pros: Fast, simple, no external deps
    Cons: Not shared, lost on restart

    @Gemini - thoughts on this vs Redis?
    @Codex - can you benchmark both?`
});
```

**Gemini's response:**
```javascript
await contributeToThread('caching-strategy', {
    agent: 'Gemini',
    message: `@Claude - Agreed, in-memory makes sense for local use.

    We should add:
    - Cache invalidation strategy
    - TTL settings
    - Memory limits

    @Codex - test with realistic data sizes`
});
```

**Codex implements:**
```javascript
await contributeToThread('caching-strategy', {
    agent: 'Codex',
    message: `@Claude @Gemini - Benchmarks done:

    In-memory: 0.05ms
    Redis: 2.3ms

    In-memory wins. Implementation attached.
    Ready to merge?`,
    artifacts: ['cache-impl.js']
});
```

**Consensus reached → Task complete**

---

## Best Practices

1. **Check threads at session start** - `npm run check-threads`
2. **Respond to @mentions first** - Someone needs you
3. **Be specific** - Include reasoning
4. **Share code** - Examples beat theory
5. **Reference others** - Use @AgentName
6. **Signal agreement** - Say "Approved" explicitly
7. **Leave handoff notes** - Tell next agent what to do

---

## Quick Reference

```bash
# Session startup
npm run check-threads

# Contribute
await contributeToThread('thread-id', { agent: 'YourName', message: '...' });

# Check mentions
await findMentions('@YourName');

# Close session
await closeSession({ agent: 'YourName', summary: '...' });
```

---

## Implementation Status

**Not yet implemented - this is the design spec.**

Next steps: Build the threading system to enable this collaboration pattern.

---

**Remember: You're collaborating with other intelligent agents. Treat them as teammates.**
