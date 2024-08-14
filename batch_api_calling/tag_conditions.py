import sys
sys.path.append('..')
import os
import argparse 
from colorama import Fore, Style
from openai import OpenAI
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def tag_condition(condition_text):
   
  tools = [
      {
          "type": "function",
          "function": {
              "name": "format_info",
              "description": "Format the information extracted from the document.",
              "parameters": {
                  "type": "object",
                  "properties": {
                      "tags": {"type": "array", "items": {"type": "string", "enum": ["Economic", "Health", "Heritage/Culture", "Environment", "Social"]}, "description": "List of one or more tags selected from the provided tag choices that best describe to the condition. Economic: employment, income, labour force, housing, accommodation, property values, etc. Health: air quality, acoustics, human health, etc. Heritage/Culture: heritage, culture, cultural sites, landmarks, etc. Environment: air quality, marine resources, aquatic resources, ecosystems, vegetation, greenhouse gas emissions, wildlife, etc. Social: land use, commmunity well-being, services and infrastructure, recreation, housing and accomodation, etc. (If none apply, leave blank)."},
                      "sub_tags": {"type": "array", "items": {"type": "string", "enum": ["Community Well-being", "Employment & Income", "Labour Force", "Housing & Accommodation", "Property Values", "Mammals", "Air Quality", "Marine Resources", "Aquatic Resources", "Ecosystems", "Marine Mammals", "Groundwater", "Vegetation", "Rare Plants", "Greenhouse Gas Emissions", "Wildlife", "Birds", "Amphibians", "Fish & Fish Habitat", "Surface Water", "Benthic Invertebrates", "Terrain", "Acoustics", "Human Health", "Aboriginal Interests", "Heritage Resources", "Accidents & Malfunctions", "Land & Resource Use", "L&RU Traditional Purposes", "Services & Infrastructure", "Transportation & Access", "Recreation", "Visual Quality", "Marine Transportation & Use"]}, "description": "List of one or more tags selected from the provided tag choices that best describe to the condition. (If none apply, leave blank)."},
                  },
                  "required": ["tags", "sub_tags"],
              },
          }
      }
  ]
  messages = [{"role": "user", "content": f"Here is a condition written by the Environmental Assessment Office:\n\n{condition_text}\n\nFormat the information."}]

  completion = client.chat.completions.create(
      model="gpt-4o-2024-05-13",
      messages=messages,
      tools=tools,
      temperature=0.0,
      tool_choice={"type": "function", "function": {"name": "format_info"}}
  )

  return completion.choices[0].message.tool_calls[0].function.arguments

def tag_conditions(input_json):
    
    # print the entire json
    print(json.dumps(input_json, indent=4))

    # for condition in input_json["conditions"]:
    #     print(Fore.YELLOW + f"Tagging condition {condition['condition_number']}" + Fore.RESET)
        
    #     condition_name = condition["condition_name"] + "\n\n" if condition["condition_name"] else ""
    #     condition_text = condition_name + condition["condition_text"]
    #     conditions = tag_condition(condition_text)
        
    #     if conditions is not None:
    #         condition["tags"] = json.loads(conditions)["tags"]
    #         condition["sub_tags"] = json.loads(conditions)["sub_tags"]

    return input_json

def tag_all_documents(jsons_folder_path, output_folder_path):
    if not os.path.exists(output_folder_path):
        os.makedirs(output_folder_path)

    for file in os.listdir(jsons_folder_path):
        if file.endswith('.json'):
            output_file_path = os.path.join(output_folder_path, file)
            if os.path.exists(output_file_path):
                print(f"Skipping {file} as it already exists in the output folder")
                continue
            print(Fore.CYAN + f"\nTagging conditions in {file}" + Style.RESET_ALL)
            input_file_path = os.path.join(jsons_folder_path, file)
            
            # Read the input JSON file
            with open(input_file_path, 'r') as f:
                input_json = json.load(f)
            
            # Process the JSON
            updated_json = tag_conditions(input_json)
            
            # Write the updated JSON to the output file
            with open(output_file_path, 'w') as f:
                json.dump(updated_json, f, indent=4)

    print(Fore.GREEN + f"SUCCESS: All conditions tagged. New JSONs in {output_folder_path}" + Style.RESET_ALL)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--jsons_folder_path', 
        type=str, 
        default='./condition_jsons_with_first_nations', 
        help='Path to the folder containing the JSONs (default: ./condition_jsons_with_first_nations)'
    )
    parser.add_argument(
        '--output_folder_path', 
        type=str, 
        default='./condition_jsons_with_tagged_conditions', 
        help='Path to the folder to save the updated JSONs (default: ./condition_jsons_with_tagged_conditions)'
    )
    args = parser.parse_args()

    tag_all_documents(args.jsons_folder_path, args.output_folder_path)