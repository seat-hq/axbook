---
title: Reporting Issues
description: How to report bugs and security concerns — and what process does not exist yet.
order: 3
---

The repository contains **no `SECURITY.md`, no bug-bounty program, and no dedicated disclosure channel**. That absence is itself a fact worth knowing before you rely on the protocol.

## What to do today

- **Non-security bugs:** contact [@bosonax](https://x.com/bosonax) with reproduction steps, chain ID, and relevant addresses/tx hashes.
- **Suspected security issues:** there is no published private channel. Do **not** post exploit details publicly. Until the project publishes a security policy, the most responsible available path is a private message to [@bosonax](https://x.com/bosonax) asking for a contact, rather than disclosing details.

## What not to do

- Do not test exploits against the live testnet deployment in ways that affect other users' funds.
- Do not assume a bounty exists — none is offered.
- Do not treat this documentation site as a communication channel; it is read-only documentation.

## If you operate a desk

Have your own incident plan independent of the project: key rotation, pause procedure ([Emergency procedures](/docs/operations/emergency)), and monitoring ([Monitoring](/docs/operations/monitoring)). The contracts give you the pause switch; the runbook discipline is on you.
