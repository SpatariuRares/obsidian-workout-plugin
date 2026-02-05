import os

def analyze_file_lengths(root_dir, top_n=50):
    """
    Analyzes file lengths (line count) in the given directory, excluding specific folders.
    """
    
    excluded_dirs = {
        'node_modules', '.git', 'dist', 'build', 'coverage', 
        '__tests__', 'tests', 'test',
        '.obsidian', '.idea', '.vscode', '__mocks__', '.tmp', '.github'
    }
    
    included_extensions = {
        '.ts', '.tsx',  '.scss'
    }

    file_stats = []

    print(f"Scanning directory: {root_dir}")
    print(f"Ignoring directories: {', '.join(excluded_dirs)}")
    print(f"Including extensions: {', '.join(included_extensions)}")
    print("-" * 50)

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Modify dirnames in-place to exclude directories
        dirnames[:] = [d for d in dirnames if d not in excluded_dirs]
        
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            if ext in included_extensions:
                file_path = os.path.join(dirpath, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        line_count = sum(1 for _ in f)
                        # Store relative path for cleaner output
                        rel_path = os.path.relpath(file_path, root_dir)
                        file_stats.append((rel_path, line_count))
                except Exception as e:
                    print(f"Could not read {file_path}: {e}")

    # Sort by line count descending
    file_stats.sort(key=lambda x: x[1], reverse=True)

    # Calculate stats
    total_files = len(file_stats)
    total_lines = sum(count for _, count in file_stats)
    avg_lines = total_lines / total_files if total_files > 0 else 0

    print(f"\nTotal Files Scanned: {total_files}")
    print(f"Total Lines of Code: {total_lines}")
    print(f"Average Lines per File: {avg_lines:.2f}")
    print("\nTop Largest Files:")
    print(f"{'Lines'} | {'File Path'}")
    print("-" * 60)

    for i, (path, count) in enumerate(file_stats[:top_n]):
        if count < 150:
            break
        print(f"{count} | {path}")

if __name__ == "__main__":
    # Assumes the script is run from the project root or scripts folder
    # We want to scan the project root. 
    # If script is in /path/to/project/scripts/analyze.py, root is ..
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    analyze_file_lengths(project_root)
