import gradio as gr
from gpt import generate_poem

with gr.Blocks() as demo:
    with gr.Row():
        with gr.Column(scale=1):
            file_input_1 = gr.File(label="File Input 1")
            doc_type_1 = gr.Dropdown(choices=["Initial Project Description (IPD)", "Detailed Project Description (DPD)", "Table of Conditions", "Other"], label="Document Type")
        with gr.Column(scale=1):
            file_input_2 = gr.File(label="File Input 2")
            doc_type_2 = gr.Dropdown(choices=["Initial Project Description (IPD)", "Detailed Project Description (DPD)", "Table of Conditions", "Other"], label="Document Type")
    
    with gr.Column():
        model = gr.Dropdown(label="Model", choices=["gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o"], value="gpt-4o")
        prompt = gr.Textbox(label="Prompt")
    
    submit_button = gr.Button("Submit")

    output = gr.Textbox(label="Output")

    submit_button.click(
        fn=generate_poem,
        inputs=[model, prompt, file_input_1, doc_type_1, file_input_2, doc_type_2],
        outputs=output
    )

demo.launch()