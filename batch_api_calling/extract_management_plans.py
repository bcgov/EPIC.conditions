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
        "name": "extract_plan_info",
        "description": "If the input condition requires a specific external plan document to be written, extract the info related to the plan.",

        "parameters": {
          "type": "object",
          "properties": {

            "requires_plan": {
              "type": "boolean",
              "description": "Does the condition explicitly state that a specific external plan document (e.g., air quality management plan, wildlife action plan, pollution mitigation plan) should be written? If a condition only outlines how plans should be written/developed/handled or simply references a management plan without requiring one to be written, it should be marked False. Do not count proposals; these should be marked False.",
              # "description": "Does the condition explicitly state that a specific external plan document should be written? For example: air quality management plan, wildlife action plan, pollution mitigation plan, etc. Some conditions outline requirements for how plans should be written/developed/handled, but do not say a specific plan must be written. In these cases, this should be False. If a condition simply references a management plan but doesn't specifically require one to be written, this should be False. Do not count proposals (this should be false).",
            },

          },
          "required": ["requires_plan"],
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
    tool_choice={"type": "function", "function": {"name": "extract_plan_info"}}
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
              "plan_name": {
                "type": "string",
                "description": "The name of the plan that the condition is requiring to be written. E.g. Air Quality Mitigation and Monitoring Plan, Marine Water Quality Management and Monitoring plan, etc. Write it in title case."
              },
              "approval_type": {
                "type": "string", 
                "enum": ["Acceptance", "Satisfaction"],
                "description": "If the plan is to the acceptance of or to the satisfaction of the Environmental Assessment Office (EAO). Is null if not specified."
              },
              "stakeholders_to_consult": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "The names of the stakeholders that the plan must be developed in consultation with. Often includes government agencies, First Nations, etc. E.g. MOE, MOH, OGC, VCH, Aboriginal Groups, Semiahmoo First Nation, etc."
                },
              },
              "fn_consultation_required": {
                "type": "boolean",
                "description": "Whether the plan requires consultation with indigenous nations/First Nations/aboriginal peoples, etc. False if not explicitly specified."
              },
              "related_phase": {
                "type": "string",
                "description": "The phase of the project that the plan's due date is related to. E.g. Construction, Operation, Decommissioning, etc. Write it in title case."
              },
              "days_prior_to_commencement": {
                "type": "integer",
                "description": "The number of days prior to the planned commencement that the plan must be provided to the EAO. Is null if not specified."
              },
          },
          "required": ["plan_name", "approval_type", "stakeholders_to_consult", "related_phase", "days_prior_to_commencement"],
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
        print(Fore.GREEN + "This condition requires a management plan!" + Fore.RESET)
        return extract_management_plan_info_using_gpt(condition_text)
    else:
        print(Fore.RED + "This condition does not require a management plan." + Fore.RESET)
        return None

def extract_management_plan_info_from_json(input_file_path, output_file_path):
    with open(input_file_path, "r") as f:
        input_json = json.load(f)

    for condition in input_json["conditions"]:
        print(Fore.YELLOW + f"\nChecking if condition {condition['condition_number']} requires a management plan:" + Fore.RESET)
        
        condition_name = condition["condition_name"] + "\n\n" if condition["condition_name"] else ""
        condition_text = condition_name + condition["condition_text"]
        management_plan_info = extract_management_plan_info(condition_text)
        
        if management_plan_info is not None:
            condition["required_plan"] = json.loads(management_plan_info)
          
    with open(output_file_path, "w") as f:
        json.dump(input_json, f, indent=4)

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
            extract_management_plan_info_from_json(input_file_path, output_file_path)

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