"""mini-SWE-agent integration and Azure model construction."""

import os
from typing import Any

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from minisweagent.agents.default import DefaultAgent
from minisweagent.models.litellm_model import LitellmModel

from .config import Settings
from .logging_config import log


SYSTEM_TEMPLATE = """
You are an autonomous software engineering agent.

You work directly inside a local Windows repository.

Rules:
- Inspect the repository before making changes.
- Implement the requested GitHub issue.
- Use terminal commands to inspect, edit, and test files.
- Make actual implementation changes when required.
- Write a focused test for the current issue.
- Run the relevant tests after editing.
- Do not commit changes.
- Do not push changes.
- Do not create pull requests.
- Do not claim completion without checking git diff.

Windows command rules:
- The terminal uses Windows CMD.
- Use `dir` instead of `ls`.
- Do not use Unix commands, heredocs, shell redirection for multiline source,
  PowerShell here-strings, `copy con`, `set /p`, or interactive editors.
- Never use interactive commands.
- Do not write Python or HTML source using multiline `echo` commands.
- For creating or replacing a file, use one non-interactive Python command with
  `pathlib.Path.write_text(...)`, or another reliable non-interactive method.
- Ensure all generated Python files contain valid, executable Python syntax.
- After creating a Python file, run:
  `python -m py_compile <filename>`
"""

INSTANCE_TEMPLATE = """
Solve the following GitHub issue.

<issue>
{{task}}
</issue>

Requirements:
1. Inspect the existing files first.
2. Create or update the issue-specific test requested in the task.
3. Implement the actual change in the repository.
4. Run the issue-specific test.
5. Inspect git diff and verify that both the test and implementation changed.
6. Do not commit, push, or create a pull request.

Important Windows restrictions:
- Do not use `copy con`, `echo`, heredocs, PowerShell here-strings, or interactive commands.
- Create files with a single non-interactive Python command.
- Ensure generated Python files contain valid executable syntax.

When everything is complete, run:

echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT
"""


class OrchestratorAgent(DefaultAgent):
    """mini-SWE-agent with concise command and step logging."""

    COMPLETION_MARKER = "COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT"

    def step(self) -> list[dict]:
        step_number = self.n_calls + 1
        log("")
        log("=" * 90)
        log(f"[mini-SWE-agent] STARTING STEP {step_number}")
        log("=" * 90)
        try:
            result = super().step()
            log(f"[mini-SWE-agent] FINISHED STEP {step_number}")
            return result
        except Exception as exc:
            log(f"[mini-SWE-agent] ERROR IN STEP {step_number}: {exc}")
            raise

    def execute_actions(self, message: dict) -> list[dict]:
        actions = message.get("extra", {}).get("actions", [])
        if not actions:
            log("[mini-SWE-agent] The model returned no actions.")
        outputs = []
        for action_number, action in enumerate(actions, start=1):
            command = action.get("command", "")
            log("")
            log("-" * 90)
            log(f"[mini-SWE-agent] ACTION {action_number}")
            log("[mini-SWE-agent] COMMAND:")
            log(f"$ {command}")
            log("-" * 90)
            if self.COMPLETION_MARKER in command:
                log("[mini-SWE-agent] Completion marker detected.")
                return self.add_messages({
                    "role": "exit",
                    "content": "The agent marked the task as completed.",
                    "extra": {"exit_status": "Submitted", "submission": ""},
                })
            try:
                output = self.env.execute(action)
                outputs.append(output)
                log("[mini-SWE-agent] COMMAND OUTPUT:")
                log(str(output) if output else "[no output]")
            except Exception as exc:
                log("[mini-SWE-agent] COMMAND FAILED:")
                log(str(exc))
                raise
        observation_messages = self.model.format_observation_messages(
            message, outputs, self.get_template_vars()
        )
        log("[mini-SWE-agent] Command results returned to the model.")
        return self.add_messages(*observation_messages)


def create_model(settings: Settings) -> LitellmModel:
    log("[SWEPilot] Creating Azure AI Foundry model...")
    api_key = os.getenv("AZURE_FOUNDRY_API_KEY")
    if not api_key:
        log("[SWEPilot] No API key found. Using DefaultAzureCredential.")
        token_provider = get_bearer_token_provider(
            DefaultAzureCredential(), "https://ai.azure.com/.default"
        )
        api_key = token_provider()
    return LitellmModel(
        model_name=f"openai/{settings.foundry_deployment}",
        model_kwargs={"api_base": settings.foundry_api_base, "api_key": api_key},
    )
