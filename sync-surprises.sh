#!/bin/bash
# Auto-sync allPages, titleMap, and dateMap in index.html (macOS compatible)
DIR="$(cd "$(dirname "$0")" && pwd)"
INDEX="$DIR/index.html"

ALL=$(ls -1 "$DIR"/*.html 2>/dev/null \
  | xargs -I{} basename {} .html \
  | grep -v '^index$' | grep -v '^rating-widget' | grep -v '^sync-surprises' | grep -v '^TEMPLATE$')

# Sort by date (from filename or file mtime), newest first
SORTABLE=""
for page in $ALL; do
  FILE="$DIR/$page.html"
  PD=$(echo "$page" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}')
  if [ -z "$PD" ]; then
    PD=$(date -r "$FILE" '+%Y-%m-%d' 2>/dev/null)
  fi
  MTIME=$(stat -f '%m' "$FILE" 2>/dev/null)
  SORTABLE="$SORTABLE$PD $MTIME $page\n"
done

PAGES=$(echo -e "$SORTABLE" | sed '/^$/d' | sort -t' ' -k1,1r -k2,2rn | awk '{print $3}')

# Build JS arrays
AP="var allPages = ["
TM="        var titleMap = {"
DM="        var dateMap = {"
FIRST_A=true; FIRST_T=true; FIRST_D=true

for page in $PAGES; do
  FILE="$DIR/$page.html"
  
  if [ "$FIRST_A" = true ]; then
    AP="$AP\n          '$page'"; FIRST_A=false
  else
    AP="$AP,\n          '$page'"
  fi

  TITLE=$(grep -oE '<title>[^<]+</title>' "$FILE" 2>/dev/null | head -1 | sed 's/<title>//;s/<\/title>//' | sed 's/"/\\"/g')
  if [ -n "$TITLE" ]; then
    if [ "$FIRST_T" = true ]; then
      TM="$TM\n            \"$page\": \"$TITLE\""; FIRST_T=false
    else
      TM="$TM,\n            \"$page\": \"$TITLE\""
    fi
  fi

  if ! echo "$page" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}'; then
    FD=$(date -r "$FILE" '+%Y-%m-%d' 2>/dev/null)
    if [ -n "$FD" ]; then
      if [ "$FIRST_D" = true ]; then
        DM="$DM\n            \"$page\": \"$FD\""; FIRST_D=false
      else
        DM="$DM,\n            \"$page\": \"$FD\""
      fi
    fi
  fi
done

AP="$AP\n        ];"
TM="$TM\n        };"
DM="$DM\n        };"

python3 -c "
import sys, re
with open('$INDEX','r') as f: c=f.read()
c=re.sub(r'var allPages = \[.*?\];', '''$AP''', c, flags=re.DOTALL)
c=re.sub(r'var titleMap = \{.*?^\s{8}\};', '''$TM''', c, flags=re.DOTALL|re.MULTILINE)
c=re.sub(r'var dateMap = \{.*?^\s{8}\};', '''$DM''', c, flags=re.DOTALL|re.MULTILINE)
with open('$INDEX','w') as f: f.write(c)
" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "WARNING: python3 replacement failed, manual update needed"
fi

echo "Synced $(echo "$PAGES" | wc -w | tr -d ' ') surprise pages"
