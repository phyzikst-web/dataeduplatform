import os
import json
import re

labs_dir = 'labs'
answers_dir = os.path.join(labs_dir, 'ch09_answers')
output_file = 'html5/js-notebook/problems.js'

problems = []

# Get all lab files and sort them
lab_files = [f for f in os.listdir(labs_dir) if f.startswith('lab') and f.endswith('.js')]
lab_files.sort()

# Get all answer files and build a lookup by number
answer_map = {}
if os.path.isdir(answers_dir):
    for af in os.listdir(answers_dir):
        if af.startswith('ans') and af.endswith('.js'):
            # ans01_variables.js -> "01"
            num = re.match(r'ans(\d+)', af)
            if num:
                answer_map[num.group(1)] = af

for filename in lab_files:
    filepath = os.path.join(labs_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract comments part for markdown and code part
    lines = content.split('\n')
    
    is_comment_block = False
    markdown_lines = []
    code_lines = []
    title = filename
    
    for line in lines:
        if line.startswith('// ==='):
            continue
        
        if line.startswith('//'):
            # It's a comment line
            clean_line = line[2:].strip()
            
            if clean_line.startswith('참고:') or clean_line.startswith('실행:'):
                continue
                
            # Extract title if it's the first line like "실습 XX - ..."
            if clean_line.startswith('실습'):
                title = clean_line
                markdown_lines.append('## ' + clean_line)
                continue
            
            # Format markdown
            if clean_line.startswith('문제:'):
                markdown_lines.append('### ' + clean_line)
            elif clean_line.startswith('출력 예시:'):
                markdown_lines.append('### ' + clean_line)
                markdown_lines.append('```text')
            else:
                markdown_lines.append(clean_line)
        else:
            code_lines.append(line)
            
    # close code block if needed
    if '```text' in markdown_lines:
        markdown_lines.append('```')

    # Remove trailing empty strings from code lines
    while code_lines and code_lines[-1].strip() == '':
        code_lines.pop()
    while code_lines and code_lines[0].strip() == '':
        code_lines.pop(0)

    problem_id = filename.split('.')[0]
    
    # Extract lab number: lab01_variables -> "01"
    lab_num = re.match(r'lab(\d+)', filename)
    lab_num_str = lab_num.group(1) if lab_num else None

    problem_data = {
        'id': problem_id,
        'title': title,
        'markdown': '\n'.join(markdown_lines).strip(),
        'code': '\n'.join(code_lines).strip()
    }

    # Load answer code if available
    if lab_num_str and lab_num_str in answer_map:
        ans_filepath = os.path.join(answers_dir, answer_map[lab_num_str])
        with open(ans_filepath, 'r', encoding='utf-8') as f:
            ans_content = f.read()
        # Strip comment header lines (// === ... and // 실습 ... [정답])
        ans_lines = []
        for aline in ans_content.split('\n'):
            if aline.startswith('// ===') or (aline.startswith('//') and '[정답]' in aline):
                continue
            ans_lines.append(aline)
        # Trim
        while ans_lines and ans_lines[-1].strip() == '':
            ans_lines.pop()
        while ans_lines and ans_lines[0].strip() == '':
            ans_lines.pop(0)
        problem_data['answerCode'] = '\n'.join(ans_lines).strip()

    problems.append(problem_data)

# Write to problems.js
js_content = f"window.JS_PROBLEMS = {json.dumps(problems, ensure_ascii=False, indent=2)};"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated {output_file} with {len(problems)} problems.")
