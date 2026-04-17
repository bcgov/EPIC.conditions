"""Management plan extraction used by the cron extraction pipeline."""

import json
import logging

from typing import Any, Dict, Optional

from condition_cron.extraction.client import get_openai_client

logger = logging.getLogger(__name__)

def management_plan_required(input_condition_text: str) -> bool:
   
  tools = [
    {
      "type": "function",
      "function": {
        "name": "extract_info",
        "description": "If the condition requires a specific external plan/report/proposal/summary/etc. document to be written, extract the info related to the document.",

        "parameters": {
          "type": "object",
          "properties": {

            "requires_plan": {
              "type": "boolean",
              "description": "Does the condition explicitly state that a specific external plan/report/proposal/etc. document (e.g., air quality management plan, wildlife action plan, pollution mitigation plan, mountain goat proposal, frog monitoring report) should be written/submitted? If a condition only outlines how plans should be written/developed/handled or simply references a management plan without requiring one to be written, it should be marked False.",
            },

          },
          "required": ["extract_info"],
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

  # If result is not null, return the value of contains_subconditions
  if result:
    return result["requires_plan"]
  
  else:
    logger.error("management_plan_required: result is null")
    return False

def extract_management_plan_info_using_gpt(condition_text: str) -> str:
   
  tools = [
    {
      "type": "function",
      "function": {
        "name": "format_info",
        "description": "Format the information extracted from the condition.",
        "parameters": {
          "type": "object",
          "properties": {
            "deliverables": {
              "type": "array",
              "items": {
                "type": "object",
                  "properties": {
                      "deliverable_name": {
                        "type": "string",
                        "description": "The name of the plan/report/proposal/etc. that the condition is requiring to be written. E.g. Air Quality Mitigation and Monitoring Plan, Marine Water Quality Management and Monitoring Plan for Operations, etc. Write it in title case (E.g. The Catcher in the Rye)."
                      },
                      "is_plan": {
                        "type": "boolean",
                        "description": "Whether or not the deliverable is a \"Plan\" document (e.g., Management Plan, Monitoring Plan, Mitigation Plan, etc.). False if not specified."
                      },
                      "approval_type": {
                        "type": "string", 
                        "enum": ["Acceptance", "Satisfaction"],
                        "description": "If the plan/report/proposal/etc. is explicitly stated to be to either the \"acceptance\" of or to the \"satisfaction\" of the Environmental Assessment Office (EAO). Is null if not specified."
                      },
                      "stakeholders_to_consult": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "The names of the stakeholders that the condition explicitly states that the plan/report/proposal/etc. must be developed in consultation with. Often includes government agencies, First Nations, etc. E.g. MOE, MOH, OGC, VCH, Aboriginal Groups, Semiahmoo First Nation, etc."
                        },
                      },
                      "stakeholders_to_submit_to": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "The names of the stakeholders that the condition explicitly states should receive the plan/report/proposal/etc.. Often includes the EAO, other government agencies, First Nations, etc. E.g. MOE, MOH, OGC, VCH, Aboriginal Groups, Semiahmoo First Nation, etc."
                        },
                      },
                      "fn_consultation_required": {
                        "type": "boolean",
                        "description": "Whether the plan/report/proposal/etc. requires consultation with indigenous nations/First Nations/aboriginal peoples, etc. False if not explicitly specified."
                      },
                      "related_phase": {
                        "type": "string",
                        "description": "The phase of the project that the plan/report/proposal/etc.'s due date is related to. E.g. Construction, Construction of Upgrades, Operation, Decommissioning, etc. Write it in title case. Is null if not specified."
                      },
                      "days_prior_to_commencement": {
                        "type": "integer",
                        "description": "The number of days prior to the planned commencement that the plan/report/proposal/etc. must be provided to the EAO. Is negative if due after commencement. Is 0 if simple due before commencement without a specific number of days. Is null if not specified."
                      },
                  },
                  "required": ["deliverable_name", "approval_type", "stakeholders_to_consult", "related_phase", "days_prior_to_commencement"],
              }
            }
          },
          "required": ["deliverables"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is a condition written by the Environmental Assessment Office:\n\n{condition_text}\n\nFormat the information related to the management plan."}]

  client = get_openai_client()
  completion = client.chat.completions.create(
      model="gpt-4o-2024-05-13",
      messages=messages,
      tools=tools,
      temperature=0.0,
      tool_choice={"type": "function", "function": {"name": "format_info"}}
  )

  return completion.choices[0].message.tool_calls[0].function.arguments

def extract_management_plan_info(condition_text: str) -> Optional[str]:
    if management_plan_required(condition_text):
        logger.debug("This condition requires a deliverable!")
        return extract_management_plan_info_using_gpt(condition_text)
    else:
        logger.debug("This condition does not require a deliverable.")
        return None

def extract_management_plan_info_from_json(input_json: Dict[str, Any]) -> Dict[str, Any]:
    for condition in input_json.get("conditions", []):
        logger.info("Checking if condition %s requires deliverable(s):", condition.get('condition_number'))

        condition_name = condition["condition_name"] + "\n\n" if condition["condition_name"] else ""
        condition_text = condition_name + condition["condition_text"]
        management_plan_info = extract_management_plan_info(condition_text)

        if management_plan_info is not None:
            condition["deliverables"] = json.loads(management_plan_info)["deliverables"]
        else:
            condition["deliverables"] = []

    return input_json
