import os
import re

# Configuration
CONSTANTS_FILE = os.path.join("app", "constants", "TextConstants.ts")
SEARCH_DIR = "."
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "coverage", ".obsidian", ".gemini", "renderers", "strings_found"}
EXCLUDE_FILES = {"TextConstants.ts", "replace_strings_with_constants.py", "summary.json", "package.json", "package-lock.json", "tsconfig.json"}
INCLUDE_EXTS = {".ts", ".tsx"}

def parse_text_constants(filepath):
    """
    Parses TextConstants.ts to build a map of value -> constant path.
    e.g. { "Edit workout": "TEXT_CONSTANTS.UI.ACTIONS.EDIT_WORKOUT" }
    """
    if not os.path.exists(filepath):
        print(f"Error: Constants file not found at {filepath}")
        return {}
    
    mapping = {}
    path_stack = ["TEXT_CONSTANTS"]
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line or line.startswith("//"):
            continue
            
        # Match start of object: KEY: {
        match_obj = re.match(r'(\w+):\s*{', line)
        if match_obj:
            path_stack.append(match_obj.group(1))
            continue
            
        # Match end of object: },
        if line.startswith('}') or line.startswith('},'):
            if len(path_stack) > 1: # Don't pop ROOT
                path_stack.pop()
            continue
            
        # Match string property: KEY: "Value",
        match_prop = re.match(r'(\w+):\s*["\']([^"\']+)["\']', line)
        if match_prop:
            key, value = match_prop.groups()
            full_path = ".".join(path_stack) + "." + key
            
            # Only map if value is not empty and reasonably long/complex to avoid collisions
            # For this task, user wants ALL, so we map all.
            # But maybe exclude very short common words if ambiguous? 
            # User instructions "cerca ogni constante", implying all.
            mapping[value] = full_path

    return mapping

def add_import(content):
    """
    Adds import { TEXT_CONSTANTS } from "@app/constants"; to the content 
    if it's not already there.
    """
    if "TEXT_CONSTANTS" in content and "from \"@app/constants\"" in content:
         # Rough check if already imported
         # Check strict import existence to avoid false positives in comments
         if re.search(r'import\s*{[^}]*TEXT_CONSTANTS[^}]*}\s*from\s*["\']@app/constants["\']', content):
             return content

    # Check for existing @app/constants import to append to
    # Regex for: import { A, B } from "@app/constants"
    # We want to replace it with import { A, B, TEXT_CONSTANTS } from "@app/constants"
    
    existing_import = re.search(r'(import\s*{)([^}]*)(}\s*from\s*["\']@app/constants["\'];?)', content)
    if existing_import:
        prefix, current_imports, suffix = existing_import.groups()
        if "TEXT_CONSTANTS" not in current_imports:
             # Add it
             new_imports = current_imports.strip()
             if new_imports:
                 new_imports += ", TEXT_CONSTANTS"
             else:
                 new_imports = " TEXT_CONSTANTS "
                 
             return content.replace(existing_import.group(0), f"{prefix} {new_imports} {suffix}")
        return content

    # If no existing import from @app/constants, add it after the last import or at top
    new_import_line = 'import { TEXT_CONSTANTS } from "@app/constants";\n'
    
    # Try to insert after the last import
    last_import_idx = -1
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import_idx = i
            
    if last_import_idx != -1:
        lines.insert(last_import_idx + 1, new_import_line.strip())
        return '\n'.join(lines)
        
    # If no imports, insert at top
    return new_import_line + content

def process_file(filepath, mapping):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        replacements_count = 0
        
        # Sort mapping by length of string (descending) to replace longest matches first
        # This prevents partial replacements if one string is a substring of another
        sorted_values = sorted(mapping.keys(), key=len, reverse=True)
        
        for value in sorted_values:
            const_name = mapping[value]
            
            # Simple replace: "value" -> const_name
            # Need to handle both single and double quotes
            # And ensure we don't replace inside other words (unlikely for "quoted strings")
            
            # Pattern: quote + escaped(value) + quote
            pattern = r'([\'"])' + re.escape(value) + r'\1'
            
            # Only replace if strictly matching
            matches = list(re.finditer(pattern, content))
            if not matches:
                continue
                
            # Perform replacement
            # Use raw string for replacement to avoid escape issues
            content, n = re.subn(pattern, const_name, content)
            replacements_count += n
            
        if replacements_count > 0:
            content = add_import(content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}: {replacements_count} replacements")
            return replacements_count
            
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")
        
    return 0

def main():
    print("Building constants map...")
    mapping = parse_text_constants(CONSTANTS_FILE)
    print(f"Found {len(mapping)} constants.")
    
    # Debug: print top 5
    # for k, v in list(mapping.items())[:5]:
    #     print(f"  '{k}' -> {v}")
        
    total_files = 0
    total_replacements = 0
    
    print("Scanning codebase...")
    for root, dirs, files in os.walk(SEARCH_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file in EXCLUDE_FILES:
                continue
                
            _, ext = os.path.splitext(file)
            if ext not in INCLUDE_EXTS:
                continue
                
            filepath = os.path.join(root, file)
            # Skip the constants file definition itself to avoid recursive mess
            if os.path.abspath(filepath) == os.path.abspath(CONSTANTS_FILE):
                continue
                
            count = process_file(filepath, mapping)
            if count > 0:
                total_files += 1
                total_replacements += count
                
    print(f"Done. Replaced {total_replacements} occurrences in {total_files} files.")

if __name__ == "__main__":
    main()
