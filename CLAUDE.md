# Project Overview
This repository contains a password manager built as a Single Page Application (SPA). 

# Agent Directives & Workflow
*   **Issue Tracking:** Use Jira. The active project key for this codebase is PM. Before starting any feature work, always use your Jira tools to fetch the relevant ticket and read the requirements.
*   **Status Updates:** When starting a new task, use Jira tools to transition the ticket to "In Progress". Do not transition tickets to "Done".

# How I work in this repo

*   **Ticket first.** Start feature work by fetching the relevant PM Jira ticket, reading the requirements, and moving it to In Progress (see Agent Directives above). Never mark tickets Done.
*   **Design before building (for non-trivial work).** Propose the frontend/backend split and the approach, and get approval before writing code. As part of this, surface any **new concept names** — a domain term, abstraction, module, or piece of shared vocabulary — and confirm them together with the approach. This is about concepts, not routine functions or variables; prefer names that match how the user talks about the product. Small or obvious changes can skip the gate and go straight to doing.
*   **Security-critical.** This is a password manager. Flag and review anything touching crypto, auth, or secret handling.
*   **Test-first.** Prefer TDD (red → green → refactor), using the `tdd` and `vitest` skills, for logic-bearing code. Skip it only when it clearly doesn't fit (e.g. pure styling).
*   **Never `git commit` or `git push` without asking.**