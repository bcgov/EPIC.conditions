import tiktoken
encoding = tiktoken.get_encoding("o200k_base")
encoding = tiktoken.encoding_for_model("gpt-4o")

def num_tokens_from_string(string):

    encoding = tiktoken.get_encoding("o200k_base")
    encoding = tiktoken.encoding_for_model("gpt-4o")
    return len(encoding.encode(string))