#!/bin/bash
# Slop Detector - Repository Architecture Analysis
# Usage: ./analyze-slop.sh <repository-path> [output-dir]

set -e

TARGET="${1:-.}"
OUTPUT_DIR="${2:-./docs}"

mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$OUTPUT_DIR/slop-report-$TIMESTAMP.md"

echo "# 🔍 Architecture Slop Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Repository:** \`$TARGET\`" >> "$REPORT_FILE"
echo "**Date:** $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TOTAL_ISSUES=0

# === PATTERN 1: Excessive Directory Depth ===
echo "## 🪆 Excessive Directory Depth (5+ levels)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

DEEP_DIRS=$(find "$TARGET" -type d \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    -mindepth 5 2>/dev/null | head -20 || echo "")

if [ -n "$DEEP_DIRS" ]; then
    echo "Directories nested 5+ levels deep:" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$DEEP_DIRS" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    COUNT=$(echo "$DEEP_DIRS" | wc -l)
    TOTAL_ISSUES=$((TOTAL_ISSUES + COUNT))
else
    echo "✅ No excessively deep directories found." >> "$REPORT_FILE"
fi

# === PATTERN 2: Single-File Directories ===
echo "" >> "$REPORT_FILE"
echo "## 📁 Single-File Directories" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

SINGLE_FILE_DIRS=""
while IFS= read -r dir; do
    FILE_COUNT=$(find "$dir" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | wc -l)
    SUBDIR_COUNT=$(find "$dir" -maxdepth 1 -type d 2>/dev/null | wc -l)
    SUBDIR_COUNT=$((SUBDIR_COUNT - 1))
    
    if [ "$FILE_COUNT" -eq 1 ] && [ "$SUBDIR_COUNT" -eq 0 ]; then
        FILE_NAME=$(find "$dir" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null)
        SINGLE_FILE_DIRS="$SINGLE_FILE_DIRS$dir/ → $(basename "$FILE_NAME")\n"
    fi
done < <(find "$TARGET" -type d ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "$TARGET" 2>/dev/null)

if [ -n "$SINGLE_FILE_DIRS" ]; then
    echo "Directories with only one file (consider flattening):" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo -e "$SINGLE_FILE_DIRS" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    COUNT=$(echo -e "$SINGLE_FILE_DIRS" | grep -c . || echo 0)
    TOTAL_ISSUES=$((TOTAL_ISSUES + COUNT))
else
    echo "✅ No single-file directories found." >> "$REPORT_FILE"
fi

# === PATTERN 3: Barrel Files (index.ts re-exports) ===
echo "" >> "$REPORT_FILE"
echo "## 🛢️ Barrel Files" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

