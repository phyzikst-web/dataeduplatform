import docx

doc = docx.Document(r"업로드파일\2. 객관식 퀴즈\스택과_큐__객관식문제.docx")
with open("docx_content.txt", "w", encoding="utf-8") as f:
    for para in doc.paragraphs:
        f.write(para.text + "\n")
