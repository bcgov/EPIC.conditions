import sys
sys.path.append('..')
import os
import argparse 
from colorama import Fore, Style
from openai import OpenAI
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def management_plan_required(input_condition_text):
   
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
  completion = client.chat.completions.create(
    model="gpt-4o-2024-05-13",
    messages=messages,
    tools=tools,
    temperature=0.0,
    tool_choice={"type": "function", "function": {"name": "extract_info"}}
  )

  # print(completion)

  result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)

  # If result is not null, return the value of contains_subconditions
  if result:
    return result["requires_plan"]
  
  else:
    print(Fore.RED + "Error: result is null" + Fore.RESET)


def extract_management_plan_info_using_gpt(condition_text):
   
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
                      "approval_type": {
                        "type": "string", 
                        "enum": ["Acceptance", "Satisfaction", "Other"],
                        "description": "If the plan/report/proposal/etc. is explicitly stated to be to either the \"acceptance\" of or to the \"satisfaction\" of the Environmental Assessment Office (EAO). Is Other if not Satisfaction or Acceptance or if not specified."
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
                  "required": ["deliverable_name", "approval_type", "stakeholders_to_consult", "stakeholders_to_submit_to", "fn_consultation_required", "related_phase", "days_prior_to_commencement"]
              }
            }
          },
          "required": ["deliverables"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is a condition written by the Environmental Assessment Office:\n\n{condition_text}\n\nFormat the information related to the management plan."}]

  completion = client.chat.completions.create(
      model="gpt-4o-2024-05-13",
      messages=messages,
      tools=tools,
      temperature=0.0,
      tool_choice={"type": "function", "function": {"name": "format_info"}}
  )

  return completion.choices[0].message.tool_calls[0].function.arguments

def extract_management_plan_info(condition_text):
    if management_plan_required(condition_text):
        print(Fore.GREEN + "This condition requires a deliverable!" + Fore.RESET)
        return extract_management_plan_info_using_gpt(condition_text)
    else:
        print(Fore.RED + "This condition does not require a deliverable." + Fore.RESET)
        return None

def extract_management_plan_info_from_json(input_json):
    for condition in input_json["conditions"]:
        print(Fore.YELLOW + f"\nChecking if condition {condition['condition_number']} requires deliverable(s):" + Fore.RESET)
        
        condition_name = condition["condition_name"] + "\n\n" if condition["condition_name"] else ""
        condition_text = condition_name + condition["condition_text"]
        management_plan_info = extract_management_plan_info(condition_text)
        
        if management_plan_info is not None:
            condition["deliverables"] = json.loads(management_plan_info)["deliverables"]

    return input_json

def extract_all_management_plans(jsons_folder_path, output_folder_path):
    if not os.path.exists(output_folder_path):
        os.makedirs(output_folder_path)

    for file in os.listdir(jsons_folder_path):
        if file.endswith('.json'):
            output_file_path = os.path.join(output_folder_path, file)
            if os.path.exists(output_file_path):
                print(f"Skipping {file} as it already exists in the output folder")
                continue
            print(Fore.CYAN + f"\n\nExtracting management plan info from {file}" + Style.RESET_ALL)
            input_file_path = os.path.join(jsons_folder_path, file)
            
            # Read the input JSON file
            with open(input_file_path, 'r') as f:
                input_json = json.load(f)
            
            # Process the JSON
            updated_json = extract_management_plan_info_from_json(input_json)
            
            # Write the updated JSON to the output file
            with open(output_file_path, 'w') as f:
                json.dump(updated_json, f, indent=4)

    print(Fore.GREEN + f"SUCCESS: All management plans extracted to new JSONs in {output_folder_path}" + Style.RESET_ALL)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--jsons_folder_path', 
        type=str, 
        default='./condition_jsons', 
        help='Path to the folder containing the JSONs (default: ./condition_jsons)'
    )
    parser.add_argument(
        '--output_folder_path', 
        type=str, 
        default='./condition_jsons_with_management_plans', 
        help='Path to the folder to save the updated JSONs (default: ./condition_jsons_with_management_plans)'
    )
    args = parser.parse_args()

    extract_all_management_plans(args.jsons_folder_path, args.output_folder_path)