BARRELS=$(find "$TARGET" -type f \( -name "index.ts" -o -name "index.js" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" 2>/dev/null | while read -r barrel; do
    EXPORT_COUNT=$(grep -c "^export" "$barrel" 2>/dev/null || echo 0)
    if [ "$EXPORT_COUNT" -gt 0 ]; then
        echo "$barrel ($EXPORT_COUNT exports)"
    fi
done | head -20 || echo "")

if [ -n "$BARRELS" ]; then
    echo "Index files re-exporting modules (can cause circular deps & bundle bloat):" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$BARRELS" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "✅ No barrel files found." >> "$REPORT_FILE"
fi

# === PATTERN 4: Empty Directories ===
echo "" >> "$REPORT_FILE"
echo "## 🕳️ Empty Directories" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

EMPTY_DIRS=$(find "$TARGET" -type d -empty \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" 2>/dev/null | head -20 || echo "")

if [ -n "$EMPTY_DIRS" ]; then
    echo "Empty directories to remove:" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$EMPTY_DIRS" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    COUNT=$(echo "$EMPTY_DIRS" | wc -l)
    TOTAL_ISSUES=$((TOTAL_ISSUES + COUNT))
else
    echo "✅ No empty directories found." >> "$REPORT_FILE"
fi

# === PATTERN 5: Enterprise Layer Smell ===
echo "" >> "$REPORT_FILE"
echo "## 🏢 Enterprise Layer Structure" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

LAYER_DIRS=""
for pattern in "controllers" "services" "repositories" "entities" "dto" "interfaces" "mappers" "factories" "providers" "adapters" "handlers" "managers"; do
    FOUND=$(find "$TARGET" -type d -iname "$pattern" \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" 2>/dev/null | head -5 || echo "")
    if [ -n "$FOUND" ]; then
        LAYER_DIRS="$LAYER_DIRS$FOUND\n"
    fi
done

if [ -n "$LAYER_DIRS" ]; then
    echo "Layer-based directories found (verify each layer adds value):" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo -e "$LAYER_DIRS" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Ask:** Does each layer add validation, transformation, caching, or business logic?" >> "$REPORT_FILE"
else
    echo "✅ No enterprise layer pattern detected." >> "$REPORT_FILE"
fi

# === PATTERN 6: Mirrored Directory Structures ===
echo "" >> "$REPORT_FILE"
echo "## 🪞 Potentially Mirrored Structures" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

MIRRORED=""
for base in "user" "product" "order" "item" "auth" "account" "payment"; do
    MATCHES=$(find "$TARGET" -type f \( -iname "${base}*.ts" -o -iname "${base}*.js" \) \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -path "*/dist/*" \
        ! -name "*.spec.*" \
        ! -name "*.test.*" 2>/dev/null | head -10 || echo "")
    
    if [ -n "$MATCHES" ]; then
        COUNT=$(echo "$MATCHES" | grep -c . || echo 0)
        if [ "$COUNT" -gt 2 ]; then
            MIRRORED="$MIRRORED\n### $base entity ($COUNT files):\n$MATCHES\n"
        fi
    fi
done

if [ -n "$MIRRORED" ]; then
    echo "Same entity spread across multiple layers:" >> "$REPORT_FILE"
    echo -e "$MIRRORED" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Consider:** Colocating related files by feature instead of layer." >> "$REPORT_FILE"
else
    echo "✅ No obvious mirrored structures found." >> "$REPORT_FILE"
fi

# === PATTERN 7: Type/Interface Directories ===
echo "" >> "$REPORT_FILE"
echo "## 📝 Separated Types/Interfaces" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TYPE_DIRS=$(find "$TARGET" -type d \( -iname "types" -o -iname "interfaces" -o -iname "models" -o -iname "dto" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" 2>/dev/null | head -10 || echo "")

if [ -n "$TYPE_DIRS" ]; then
    echo "Centralized type directories (consider colocating with implementations):" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    for dir in $TYPE_DIRS; do
        FILE_COUNT=$(find "$dir" -type f \( -name "*.ts" -o -name "*.js" \) 2>/dev/null | wc -l)
        echo "$dir/ ($FILE_COUNT files)"
    done >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "✅ No centralized type directories found." >> "$REPORT_FILE"
fi

# === PATTERN 8: Util/Helper/Common Directories ===
echo "" >> "$REPORT_FILE"
echo "## 🧰 Utils/Helpers/Common Directories" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

UTIL_DIRS=$(find "$TARGET" -type d \( -iname "utils" -o -iname "helpers" -o -iname "common" -o -iname "shared" -o -iname "lib" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" 2>/dev/null | head -10 || echo "")

if [ -n "$UTIL_DIRS" ]; then
    echo "Generic utility directories (often become dumping grounds):" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    for dir in $UTIL_DIRS; do
        FILE_COUNT=$(find "$dir" -type f \( -name "*.ts" -o -name "*.js" \) ! -name "*.spec.*" ! -name "*.test.*" 2>/dev/null | wc -l)
        echo "$dir/ ($FILE_COUNT files)"
    done >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Ask:** Could these be colocated with their consumers or extracted to packages?" >> "$REPORT_FILE"
else
    echo "✅ No generic utility directories found." >> "$REPORT_FILE"
fi

# === SUMMARY ===
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "## 📊 Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

DIR_COUNT=$(find "$TARGET" -type d ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" 2>/dev/null | wc -l)
FILE_COUNT=$(find "$TARGET" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" 2>/dev/null | wc -l)
MAX_DEPTH=$(find "$TARGET" -type d ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" -printf '%d\n' 2>/dev/null | sort -rn | head -1 || echo "?")

echo "| Metric | Value |" >> "$REPORT_FILE"
echo "|--------|-------|" >> "$REPORT_FILE"
echo "| Total directories | $DIR_COUNT |" >> "$REPORT_FILE"
echo "| Total TS/JS files | $FILE_COUNT |" >> "$REPORT_FILE"
echo "| Max depth | $MAX_DEPTH |" >> "$REPORT_FILE"
echo "| Issues flagged | $TOTAL_ISSUES |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 💡 Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **Flatten** single-file directories" >> "$REPORT_FILE"
echo "2. **Colocate** by feature instead of layer when possible" >> "$REPORT_FILE"
echo "3. **Remove** barrel files unless needed for public API" >> "$REPORT_FILE"
echo "4. **Question** each layer: what value does it add?" >> "$REPORT_FILE"

cat "$REPORT_FILE"
echo ""
echo "📄 Report saved to: $REPORT_FILE"