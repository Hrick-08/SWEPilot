# SWEPilot
```

███████╗██╗    ██╗███████╗██████╗ ██╗██╗      ██████╗ ████████╗
██╔════╝██║    ██║██╔════╝██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝
███████╗██║ █╗ ██║█████╗  ██████╔╝██║██║     ██║   ██║   ██║
╚════██║██║███╗██║██╔══╝  ██╔═══╝ ██║██║     ██║   ██║   ██║
███████║╚███╔███╔╝███████╗██║     ██║███████╗╚██████╔╝   ██║
╚══════╝ ╚══╝╚══╝ ╚══════╝╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝
```

### An Autonomous AI Agent for GitHub Issue Resolution and Pull Request Generation

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Azure AI](https://img.shields.io/badge/Azure%20AI-Foundry-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)](https://ai.azure.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Integration-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/)
[![mini-SWE-agent](https://img.shields.io/badge/Powered%20by-mini--SWE--agent-purple?style=flat-square)](https://github.com/SWE-agent/mini-SWE-agent)

> **SWEPilot** is an AI-powered software engineering automation system that transforms GitHub issues into tested, review-ready Pull Requests. It leverages mini-SWE-agent and an Azure-hosted language model to analyze issues, modify code, execute tests, and automate the Git workflow.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Status](#project-status)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Example Workflow](#example-workflow)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Software development teams spend considerable time investigating bugs, implementing repetitive fixes, running tests, and preparing Pull Requests. SWEPilot aims to automate this process through an autonomous AI coding workflow.

A developer creates a GitHub issue describing a bug or feature request. SWEPilot identifies eligible issues, launches a coding agent, and coordinates the complete workflow:

**GitHub Issue → Code Analysis → AI-Generated Changes → Testing → Feature Branch → Pull Request**

The system is designed to keep developers in control by generating Pull Requests for review rather than directly modifying the production branch.

---

## Problem Statement

Traditional issue-resolution workflows often require developers to:

1. Understand the issue and reproduce the problem.
2. Locate the relevant files in a large codebase.
3. Implement and test a solution.
4. Create a feature branch.
5. Commit and push the changes.
6. Prepare a Pull Request for review.

SWEPilot addresses these repetitive tasks by combining an AI coding agent with a deterministic orchestration layer and GitHub integration.

### Project Objectives

- Automate the transition from GitHub issues to code changes.
- Use an Azure-hosted AI model for software engineering tasks.
- Execute tests before proposing a Pull Request.
- Automate Git branch creation, commits, and pushes.
- Generate Pull Requests with useful summaries and validation results.
- Maintain human oversight through mandatory code review.

---

## Key Features

### Current Capabilities

- **AI-powered code modification:** Uses mini-SWE-agent to analyze a repository and edit relevant files.
- **Azure model integration:** Runs the coding workflow using an Azure-deployed language model.
- **Repository-aware execution:** Allows the coding agent to inspect and work within a repository workspace.

### Planned Capabilities

- **GitHub App integration:** Receive issue events through secure webhooks.
- **Issue-based triggering:** Detect issues containing the `--agent` marker or a dedicated automation label.
- **Automated repository cloning:** Clone the target repository into an isolated workspace.
- **Feature branch management:** Create a dedicated branch for each issue.
- **Automated validation:** Run tests and inspect the results before pushing changes.
- **Automated Git operations:** Commit and push generated changes to the feature branch.
- **Pull Request generation:** Create a PR using the GitHub REST API.
- **PR reporting:** Add change summaries, test results, and relevant issue references.
- **Self-healing workflow:** Optionally allow the coding agent to respond to failed tests.
- **Execution monitoring:** Track job status, failures, and agent activity.

---

## How It Works

### End-to-End Workflow

```text
┌───────────────────────┐
│     GitHub Issue      │
│       --agent        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    GitHub Webhook     │
│   Event Verification  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│     Orchestrator      │
│   Validate & Queue    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│      Azure VM         │
│   Isolated Workspace  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    mini-SWE-agent     │
│   Analyze & Modify    │
│        Code           │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    Test Execution     │
│   Validate Changes    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Create Feature      │
│   Branch & Commit     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│      Git Push         │
│  Push Branch to GitHub│
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   GitHub REST API     │
│    Create Pull Request│
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Human Code Review   │
│    Approve or Reject  │
└───────────────────────┘
```

### Workflow Description

1. A developer creates a GitHub issue containing `--agent` in its title or applies an automation label.
2. GitHub sends an event to the SWEPilot webhook endpoint.
3. The orchestrator validates the event and creates a job.
4. The worker clones the repository into a dedicated workspace.
5. A feature branch is created from the selected base branch.
6. mini-SWE-agent analyzes the issue and modifies the code using the Azure-hosted model.
7. The worker executes the repository's configured tests and validation commands.
8. If validation succeeds, the changes are committed and pushed to the feature branch.
9. The orchestrator calls the GitHub REST API to create a Pull Request.
10. The PR includes a summary of the changes, test results, and a reference to the original issue.
11. A human reviews the generated changes before merging.

---

## Architecture

SWEPilot separates AI-powered coding from deterministic workflow management.

```text
                         ┌──────────────────────┐
                         │       GitHub         │
                         │  Issues / PRs / Repo  │
                         └──────────┬───────────┘
                                    │
                              HTTPS Webhook
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   SWEPilot Backend   │
                         │  Webhook + API Layer │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Orchestrator      │
                         │  Workflow Controller │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Azure VM        │
                         │    Worker Process    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Isolated Workspace  │
                         │  Clone + Git Branch  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    mini-SWE-agent    │
                         │      AI Coding       │
                         └──────────┬───────────┘
                                    │
                             Azure-hosted LLM
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Tests & Validation  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Git Operations   │
                         │  Commit + Push Branch│
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    GitHub REST API   │
                         │    Create Pull PR    │
                         └──────────────────────┘
```

### Core Components

| Component | Responsibility |
|---|---|
| GitHub App | Receives issue events and authenticates repository operations |
| Webhook Handler | Validates incoming GitHub events and identifies eligible issues |
| Orchestrator | Controls the job lifecycle and coordinates each workflow stage |
| Worker | Manages the repository workspace and executes the coding workflow |
| mini-SWE-agent | Analyzes issues, edits files, and runs shell commands |
| Azure-hosted Model | Provides the language-model intelligence for coding tasks |
| Test Runner | Executes project-specific tests and validation commands |
| Git Integration | Creates branches, commits changes, and pushes code |
| GitHub REST API | Creates Pull Requests and updates issue information |

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Agent execution and workflow orchestration |
| mini-SWE-agent | AI software engineering and code modification |
| Azure AI Foundry | Hosting and managing the deployed language model |
| Azure Virtual Machine | Running the agent worker and orchestration services |
| GitHub Apps | Secure repository and webhook integration |
| GitHub REST API | Branch, commit, and Pull Request operations |
| Git | Version control and remote branch management |
| Docker | Optional isolation for repository execution |
| FastAPI | Optional webhook and backend API framework |
| Azure Service Bus | Optional queue for asynchronous jobs |
| Azure Monitor | Optional logging and monitoring |

---

## Project Status

### Current State

- [x] mini-SWE-agent is operational.
- [x] The agent successfully receives coding tasks.
- [x] The agent edits files in the target repository.
- [x] The agent uses an Azure-deployed language model.
- [x] Working webhook endpoint.
- [x] Issue-trigger detection.
- [x] Automated repository cloning.
- [x] Commit and push workflow.
- [x] Feature branch creation.
- [x] GitHub REST API Pull Request creation.
- [x] Automated test execution.
- [x] End-to-end issue-to-PR integration.

---

## Getting Started

### Prerequisites

Before running SWEPilot, ensure you have:

- Python 3.10 or newer.
- Git installed and available in the system PATH.
- Access to an Azure-deployed language model.
- A GitHub repository for testing.
- Appropriate GitHub permissions for repository operations.
- An Azure VM or equivalent execution environment.

### 1. Clone the Repository

```bash
git clone https://github.com/Hrick-08/SWEPilot.git
cd SWEPilot
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Activate it on Linux or macOS:

```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

> Dependency installation instructions will be updated as the SWEPilot orchestration and GitHub integration modules are added.

### 4. Configure Environment Variables

Create a local `.env` file based on the required configuration.

Example:

```env
AZURE_FOUNDRY_ENDPOINT=<your-azure-openai-endpoint>
AZURE_FOUNDRY_DEPLOYMENT=<your-azure-openai-deployment-name>
AZURE_FOUNDRY_API_KEY=<your-azure-openai-api-key>

# GitHub tokens are collected during registration and stored encrypted in the database.
# Optional legacy fallback for direct workflow calls.
# REPO_NAME=<github-username>/<repo-name>
```

**Do not commit API keys, GitHub private keys, or webhook secrets to version control.**

### 5. Run SWEPilot
```env
uvicorn main:app --reload
```
---

## Configuration

SWEPilot will support configuration for the following workflow parameters:

| Setting | Description |
|---|---|
| Issue trigger | `--agent` marker or automation label |
| Base branch | Branch against which the PR is opened |
| Agent branch prefix | Prefix for generated branches, such as `ai-agent/` |
| Test command | Project-specific test command |
| Lint command | Optional linting command |
| Maximum retries | Maximum number of agent repair attempts |
| Workspace directory | Location for temporary repository workspaces |
| PR title template | Format of generated PR titles |
| PR body template | Format of generated PR descriptions |
| Allowed repositories | Repositories eligible for automation |

---

## Example Workflow

A developer creates the following issue:

```text
Title: Fix invalid login validation --agent

Description:
The login endpoint accepts invalid email formats.
Add proper validation and include tests for invalid inputs.
```

SWEPilot processes the issue and creates a branch:

```text
ai-agent/issue-42-login-validation
```

After the agent modifies the code and tests pass, the worker executes:

```bash
git add .
git commit -m "Fix login validation for issue #42"
git push origin ai-agent/issue-42-login-validation
```

The orchestrator then calls the GitHub API:

```http
POST /repos/{owner}/{repo}/pulls
```

With a request body similar to:

```json
{
  "title": "AI fix: login validation",
  "head": "ai-agent/issue-42-login-validation",
  "base": "main",
  "body": "Generated by SWEPilot.\n\nCloses #42"
}
```

The resulting Pull Request is submitted for human review.

---

## Security Considerations

SWEPilot executes AI-generated commands and repository code. Security is therefore a critical part of the system.

### Recommended Safeguards

- Verify GitHub webhook signatures.
- Use GitHub App installation tokens instead of long-lived personal access tokens where possible.
- Restrict repository permissions to the minimum required.
- Never allow direct pushes to protected production branches.
- Execute untrusted code inside isolated environments.
- Store secrets in environment variables or a secure secret manager.
- Prevent concurrent jobs from modifying the same workspace.
- Enforce timeouts and resource limits on agent and test execution.
- Validate repository and branch information received from webhook events.
- Require human review before merging Pull Requests.
- Avoid exposing secrets to the AI agent or repository test processes.

---

## Future Enhancements

### Intelligent Validation

- AI-powered code review before PR creation.
- Static analysis and security scanning.
- Test coverage reporting.
- Regression detection.

### Self-Healing Workflows

- Analyze failed test logs.
- Automatically retry failed tasks.
- Allow limited repair iterations.
- Update the existing PR with additional fixes.

## License

This project is currently under development. Add the appropriate license information when the repository's licensing decision has been finalized.

---

## Acknowledgements

- [mini-SWE-agent](https://github.com/SWE-agent/mini-SWE-agent) — AI software engineering agent used as the coding engine.
- [Azure AI Foundry](https://ai.azure.com/) — Azure platform used to host and manage the language model.
- [GitHub REST API](https://docs.github.com/en/rest) — Repository and Pull Request automation.

---

<p align="center">
  <strong>SWEPilot</strong><br>
  From GitHub issues to AI-generated Pull Requests.
</p>