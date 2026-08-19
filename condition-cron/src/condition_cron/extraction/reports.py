"""Report submission extraction used by the cron extraction pipeline."""

import json
import logging

from typing import Any, Dict, Optional

from condition_cron.extraction.client import get_openai_client

logger = logging.getLogger(__name__)

REPORT_TYPES = [
    "Compliance Notification",
    "Compliance Self-Report",
    "Management Plan Report",
    "Project Status Notification",
    "Monitoring/Technical Report",
]

REPORT_SUBTYPES = [
    "Primary Contact Notification",
    "Phase Status Notification",
]

REPORT_FREQUENCIES = ["As needed", "One time", "Annually", "Quarterly", "Other"]

REPORT_PHASES = [
    "All Phases",
    "Pre-Construction",
    "Construction",
    "Commissioning",
    "Operations",
    "Care and Maintenance",
    "Decommissioning",
    "Closure",
]


def report_submission_required(input_condition_text: str) -> bool:

  tools = [
    {
      "type": "function",
      "function": {
        "name": "extract_info",
        "description": "If the condition requires a report, compliance notification, self-report, status notification, or monitoring/technical report to be submitted, extract the info related to it.",

        "parameters": {
          "type": "object",
          "properties": {

            "requires_report": {
              "type": "boolean",
              "description": (
                  "Does this condition explicitly state that a NEW report, compliance notification, "
                  "self-report, status notification, or monitoring/technical report must be submitted "
                  "to the EAO? Mark False if the condition only describes how a report should be "
                  "prepared or handled without requiring submission. Mark False if the condition only "
                  "describes a general administrative process for how plans, programs, or other "
                  "documents (that are themselves required by OTHER conditions) get reviewed, approved, "
                  "or revised by the EAO — such a condition does not itself impose a new report and "
                  "must not be treated as one, even though it mentions 'plan', 'program', or 'document'. "
                  "Mark False when the only submission-like language is the plan/program/document's OWN "
                  "development, initial submission to the EAO, or later updates/revisions/amendments to "
                  "it — that lifecycle is captured separately as a management plan deliverable, not a "
                  "report. Only mark True when the condition requires something to be reported IN "
                  "ADDITION to the plan itself, such as periodic monitoring results, implementation "
                  "status updates, or compliance status, submitted separately from (and typically after) "
                  "the plan document."
              ),
            },

          },
          "required": ["requires_report"],
        },

      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is the text of a condition:\n\n{input_condition_text}"}]
  client = get_openai_client()
  completion = client.chat.completions.create(
    model="gpt-4o-2024-05-13",
    messages=messages,
    tools=tools,
    temperature=0.0,
    tool_choice={"type": "function", "function": {"name": "extract_info"}}
  )

  result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)

  if result:
    return result["requires_report"]

  else:
    logger.error("report_submission_required: result is null")
    return False


def extract_report_info_using_gpt(condition_text: str) -> str:

  tools = [
    {
      "type": "function",
      "function": {
        "name": "format_info",
        "description": "Format the report submission information extracted from the condition.",
        "parameters": {
          "type": "object",
          "properties": {
            "reports": {
              "type": "array",
              "description": (
                  "One entry per distinct report this condition requires. If the SAME report recurs at "
                  "multiple project phases or on multiple occasions (e.g., 30 days prior to Construction, "
                  "then annually during Construction, then 30 days prior to Operations, and so on), that "
                  "is still a SINGLE report — list every occasion in its submission_schedule rather than "
                  "creating a separate reports[] entry per phase or per sub-clause."
              ),
              "items": {
                "type": "object",
                  "properties": {
                      "report_type": {
                        "type": "string",
                        "enum": REPORT_TYPES,
                        "description": (
                            "The category of report this condition requires. "
                            "'Compliance Notification': notifying the EAO of a non-compliance event, usually "
                            "triggered 'As needed' with a short response window (e.g., 'Within 72 hours of "
                            "non-compliance'). "
                            "'Compliance Self-Report': a self-reported compliance status report, typically tied "
                            "to project phases and/or a fixed annual date. "
                            "'Management Plan Report': a report on the ongoing STATUS, RESULTS, or "
                            "IMPLEMENTATION of a specific NAMED plan — see linked_management_plan_name. E.g. "
                            "periodic monitoring results tied to a management plan, or an implementation "
                            "status update. Do NOT use this for the plan's own development, initial "
                            "submission to the EAO, or later updates/revisions to the plan document itself — "
                            "that lifecycle is captured separately as a management plan deliverable, not a "
                            "report. Only extract a Management Plan Report when something is submitted IN "
                            "ADDITION to the plan document. "
                            "'Project Status Notification': a notification about project status — see "
                            "report_subtype. "
                            "'Monitoring/Technical Report': a technical or environmental monitoring report."
                        ),
                      },
                      "report_subtype": {
                        "type": "string",
                        "enum": REPORT_SUBTYPES,
                        "description": (
                            "Only set when report_type is 'Project Status Notification'. "
                            "'Primary Contact Notification' if the report is about updating/confirming the certificate holder's primary contact. "
                            "'Phase Status Notification' if the report is about the status of a project phase. "
                            "Null for all other report types."
                        ),
                      },
                      "report_title": {
                        "type": "string",
                        "description": "The name or title of the report as it appears in, or can be reasonably inferred from, the condition text (e.g., 'Annual Compliance Report', 'Air Quality Monitoring Report'). Title case."
                      },
                      "linked_management_plan_name": {
                        "type": "string",
                        "description": (
                            "Only applicable when report_type is 'Management Plan Report'. The name of the "
                            "specific plan this report is about (e.g., 'Aquatic Effects Monitoring Plan'), "
                            "written in title case. Null if this report is not tied to a specific named plan."
                        ),
                      },
                      "recipients": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "The names of the stakeholders that the condition explicitly states should receive the report. Often the EAO or other government agencies. E.g. EAO, MOE, MOH."
                        },
                      },
                      "submission_schedule": {
                        "type": "array",
                        "description": (
                            "One entry per occasion or recurring schedule this report must be submitted. "
                            "Most reports have just one entry, but reports tied to multiple project phases "
                            "(e.g., a compliance status report due before and annually during each of "
                            "Construction, Operations, and Closure) will have several."
                        ),
                        "items": {
                          "type": "object",
                          "properties": {
                              "phase": {
                                "type": "string",
                                "enum": REPORT_PHASES,
                                "description": (
                                    "The project phase this submission occasion relates to. Use "
                                    "'All Phases' when the report recurs continuously across all phases, or "
                                    "when it is event-triggered without a specific phase (e.g., a "
                                    "non-compliance notification)."
                                ),
                              },
                              "frequency": {
                                "type": "string",
                                "enum": REPORT_FREQUENCIES,
                                "description": (
                                    "How often the report must be submitted for this phase/occasion. Use "
                                    "'As needed' when submission is triggered by an event (e.g., a "
                                    "non-compliance, a contact change) rather than a fixed schedule — typical "
                                    "for Compliance Notification and Project Status Notification. Use "
                                    "'One time' for a single submission tied to a milestone or phase. Use "
                                    "'Annually' or 'Quarterly' for a fixed recurring schedule. Use 'Other' "
                                    "only for Compliance Self-Report or Management Plan Report entries whose "
                                    "schedule doesn't fit the above — describe the actual schedule in 'timing' "
                                    "instead."
                                ),
                              },
                              "timing": {
                                "type": "string",
                                "description": (
                                    "The specific timing or deadline language from the condition for this "
                                    "occasion, written as closely to the original text as possible. E.g., "
                                    "'Within 72 hours of non-compliance', 'At least 30 days prior to the start "
                                    "of Construction', 'On or before March 31 each year after the start of "
                                    "Operations', 'within 30 days after the issuance of this Certificate'."
                                ),
                              },
                          },
                          "required": ["phase", "frequency", "timing"],
                        },
                      },
                  },
                  "required": ["report_type", "report_title", "recipients", "submission_schedule"],
              }
            }
          },
          "required": ["reports"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is a condition written by the Environmental Assessment Office:\n\n{condition_text}\n\nFormat the information related to the report submission requirement(s). Remember: if the same report recurs across multiple phases or occasions, produce ONE reports[] entry for it with multiple submission_schedule items — do not split it into multiple reports[] entries."}]

  client = get_openai_client()
  completion = client.chat.completions.create(
      model="gpt-4o-2024-05-13",
      messages=messages,
      tools=tools,
      temperature=0.0,
      tool_choice={"type": "function", "function": {"name": "format_info"}}
  )

  return completion.choices[0].message.tool_calls[0].function.arguments

def extract_report_info(condition_text: str) -> Optional[str]:
    if report_submission_required(condition_text):
        logger.debug("This condition requires a report submission!")
        return extract_report_info_using_gpt(condition_text)
    else:
        logger.debug("This condition does not require a report submission.")
        return None

def extract_report_info_from_json(input_json: Dict[str, Any]) -> Dict[str, Any]:
    for condition in input_json.get("conditions", []):
        logger.info("Checking if condition %s requires report submission(s):", condition.get('condition_number'))

        condition_name = condition["condition_name"] + "\n\n" if condition["condition_name"] else ""
        condition_text = condition_name + condition["condition_text"]
        report_info = extract_report_info(condition_text)

        if report_info is not None:
            condition["report_submissions"] = json.loads(report_info)["reports"]
        else:
            condition["report_submissions"] = []

    return input_json
