#!/usr/bin/env python3
"""
Remove glossary links that were accidentally placed inside <script> tags.
Replace <a href="/eating-disorder-glossary/...">TEXT</a> with just TEXT inside script blocks.
"""

import re
import os

SITE_ROOT = "/Users/alynnedavis/Desktop/alynne-davis-site"

# Pattern to find glossary links
link_pattern = re.compile(
    r'<a href="/eating-disorder-glossary/#[^"]*"[^>]*>(.*?)</a>',
    re.IGNORECASE | re.DOTALL
)

def fix_script_tags(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'eating-disorder-glossary/#term-' not in content:
        return False

    original = content

    # Find all script tags and remove links from them
    def fix_script(m):
        script_content = m.group(0)
        # Remove any glossary links within this script tag, preserving link text
        fixed = link_pattern.sub(r'\1', script_content)
        return fixed

    # Replace glossary links inside script tags
    content = re.sub(
        r'<script[^>]*>.*?</script>',
        fix_script,
        content,
        flags=re.DOTALL | re.IGNORECASE
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

fixed = []
for root, dirs, files in os.walk(SITE_ROOT):
    for fn in files:
        if fn.endswith('.html'):
            fp = os.path.join(root, fn)
            changed = fix_script_tags(fp)
            if changed:
                rel = fp.replace(SITE_ROOT + '/', '')
                print(f"FIXED: {rel}")
                fixed.append(rel)

print(f"\nTotal fixed: {len(fixed)}")
