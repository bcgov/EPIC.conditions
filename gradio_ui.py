import gradio as gr
from gpt import compare_documents, extract_info, count_conditions, extract_all_conditions, extract_all_subconditions, extract_subcondition
import read_pdf

with gr.Blocks(theme=gr.themes.Soft()) as app:

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

                extract_subconditions_button = gr.Button("Extract Subconditions")
                subconditions = gr.JSON(label="Extracted Subconditions")

                extract_subconditions_button.click(
                    fn=extract_all_subconditions,
                    inputs=[completion_data],
                    outputs=[subconditions]
                )



    with gr.Tab("Condition Extractor & Merger"):

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

                submit_button = gr.Button("Submit")
                merged_chunks = gr.JSON(label="Merged Chunks")

                submit_button.click(
                    fn=extract_all_conditions,
                    inputs=[file_input, number_of_conditions],
                    outputs=[merged_chunks]
                )

        with gr.Row():
            with gr.Column(scale=1):
                extract_subconditions_button = gr.Button("Extract Subconditions")
                subconditions = gr.JSON(label="Extracted Subconditions")



                extract_subconditions_button.click(
                    fn=extract_all_subconditions,
                    inputs=[merged_chunks],
                    outputs=[subconditions]
                )


    with gr.Tab("Sub-condition Extractor"):

        # default rows for subcondition extraction
        condition = gr.Textbox(label="Condition", lines=10)

        # set default value for condition

        condition.value = "Where a condition of this EA Certificate requires the Holder to consult particular party or parties regarding the content of a management plan, the Holder must:\na) Provide written notice to each such party that:\ni) includes a copy of the management plan;\nii) invites the party to provide its views on the content of such management plan; and\niii) indicates:\ni. if a timeframe providing such views to the Holder is specified in the relevant condition of this EA Certificate, that the party may provide such views to the Holder within such timeframe; or\nii. if a timeframe providing such views to the Holder is not specified in the relevant condition of this EA Certificate, specifies a reasonable period during which the party may submit such views to the Holder;\nb) Undertake a full and impartial consideration of any views and other information provided by a party in accordance with the timelines specified in a notice given pursuant to paragraph (a);\nc) Provide a written explanation to each party that provided comments in accordance with a notice given pursuant to paragraph (a) as to:\ni) how the views and information provided by such party to the Holder received have been considered and addressed in a revised version of the management plan; or\nii) why such views and information have not been addressed in a revised version of the management plan;\nd) Maintain a record of consultation with each such party regarding the management plan; and\ne) Provide a copy of such consultation record to the EAO, the relevant party, or both, promptly upon the written request of the EAO or such party.\nThe Holder must prepare monthly reports on the Holder’s compliance with this Certificate. These reports must be retained by the Holder through the Construction phase of the Project and for five years after commencing Operations."

        submit_button = gr.Button("Submit")
        subconditions = gr.JSON(label="Extracted Subconditions")

        submit_button.click(
            fn=extract_subcondition,
            inputs=[condition],
            outputs=[subconditions]

        )



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
            fn=compare_documents,
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


    

    # with gr.Tab("Plan info extractor"):
    #     # default rows for subcondition extraction
    #     condition = gr.Textbox(label="Condition", lines=10)

    #     # set default value for condition

    #     condition.value = "Air Quality\n\nThe Holder must develop, in consultation with MOE, MOH, OGC, VCH and Aboriginal Groups, an air quality mitigation and monitoring plan, which must include at a minimum:\n Measures to monitor liquefaction facility air emissions and contaminants of concern for sources modelled in the Application;\n Procedures for regular reporting of liquefaction facility air emission data gathered, including reporting to the appropriate government agencies, Aboriginal Groups and the public; and\n An adaptive management plan to address effects of the Project related to air quality from liquefaction facility emissions in the event (i) those effects are not mitigated to the extent identified in the Application, or (ii) effects related to air quality occur that were not predicted in the Application.\n\nA Qualified Professional must develop the plan and supervise the implementation of the plan. The Holder must provide the plan to EAO, MOE, MOH, OGC, VCH and Aboriginal Groups no less than 30 days prior to the Holder’s planned date to commence Commissioning. The Holder must implement the plan to the satisfaction of EAO."

    #     submit_button = gr.Button("Submit")
    #     subconditions = gr.JSON(label="Extracted Plan Info")

    #     submit_button.click(
    #         fn=extract_management_plan_info,
    #         inputs=[condition],
    #         outputs=[subconditions]

    #     )


    #     json_input = gr.File(label="JSON Input")
    #     json_submit_button = gr.Button("Submit")

    #     json_submit_button.click(
    #         fn=extract_management_plan_info_from_json,
    #         inputs=[json_input]
    #         # outputs=[subconditions]
    #     )



app.launch(server_name="0.0.0.0", server_port=7860)