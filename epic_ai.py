import gradio as gr
from gpt import generate_poem, extract_info, check_sub_conditions, count_conditions
import read_pdf

with gr.Blocks() as demo:
    with gr.Tab("Document Comparison"):
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
    with gr.Tab("PDF to Text Converter"):
        file_input = gr.File(label="File Input")
        output = gr.Textbox(label="Output")
        submit_button = gr.Button("Submit")
        submit_button.click(
            fn=read_pdf.read_pdf,
            inputs=file_input,
            outputs=output
        )
    with gr.Tab("Condition Extractor"):

        file_input = gr.File(label="File Input")

        with gr.Row():
            count_conditions_button = gr.Button("Count Conditions")
            number_of_conditions = gr.Number(label="Number of Conditions", precision=0, value=0)
            count_conditions_button.click(
                fn=count_conditions,
                inputs=file_input,
                outputs=number_of_conditions
            )

        with gr.Row():
            with gr.Column(scale=1):

                # Slider for starting condition
                starting_condition = gr.Slider(minimum=1, maximum=100, label="Starting Condition", step=1)

                # Slider for ending condition
                ending_condition = gr.Slider(minimum=1, maximum=100, label="Ending Condition", step=1)

                submit_button = gr.Button("Submit")
                completion_object = gr.Textbox(label="Completion Object")
                completion_data = gr.JSON(label="Completion Data")
                submit_button.click(
                    fn=extract_info,
                    inputs=[file_input, starting_condition, ending_condition],
                    outputs=[completion_object, completion_data]
                )
                
    with gr.Tab("Sub Condition Checker"):
        text_input = gr.Textbox(label="Text Input")
        completion_object = gr.Textbox(label="Contains Sub Sections")
        completion_data = gr.JSON(label="Contains Sub Sections")
        submit_button = gr.Button("Submit")
        submit_button.click(
            fn=check_sub_conditions,
            inputs=text_input,
            outputs=[completion_object, completion_data]
        )

demo.launch()