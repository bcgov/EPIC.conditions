
import os
import json


import colorama
from colorama import Fore, Back, Style

from dotenv import load_dotenv
load_dotenv()
import read_pdf
from openai import OpenAI

# Get OPENAI_API_KEY from environment variables
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def compare_documents(model, prompt, file1, doc_type1, file2, doc_type2):

    # Print all parameters
    print("Model: ", model)
    print("Prompt: ", prompt)
    print("File 1: ", file1.name)
    print("Document Type 1: ", doc_type1)
    print("File 2: ", file2.name)
    print("Document Type 2: ", doc_type2)

    # Read the first file
    file1_text = None
    with open(file1.name, "r") as f:

        # If file is a PDF, convert it to text
        if file1.name.endswith(".pdf"):
            file1_text = read_pdf.read_pdf(file1.name)
        elif file1.name.endswith(".txt"):
            file1_text = f.read()
        else:
            return "File 1 is not a PDF or TXT file"

    #  Read the second file
    file2_text = None
    with open(file2.name, "r") as f:

        # If file is a PDF, convert it to text
        if file2.name.endswith(".pdf"):
            file2_text = read_pdf.read_pdf(file2.name)
        elif file2.name.endswith(".txt"):
            file2_text = f.read()
        else:
            return "File 2 is not a PDF or TXT file"


    full_message_for_gpt = f"""----- {doc_type1.upper()} -----\n{file1_text}\n\n----- {doc_type2.upper()} -----\n{file2_text}\n\n\n{prompt}"""

    print(full_message_for_gpt)

    # Create a completion using GPT API
    completion = client.chat.completions.create(
        model=model,
        messages=[
            # {"role": "system", "content": "You are an assistant."},
            {"role": "user", "content": full_message_for_gpt}
        ]
    )

    return completion.choices[0].message.content


def count_conditions(file_input):
  file_text = None
  with open(file_input.name, "r") as f:

      # If file is a PDF, convert it to text
      if file_input.name.endswith(".pdf"):
          file_text = read_pdf.read_pdf(file_input.name)
      elif file_input.name.endswith(".txt"):
          file_text = f.read()
      else:
          return "File 1 is not a PDF or TXT file"
      
  print(file_text)

  tools = [
    {
      "type": "function",
      "function": {
        "name": "count_conditions",
        "description": "Count the number of conditions in the document.",
        "parameters": {
          "type": "object",
          "properties": {
              "count": {
                "type": "integer",
                "description": "The number of conditions in the document."
              },
          },
          "required": ["count"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is a document with conditions:\n\n{file_text}"}]
  completion = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"
  )

  count_json = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)
  count = count_json["count"]

  return(count)

def extract_info(file_input, starting_condition_number, ending_condition_number):

  def validate_response(response, expected_count):
      try:
          response_json = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
          conditions = response_json.get("conditions", [])
          return len(conditions) == expected_count
      except Exception as e:
          print(f"Validation error: {e}")
          return False
      
  expected_count = ending_condition_number - starting_condition_number + 1


  file_text = None
  with open(file_input.name, "r") as f:

      # If file is a PDF, convert it to text
      if file_input.name.endswith(".pdf"):
          file_text = read_pdf.read_pdf(file_input.name)
      elif file_input.name.endswith(".txt"):
          file_text = f.read()
      else:
          return "File 1 is not a PDF or TXT file"
      
  # print(file_text)

  function_description = f"Conditions {starting_condition_number} (inclusive) up to and including {ending_condition_number} extracted from the document. Conditions always include the condition name. Conditions that have subconditions will include the separated subconditions. Subconditions will include their subconditions."

  if starting_condition_number == ending_condition_number:
    print(f"Extracting condition {starting_condition_number} from the document.")
    function_description = f"Only condition {starting_condition_number} extracted from the document. Always include the condition name. If the condition has subconditions, includes the separated subconditions. Subconditions will include their subconditions."

  tools = [
    {
      "type": "function",
      "function": {
        "name": "format_info",
        "description": "Format the information extracted from the document.",
        "parameters": {
          "type": "object",
          "properties": {
              "conditions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "condition_name": {"type": "string", "description": "The name of the condition."},
                        "condition_number": {"type": "integer", "description": "The number associated with the condition."},
                        "condition_text": {"type": "string", "description": "The text of the condition. Fix spacing issues."},
                        "subconditions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "subcondition_identifier": {"type": "string", "description": "The number, letter, or other identifier of the subcondition. E.g. 1), 1 a), i, etc. Write it exactly as it appears in the text (i.e. include brackets)."},
                                    "subcondition_text": {"type": "string", "description": "The text of the subcondition."},
                                    "subconditions": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "subcondition_identifier": {"type": "string", "description": "The number, letter, or other identifier of the subcondition. E.g. 1), 1 a), i, etc. Write it exactly as it appears in the text (i.e. include brackets)."},
                                                "subcondition_text": {"type": "string", "description": "The text of the subcondition."},
                                                
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                "description": function_description,
              },
          },
          "required": ["conditions", "conditions.condition_name"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is a document with conditions:\n\n{file_text}"}]

  for attempt in range(3):  # Retry up to 3 times
      completion = client.chat.completions.create(
          model="gpt-4o",
          messages=messages,
          tools=tools,
          tool_choice="auto"
      )

      if validate_response(completion, expected_count):
          print(Fore.GREEN + f"Successfully extracted conditions {starting_condition_number} to {ending_condition_number}!" + Fore.RESET)
          return completion, completion.choices[0].message.tool_calls[0].function.arguments
      

      print(Fore.RED + completion.choices[0].message.tool_calls[0].function.arguments + Fore.RESET)
      print(Fore.RED + f"\nAttempt {attempt + 1}: Validation failed. Retrying...\n" + Fore.RESET)

  return None, "Failed to extract the correct number of conditions after multiple attempts"


def extract_info_chunked(file_input, number_of_conditions, chunk_size=5):
  
  chunks = []

  for i in range(0, number_of_conditions, chunk_size):
    end = min(i + chunk_size, number_of_conditions)


    print(Fore.YELLOW + "\nExtracting conditions", i + 1, "to", end, f"of {number_of_conditions}\n" + Fore.RESET)
    chunk_completion, chunk = extract_info(file_input, i + 1, end)
    print(Fore.GREEN + chunk + Fore.RESET)
    chunks.append(chunk) 

  return chunks

def merge_json_chunks(chunks):

  merged = {
    "conditions": []
  }

  for chunk in chunks:
    chunk_json = json.loads(chunk)
    merged["conditions"].extend(chunk_json["conditions"])

  return json.dumps(merged) 


def extract_all_conditions(file_input, number_of_conditions, chunk_size=5):

  chunks = extract_info_chunked(file_input, number_of_conditions, chunk_size)
  merged = merge_json_chunks(chunks)
  print(Fore.GREEN + "\nSuccessfully extracted all conditions!" + Fore.RESET)
  return merged