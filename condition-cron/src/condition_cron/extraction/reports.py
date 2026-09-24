"""Report submission extraction used by the cron extraction pipeline."""

import json
import logging

from typing import Any, Dict, Optional

from condition_cron.extraction.client import get_openai_client

logger = logging.getLogger(__name__)

REPORT_TYPES = [
    "Compliance Notification",
    "Compliance Self-Report",
    "Management Plan Associated Report",
    "Project Status Notification",
    "Monitoring/Technical Report",
]

REPORT_SUBTYPES = [
    "Primary Contact Notification",
    "Phase Status Notification",
]

# Must match condition-web's REPORT_FREQUENCIES in
# ConditionAttribute/Reports/constants.ts — phase/frequency columns are
# unconstrained strings, so a mismatch here silently breaks the staff-facing
# dropdowns (imported value won't match any option, renders blank).
REPORT_FREQUENCIES = ["As Needed", "One Time", "Annually", "Semi-Annually", "Quarterly", "Monthly", "Weekly", "Other"]

# Must match condition-web's REPORT_PHASES in the same file. Order matters — it
# drives the "Add Report" phase dropdown order and phase-grouping/display order
# in condition-web (see PHASE_ORDER), and is used below as the chronological
# phase sequence for "X days prior to <phase>" reasoning.
REPORT_PHASES = [
    "All Phases",
    "Post-Issuance",
    "Pre-Construction",
    "Construction",
    "Operations",
    "Closure",
    "Post-Closure",
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
                  "the plan document. Mark False for language about retaining, appointing, or engaging an "
                  "Independent Environmental Monitor (IEM), or about developing, submitting, or obtaining "
                  "approval for the IEM's Terms of Engagement / Terms of Reference — that requirement is "
                  "captured separately as an IEM Terms of Engagement deliverable, not a report, even if a "
                  "later clause in the same condition describes a phase-completion report the IEM must "
                  "submit — see the separate rule below about IEM-authored reports, which also covers this "
                  "case. Mark False for ANY report that the condition states must be written or authored by "
                  "the IEM (rather than the Holder) — e.g. 'the reports must be written by the IEM', 'a "
                  "report written by the IEM and submitted to the EAO'. This applies even when it is "
                  "otherwise a genuine, well-specified, distinct report requirement (such as a "
                  "phase-completion report covering non-compliances and recommendations) — the deciding "
                  "factor is WHO writes and submits it, not whether a real report is required. These "
                  "IEM-authored reports are submitted by the IEM directly to the EAO, bypassing the Holder "
                  "entirely, so they must never be captured here: this system (EPIC.submit) is the Holder's "
                  "own submission portal, and the Holder must not have visibility or submission access to a "
                  "report that is meant to be written and sent by the IEM, not the Holder. Only mark True "
                  "for an IEM-related report if the condition instead requires the HOLDER to prepare or "
                  "submit it. Mark False for a "
                  "requirement to establish, maintain, or update a public-facing website or alternative "
                  "online medium — this is true even if the website must be updated on a recurring schedule "
                  "(e.g., 'updated at least quarterly') or must display report-like information such as "
                  "annual monitoring results, current plans, or Project status. Publishing information "
                  "publicly on a website is NOT the same as submitting a report 'to the EAO' — the website "
                  "itself is the deliverable here, not a report, regardless of what content it must "
                  "contain or how often it is updated. Only mark True if the condition SEPARATELY requires "
                  "that same information to also be submitted directly to the EAO (or another named "
                  "recipient) as its own distinct report, apart from posting it on the website."
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
                  "RULE #1, before anything else: one entry per DISTINCT report. Two reports[] entries are "
                  "the SAME report (and MUST be merged into ONE entry, with each occasion as its own "
                  "submission_schedule row) whenever they share the same report_type AND the same/"
                  "equivalent report_title (and, for 'Management Plan Associated Report', the same "
                  "linked_management_plan_name) — regardless of how many different phases, sentences, or "
                  "sub-clauses the condition mentions them in. This is true even when: (a) the phases are "
                  "listed directly in the same sentence (e.g. 'must be implemented throughout Construction, "
                  "Operations, and Closure' + 'reporting must occur at least annually' => ONE report with "
                  "THREE submission_schedule rows, one per phase, all 'Annually' — NOT three reports[] "
                  "entries); or (b) the occasions are defined by CROSS-REFERENCE to another subsection "
                  "rather than spelled out directly — e.g. 'on completion of the phase(s) listed in "
                  "subsection X' where subsection X defines a range like 'from the start of Construction "
                  "until the end of the second year of Operations': that range has TWO completion "
                  "milestones, so produce ONE reports[] entry with TWO submission_schedule rows (timing "
                  "'On completion of Construction' and 'On completion of the second year of Operations'). "
                  "Before you finalize your answer, re-check every pair of entries you are about to return: "
                  "if any two share the same report_type and report_title, you have made an error — merge "
                  "them into one entry and combine their submission_schedule rows before responding. "
                  "Do NOT create a reports[] entry for a report the condition states must be written or "
                  "authored by the Independent Environmental Monitor (IEM) rather than the Holder — e.g. "
                  "'the reports must be written by the IEM', 'a report written by the IEM and submitted to "
                  "the EAO'. This applies even when the report is otherwise genuine, well-specified, and "
                  "distinct (e.g. a detailed phase-completion report covering non-compliances, "
                  "recommendations, and stop-work records) — the IEM submits these directly to the EAO, "
                  "bypassing the Holder, and this system only captures reports the HOLDER is responsible "
                  "for submitting. Only capture an IEM-related report if the condition instead requires the "
                  "HOLDER to prepare or submit it. "
                  "Do NOT create a "
                  "reports[] entry for the underlying plan/program/document's OWN development or initial "
                  "submission to the EAO for review/approval (e.g., 'the Holder must provide the plan to "
                  "the EAO for review a minimum of 90 days prior to Construction') — that is the plan's "
                  "own submission, not a report, even though it has schedule-like language ('X days prior "
                  "to ...'). Do NOT create a reports[] entry for a requirement to establish, maintain, or "
                  "update a public-facing website or alternative online medium, even if the website must "
                  "be updated on a recurring schedule (e.g., 'quarterly') or must display information such "
                  "as annual monitoring results, current plans, or Project status — publishing information "
                  "on a public website is not a report submitted to the EAO, no matter what content the "
                  "website must contain or how often it must be updated. Only create an entry for "
                  "something reported IN ADDITION to the plan, such as "
                  "periodic monitoring results. Every entry you create must be grounded in real, distinct "
                  "report_title and submission_schedule/timing details stated in the condition text — never "
                  "create a placeholder or duplicate entry just because a report_type gate matched "
                  "somewhere in the condition. If you are only confident about one genuine report, return "
                  "exactly one entry."
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
                            "triggered 'As Needed' with a short response window (e.g., 'Within 72 hours of "
                            "non-compliance'). "
                            "'Compliance Self-Report': a self-reported compliance status report, typically tied "
                            "to project phases and/or a fixed annual date. "
                            "'Management Plan Associated Report': a report on the ongoing STATUS, RESULTS, or "
                            "IMPLEMENTATION of a specific NAMED plan — see linked_management_plan_name. E.g. "
                            "periodic monitoring results tied to a management plan, or an implementation "
                            "status update. Do NOT use this for the plan's own development, initial "
                            "submission to the EAO, or later updates/revisions to the plan document itself — "
                            "that lifecycle is captured separately as a management plan deliverable, not a "
                            "report. Only extract a Management Plan Associated Report when something is submitted IN "
                            "ADDITION to the plan document. "
                            "'Project Status Notification': a notification about project status — see "
                            "report_subtype. "
                            "'Monitoring/Technical Report': a technical or environmental monitoring report. "
                            "Do NOT use any report_type for language about retaining/appointing/engaging an "
                            "Independent Environmental Monitor (IEM) or developing/submitting the IEM's "
                            "Terms of Engagement — that is captured separately as an IEM Terms of Engagement "
                            "deliverable, not a report. Do NOT use any report_type for a report the condition "
                            "states must be written/authored by the IEM rather than the Holder (e.g. 'the "
                            "reports must be written by the IEM') — even a detailed, genuine report "
                            "requirement like this must be excluded entirely, because it is submitted by the "
                            "IEM directly to the EAO and the Holder must not have submission access to it."
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
                            "Only applicable when report_type is 'Management Plan Associated Report'. The name of the "
                            "specific plan this report is about (e.g., 'Aquatic Effects Monitoring Plan'), "
                            "written in title case. Null if this report is not tied to a specific named plan."
                        ),
                      },
                      "recipients": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "The names of the stakeholders that the condition explicitly states should receive the report. Often the EAO or other government agencies. E.g. EAO, MOE, MOH. The general public, or 'the website'/'alternative online medium', is NOT a valid report recipient — if the only 'recipient' you can identify is the public via a website, this is not a report at all, and no reports[] entry should be created for it."
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
                                    "The project phase DURING WHICH this submission occasion falls — i.e. "
                                    "the phase the project is actually in when the report is due, not "
                                    "necessarily the phase named in the timing language. The chronological "
                                    "phase sequence is: Post-Issuance (right after the Certificate is "
                                    "issued, before pre-construction work begins), Pre-Construction, "
                                    "Construction, Operations, Closure, Post-Closure. For 'X days/months "
                                    "prior to the start of <phase>' wording, the submission happens BEFORE "
                                    "<phase> begins, so use the phase immediately preceding <phase> in that "
                                    "sequence — e.g. 'at least 30 days prior to the start of Construction' "
                                    "is due during 'Pre-Construction', 'prior to the start of Operations' is "
                                    "due during 'Construction', and 'prior to the start of Pre-Construction "
                                    "activities' (or any requirement tied to the Certificate's issuance "
                                    "itself, e.g. a primary contact notification due shortly after the "
                                    "Certificate is issued) is due during 'Post-Issuance'. Do NOT apply this "
                                    "preceding-phase rule to 'within X days OF/AFTER the commencement of "
                                    "<phase>' wording — that is the OPPOSITE case: the milestone has already "
                                    "happened and the submission follows it, so the project is already IN "
                                    "<phase> (or has just entered it) — use <phase> itself, e.g. 'within 30 "
                                    "days of the commencement of Construction' is due during 'Construction', "
                                    "NOT 'Pre-Construction' (contrast with 'at least 30 days PRIOR TO the "
                                    "start of Construction', which IS due during 'Pre-Construction'). Only "
                                    "use the named phase itself ('Construction', 'Operations', etc.) when the "
                                    "submission recurs DURING that phase (e.g., 'annually during "
                                    "Construction'), is triggered by/follows a milestone within that phase "
                                    "(e.g. 'within 30 days of the commencement/suspension of <phase>'), or is "
                                    "otherwise due after that phase has started. Use 'All Phases' "
                                    "when the report recurs continuously across all phases, or when it is "
                                    "event-triggered without a specific phase (e.g., a non-compliance "
                                    "notification). Some certificates use the term 'Decommissioning' for "
                                    "what this phase list calls 'Closure' — map 'commencement/suspension/"
                                    "completion of Decommissioning' language onto 'Closure' (or, per the "
                                    "preceding-phase rule above, 'Operations' for something due prior to the "
                                    "start of Decommissioning)."
                                ),
                              },
                              "frequency": {
                                "type": "string",
                                "enum": REPORT_FREQUENCIES,
                                "description": (
                                    "How often the report must be submitted for this phase/occasion. Use "
                                    "'As Needed' when submission is triggered by an event (e.g., a "
                                    "non-compliance, a contact change) rather than a fixed schedule — typical "
                                    "for Compliance Notification and Project Status Notification. Use "
                                    "'One Time' for a single submission tied to a milestone or phase. Use "
                                    "'Annually', 'Semi-Annually', 'Quarterly', or 'Monthly' for a fixed "
                                    "recurring schedule. Use 'Other' only for Compliance Self-Report or "
                                    "Management Plan Associated Report entries whose schedule doesn't fit the "
                                    "above — describe the actual schedule in 'timing' instead."
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

# For these report types, condition-web doesn't even display a report_title
# column (see ReportPhaseAccordion.tsx's `isCN`/PSN "Sub-Condition + Type"
# branches) — identity is fully captured by report_type (+ report_subtype for
# PSN), so report_title is decorative, not a meaningful distinguishing key,
# and must be ignored when grouping duplicates (the model isn't guaranteed to
# phrase it identically across entries within the same response).
_REPORT_TYPES_WITHOUT_MEANINGFUL_TITLE = {
    "Compliance Notification",
    "Compliance Self-Report",
    "Project Status Notification",
}

def _normalize_report_key_part(value: Optional[str]) -> str:
    return (value or "").strip().lower()

def _merge_duplicate_reports(reports: list) -> list:
    """Merge reports[] entries that represent the same underlying report.

    The GPT format call is instructed to produce one entry per distinct report
    with every recurrence listed as its own submission_schedule occasion, but
    it doesn't always follow that instruction — it can still split one
    recurring report into several entries (e.g. one per project phase). This
    merges entries that share the same report_type, report_title,
    report_subtype, and linked_management_plan_name so that a prompt slip
    here doesn't reach staff/the database as duplicate reports.
    """
    merged: Dict[tuple, Dict[str, Any]] = {}
    order = []

    for report in reports:
        report_type = report.get("report_type")
        title_part = (
            ""
            if report_type in _REPORT_TYPES_WITHOUT_MEANINGFUL_TITLE
            else _normalize_report_key_part(report.get("report_title"))
        )
        key = (
            report_type,
            title_part,
            report.get("report_subtype"),
            _normalize_report_key_part(report.get("linked_management_plan_name")),
        )

        if key not in merged:
            merged[key] = {
                **report,
                "recipients": list(report.get("recipients") or []),
                "submission_schedule": list(report.get("submission_schedule") or []),
            }
            order.append(key)
            continue

        existing = merged[key]
        for recipient in report.get("recipients") or []:
            if recipient not in existing["recipients"]:
                existing["recipients"].append(recipient)

        for occasion in report.get("submission_schedule") or []:
            if occasion not in existing["submission_schedule"]:
                existing["submission_schedule"].append(occasion)

    return [merged[key] for key in order]

def extract_report_info_from_json(input_json: Dict[str, Any]) -> Dict[str, Any]:
    for condition in input_json.get("conditions", []):
        logger.info("Checking if condition %s requires report submission(s):", condition.get('condition_number'))

        condition_name = condition["condition_name"] + "\n\n" if condition["condition_name"] else ""
        condition_text = condition_name + condition["condition_text"]
        report_info = extract_report_info(condition_text)

        if report_info is not None:
            condition["report_submissions"] = _merge_duplicate_reports(json.loads(report_info)["reports"])
        else:
            condition["report_submissions"] = []

    return input_json
