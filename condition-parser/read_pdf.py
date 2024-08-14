from PyPDF2 import PdfReader

def read_pdf(file_path):
    reader = PdfReader(file_path)
    pdf_text = ""
    for page in reader.pages:
        pdf_text += page.extract_text()
    return pdf_text

