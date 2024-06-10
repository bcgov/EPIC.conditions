
# Get OPENAI_API_KEY from environment variables
import os
from dotenv import load_dotenv
load_dotenv()

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
        file1_text = f.read()
        print("File 1 Text: ", file1_text)

    #  Read the second file
    file2_text = None
    with open(file2.name, "r") as f:
        file2_text = f.read()
        print("File 2 Text: ", file2_text)
        


    full_message_for_gpt = f"""----- {doc_type1.upper()} -----\n{file1_text}\n\n----- {doc_type2.upper()} -----\n{file2_text}\n\n\n{prompt}"""

    print(full_message_for_gpt)

    # Create a completion using GPT API
    completion = client.chat.completions.create(
        model=model,
        messages=[
            # {"role": "system", "content": "You are a poetic assistant, skilled in explaining complex programming concepts with creative flair."},
            {"role": "user", "content": full_message_for_gpt}
        ]
    )

    return completion.choices[0].message.content


