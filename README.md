# BAYSED: AI Agent Memory Hub
## Architecture
![architecture](https://github.com/user-attachments/assets/97c31489-2295-4d17-aec0-84676b446efe)



## 🚨 Problem

AI models have evolved rapidly — but their **memory and ownership infrastructure** hasn’t.

- AI agents lack **persistent memory**: every task resets context.
- Outdated training data can result in **inaccurate responses**.
- There’s no **proper way to store, share, or evolve** agent-level knowledge.
- Worse, if you teach your AI something amazing, there’s no place to publish it **without giving up your IP**.

---

## 🔍 Scenario

Let’s say user A trains an AI agent on how to draft music copyright contracts using Story Protocol.

- The agent becomes an expert in this niche.
- User A wants to **share or sell** this badass agent with others.
- But current platforms don’t let you maintain **ownership or credit**.
- In short: no proper memory, no composable IP, no incentive.

So, we built **Baysed**.

---

## 💡 Solution — Baysed

**Baysed** is a decentralized AI Agent Memory Hub.

With Baysed, users can:

1. **Store persistent agent memory** — and evolve it over time.
2. **Buy, sell, or share** AI memories as programmable IP.
3. Maintain **on-chain attribution and upgrade lineage** for contributions.

---

## 🧱 Architecture

Baysed consists of the following core components:

### 1. Memory Layer  
- Powered by **Walrus** for long-term memory persistence  
- Built-in support for **Tusky** — decentralized access control

### 2. IP Attribution  
- Ensuring AI memory copyright protection on-chain
- When someone upgrades a memory, their contribution is **recorded as IP**  
- Derived works form **composable IP chains**

### 3. Story Protocol Integration  
- Using **MCP** (Model Context Protocol) to structure complex IP relationships  
- Leveraging **StoryChain** to reward memory contributors and keep knowledge up-to-date

---

## 🔜 Roadmap

Here’s what’s coming next:

- ✍️ **Editing & Versioning**  
  Fine-grained control over memory edits with audit trails.

- 🧱 **AI Abstraction Layer**  
  Standardized wrapper to connect any LLM or agent framework to Baysed memory.

- 🧰 **SDKs & APIs**  
  Developer kits to plug memory into your own agents or platforms.




# how to test
`story-mcp-hub` and `luna` should be in the same directory

you must set up the `.env` file in `luna` and `story-mcp-hub/story-sdk-mcp`, `story-mcp-hub/storyscan-mcp`

in story-mcp-hub use venv and install dependencies
```bash
cd story-mcp-hub
python3.13 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

in `luna` use bun
```bash
bun install
bun run build
bun start
```

go to localhost:3000 and you should see the `luna` interface

Toggle the switch in the top-right corner to test the functionality that exports and imports memory encrypted using Story IP and Walurs
