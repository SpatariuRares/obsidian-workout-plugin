import os
import re
import json

# Configuration
SEARCH_DIR = "."
OUTPUT_DIR = "strings_found"
INCLUDE_EXTS = {".ts", ".tsx"}
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "coverage", ".obsidian", ".gemini", "renderers", "strings_found", "constants"}
EXCLUDE_EXTENSIONS = {".pyc", ".pyo", ".pyd", ".pyi", ".mjs", ".css", ".test.ts", "main.ts"}
EXCLUDE_STRINGS = {"@app/","linearGradient",".heatmap-controls","data-",".widget-title","background-","stop-", "color-", "workout-","#","text-","obsidian", "main", 'click',  "div",'span', "opacity-", "0","\\n","none", "modal-field-visible", "modal-field-hidden",  "EmbeddedTableView","EmbeddedTimerView","default"," "}

# Regex to find strings: "..." or '...' handling escaped quotes
# Matches: Quote, then (escaped char OR non-quote char)*, then validation Quote
STRING_REGEX = re.compile(r"(['\"])(?:\\.|[^\\])*?\1")

def get_files_to_search(root_dir):
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Filter directories in-place
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            if any(filename.endswith(ext) for ext in INCLUDE_EXTS) and not any(filename.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
                yield os.path.join(dirpath, filename)

def extract_strings_from_file(filepath):
    found_strings = []
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            in_enum = False
            for line_num, line in enumerate(lines, 1):
                # Strip comments (simple check)
                stripped_line = line.strip()
                if stripped_line.startswith("//"):
                    continue
                
                # Check for Enum Start
                # Matches "enum Name {" or "export enum Name {"
                if re.match(r'^\s*(?:export\s+)?enum\s+', line):
                    in_enum = True
                
                # If we are in an enum block, checks for end or one-liner
                # Note: This simple logic assumes standard formatting where "}" closes the enum.
                # It handles one-liner "enum X { ... }" by filtering strings then checking for close.
                
                matches = STRING_REGEX.finditer(line)
                for match in matches:
                    if in_enum:
                        continue

                    s = match.group(0)
                    content = s[1:-1] # Remove quotes for check
                    
                    if len(s) > 2: 
                        # Check context - user requested to ignore createEl("tag") and cls: "class"
                        pre_match = line[:match.start()].rstrip()
                        if pre_match.endswith(".createEl(") or pre_match.endswith("cls:") or pre_match.endswith("className:") or pre_match.endswith("cls :"):
                            continue

                        # Check excludes
                        if any(content.startswith(ex) for ex in EXCLUDE_STRINGS):
                            continue
                            
                        found_strings.append({
                            "line": line_num,
                            "string": content
                        })

                # Check for Enum End
                if in_enum and "}" in line:
                    in_enum = False
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return found_strings

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    else:
        # cleanup old files in output dir
        for file in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, file)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")
    
    print("Searching for strings...")
    count = 0
    string_counts = {}
    string_files = {}
    
    for filepath in get_files_to_search(SEARCH_DIR):
        strings = extract_strings_from_file(filepath)
        if strings:
            # Update counts
            for item in strings:
                s = item["string"]
                string_counts[s] = string_counts.get(s, 0) + 1
                
                if s not in string_files:
                    string_files[s] = set()
                string_files[s].add(os.path.basename(filepath))

            # Generate output filename: string<BasenameCamelCase>.json
            basename = os.path.splitext(os.path.basename(filepath))[0]
            if not basename: continue
            
            # Simple capitalization
            name_part = basename[0].upper() + basename[1:]
            
            output_name = f"string{name_part}.json"
            output_path = os.path.join(OUTPUT_DIR, output_name)
            
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(strings, f, indent=2, ensure_ascii=False)
            
            count += 1
            
    # Write summary
    
    # Step: Check against constants
    CONSTANTS_DIR = os.path.join(".", "app", "constants")
    constant_strings = {}
    
    if os.path.exists(CONSTANTS_DIR):
        print(f"Scanning constants in {CONSTANTS_DIR}...")
        for root, _, files in os.walk(CONSTANTS_DIR):
            # Skip __tests__ directories
            if "__tests__" in root:
                continue
                
            for file in files:
                if (file.endswith(".ts") or file.endswith(".tsx")) and not file.endswith(".test.ts"):
                    path = os.path.join(root, file)
                    # Use the same extraction logic 
                    ft_strings = extract_strings_from_file(path)
                    for item in ft_strings:
                        # Store filename as location
                        constant_strings[item["string"]] = file
    
    summary_path = os.path.join(OUTPUT_DIR, "summary.json")
    # Convert to list of objects for nicer JSON
    # Check isPresent
    summary_list = []
    for k, v in string_counts.items():
        is_present = k in constant_strings
        location = constant_strings.get(k, None)
        files_list = list(string_files.get(k, []))
        files_list.sort()
        
        summary_item = {
            "string": k, 
            "count": v,
            "isPresent": is_present,
            "files": files_list
        }
        if location:
            summary_item["location"] = location
            
        summary_list.append(summary_item)

    # Sort by count descending
    summary_list.sort(key=lambda x: x["count"], reverse=True)
    
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_list, f, indent=2, ensure_ascii=False)

    print(f"Done. Created {count} JSON files in '{OUTPUT_DIR}'.")
    print(f"Created summary file at '{summary_path}' with {len(summary_list)} unique strings.")

if __name__ == "__main__":
    main()
