
# Get OPENAI_API_KEY from environment variables
import os
from dotenv import load_dotenv
load_dotenv()
import read_pdf
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_poem(model, prompt, file1, doc_type1, file2, doc_type2):

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


def extract_info_old():
  tools = [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get the current weather in a given location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA",
            },
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
          },
          "required": ["location"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": "What's the weather like in Boston today in C?"}]
  completion = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"
  )

  print(completion.choices[0].message.tool_calls[0].function.arguments)

def extract_info(file_input):

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
                        "condition_text": {"type": "string", "description": "The text of the condition."},
                    },
                },
                "description": "The first five of the the conditions extracted from the document.",
                # "description": "All of the the conditions extracted from the document.",

              },
          },
          "required": ["conditions"],
        },
      }
    }
  ]
  messages = [{"role": "user", "content": f"Here is a condition:\n\n{file_text}"}]
  completion = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"
  )

  return(completion, completion.choices[0].message.tool_calls[0].function.arguments)
  # return(completion)
