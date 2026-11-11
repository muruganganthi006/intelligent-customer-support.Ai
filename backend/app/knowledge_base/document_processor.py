
from pathlib import Path

from docx import Document
from pypdf import PdfReader


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def extract_text(file_path: str) -> str:
    """
    Extract text from PDF, DOCX, or TXT documents.
    """

    path = Path(file_path)

    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"Document not found: {path}")

    extension = path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            "Unsupported file type. Upload PDF, DOCX, or TXT files."
        )

    extracted_text = ""

    # Extract text from PDF
    if extension == ".pdf":
        reader = PdfReader(str(path))

        pages = []

        for page in reader.pages:
            page_text = page.extract_text() or ""
            pages.append(page_text)

        extracted_text = "\n".join(pages)

    # Extract text from Word documents
    elif extension == ".docx":
        document = Document(str(path))

        paragraphs = [
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        ]

        table_text = []

        for table in document.tables:
            for row in table.rows:
                cells = [
                    cell.text.strip()
                    for cell in row.cells
                    if cell.text.strip()
                ]

                if cells:
                    table_text.append(" | ".join(cells))

        extracted_text = "\n".join(paragraphs + table_text)

    # Extract text from TXT files
    elif extension == ".txt":
        try:
            extracted_text = path.read_text(encoding="utf-8-sig")
        except UnicodeDecodeError:
            extracted_text = path.read_text(encoding="cp1252")

    extracted_text = extracted_text.strip()

    if not extracted_text:
        raise ValueError(
            "No readable text found in the document."
        )

    return extracted_text
