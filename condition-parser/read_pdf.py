import pdfplumber


def read_pdf(file_path):
    """Extract all text from a PDF file. Backward-compatible signature."""
    pdf_text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pdf_text += text + "\n"
    return pdf_text


def read_pdf_by_pages(file_path):
    """Extract text and tables from each page of a PDF.

    Returns a list of dicts:
        [{"page_number": 1, "text": "...", "tables": [[row1], [row2], ...]}, ...]
    """
    pages_data = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            tables = page.extract_tables() or []
            pages_data.append({
                "page_number": i + 1,
                "text": text,
                "tables": tables,
            })
    return pages_data


def read_pdf_tables(file_path):
    """Extract all tables from the PDF as a flat list.

    Returns a list of tables. Each table is a list of rows,
    and each row is a list of cell strings.
    """
    all_tables = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables() or []
            for table in tables:
                cleaned = []
                for row in table:
                    cleaned.append([cell if cell else "" for cell in row])
                all_tables.append(cleaned)
    return all_tables


def get_page_count(file_path):
    """Return the number of pages in the PDF."""
    with pdfplumber.open(file_path) as pdf:
        return len(pdf.pages)


def read_pdf_page_range(file_path, start_page, end_page):
    """Extract text from a specific range of pages (1-indexed, inclusive)."""
    pdf_text = ""
    with pdfplumber.open(file_path) as pdf:
        for i in range(start_page - 1, min(end_page, len(pdf.pages))):
            text = pdf.pages[i].extract_text()
            if text:
                pdf_text += text + "\n"
    return pdf_text
