#!/usr/bin/env python3
"""
Add internal glossary links to eating disorder terms across site content pages.
Rules:
- Only link the FIRST occurrence per page
- Never link inside nav, header, footer, title, meta, h1-h4, or existing <a> tags
- Never add links to the glossary page itself
- Only link body content (p, li, dd, article content)
- Match case-insensitively, preserve original capitalization
"""

import os
import re

SITE_ROOT = "/Users/alynnedavis/Desktop/alynne-davis-site"

# Term → (anchor, title_text)
# Order matters: longer/more specific terms first to avoid partial matches
TERMS = [
    # Multi-word terms first (most specific)
    ("binge eating disorder", "term-bed", "What is binge eating disorder?"),
    ("atypical anorexia", "term-atypical-anorexia", "What is atypical anorexia?"),
    ("anorexia nervosa", "term-anorexia", "What is anorexia nervosa?"),
    ("bulimia nervosa", "term-bulimia", "What is bulimia nervosa?"),
    ("disordered eating", "term-disordered-eating", "What is disordered eating?"),
    ("body image", "term-body-image", "What is body image?"),
    ("diet culture", "term-diet-culture", "What is diet culture?"),
    ("intuitive eating", "term-intuitive-eating", "What is intuitive eating?"),
    ("emotional eating", "term-emotional-eating", "What is emotional eating?"),
    ("compulsive exercise", "term-compulsive-exercise", "What is compulsive exercise?"),
    ("fear foods", "term-fear-foods", "What are fear foods?"),
    ("food rules", "term-food-rules", "What are food rules?"),
    ("body checking", "term-body-checking", "What is body checking?"),
    ("body neutrality", "term-body-neutrality", "What is body neutrality?"),
    ("body positivity", "term-body-positivity", "What is body positivity?"),
    ("compensatory behaviors", "term-compensatory", "What are compensatory behaviors?"),
    ("compensatory behaviour", "term-compensatory", "What are compensatory behaviors?"),
    ("weight restoration", "term-weight-restoration", "What is weight restoration?"),
    ("refeeding syndrome", "term-refeeding", "What is refeeding syndrome?"),
    ("set point", "term-set-point", "What is set point theory?"),
    ("muscle dysmorphia", "term-muscle-dysmorphia", "What is muscle dysmorphia?"),
    ("night eating syndrome", "term-night-eating", "What is night eating syndrome?"),
    ("rumination disorder", "term-rumination", "What is rumination disorder?"),
    ("body shame", "term-body-shame", "What is body shame?"),
    ("food noise", "term-food-noise", "What is food noise?"),
    ("Health at Every Size", "term-haes", "What is Health at Every Size?"),
    ("wellness culture", "term-wellness-culture", "What is wellness culture?"),
    ("weight stigma", "term-weight-stigma", "What is weight stigma?"),
    ("binge eating", "term-bed", "What is binge eating?"),  # after "binge eating disorder"
    # Single-word / acronym terms
    ("anorexia", "term-anorexia", "What is anorexia nervosa?"),
    ("bulimia", "term-bulimia", "What is bulimia nervosa?"),
    ("ARFID", "term-arfid", "What is ARFID?"),
    ("orthorexia", "term-orthorexia", "What is orthorexia?"),
    ("OSFED", "term-osfed", "What is OSFED?"),
    ("purging", "term-purging", "What is purging?"),
    ("refeeding", "term-refeeding", "What is refeeding?"),
    ("alexithymia", "term-alexithymia", "What is alexithymia?"),
    ("amenorrhea", "term-amenorrhea", "What is amenorrhea?"),
    ("lanugo", "term-lanugo", "What is lanugo?"),
    ("electrolyte", "term-electrolytes", "What are electrolytes?"),
    ("hypermetabolism", "term-hypermetabolism", "What is hypermetabolism?"),
    ("rumination", "term-rumination", "What is rumination disorder?"),
    ("pica", "term-pica", "What is pica?"),
    ("HAES", "term-haes", "What is Health at Every Size?"),
    ("Russell's Sign", "term-russells-sign", "What is Russell's Sign?"),
    ("BED", "term-bed", "What is binge eating disorder?"),
]

# Files to skip (glossary itself)
SKIP_FILES = {
    os.path.join(SITE_ROOT, "eating-disorder-glossary", "index.html")
}

def get_all_html_files():
    """Get all HTML files to process."""
    files = []

    # Blog posts
    blog_dir = os.path.join(SITE_ROOT, "blog")
    for subdir in os.listdir(blog_dir):
        path = os.path.join(blog_dir, subdir, "index.html")
        if os.path.isfile(path):
            files.append(path)

    # Learn pages
    learn_dir = os.path.join(SITE_ROOT, "learn")
    for subdir in os.listdir(learn_dir):
        path = os.path.join(learn_dir, subdir, "index.html")
        if os.path.isfile(path):
            files.append(path)

    # Specific pages
    specific = [
        "eating-disorder-therapist/index.html",
        "eating-disorder-therapy/index.html",
        "binge-eating-therapy-charlotte-nc/index.html",
        "trauma-informed-womens-therapy/index.html",
        "expressive-arts-therapy/index.html",
        "soul-nourishment/index.html",
        "eating-disorder-quiz/index.html",
    ]
    for rel in specific:
        path = os.path.join(SITE_ROOT, rel)
        if os.path.isfile(path):
            files.append(path)

    return files


def is_inside_forbidden_tag(html, match_start, match_end):
    """
    Check if the match position is inside a forbidden tag context:
    nav, header, footer, title, meta, h1-h4, a
    """
    # Tags that we must NOT link inside
    forbidden_open = re.compile(
        r'<(nav|header|footer|title|h[1-4]|a)(\s[^>]*)?>',
        re.IGNORECASE
    )
    forbidden_close = re.compile(
        r'</(nav|header|footer|title|h[1-4]|a)>',
        re.IGNORECASE
    )

    # Find the innermost open tag that contains our match
    # Strategy: scan from beginning, track open/close stack
    # For performance, only look at the content before our match
    before = html[:match_start]

    # Find all open and close tags in `before`, track nesting for forbidden tags
    tag_stack = []
    pos = 0
    while pos < len(before):
        # Find next tag
        tag_match = re.search(r'<(/?)(\w+)(\s[^>]*)?>',  before[pos:])
        if not tag_match:
            break
        abs_pos = pos + tag_match.start()
        tag_name = tag_match.group(2).lower()
        is_close = tag_match.group(1) == '/'

        if not is_close:
            if tag_name in ('nav', 'header', 'footer', 'title', 'h1', 'h2', 'h3', 'h4', 'a'):
                tag_stack.append(tag_name)
        else:
            if tag_name in ('nav', 'header', 'footer', 'title', 'h1', 'h2', 'h3', 'h4', 'a'):
                if tag_stack and tag_stack[-1] == tag_name:
                    tag_stack.pop()

        pos = abs_pos + len(tag_match.group(0))

    return len(tag_stack) > 0


def add_glossary_links(filepath):
    """Process a single file and add glossary links."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    linked_terms = set()  # Track which terms have been linked already

    for term, anchor, title_text in TERMS:
        # Skip if we already linked this anchor in this file
        if anchor in linked_terms:
            continue

        # Build a regex that matches the term case-insensitively as a whole word
        # For terms with special chars, escape them
        escaped_term = re.escape(term)

        # Word boundary handling: use \b for simple terms, custom for multi-word
        pattern = r'(?<![>\w])' + escaped_term + r'(?![<\w])'

        # For terms that end/start with non-word chars, adjust
        # Actually let's use a lookahead/lookbehind approach
        # Match the term when not inside an HTML tag attribute and surrounded by word boundaries
        pattern = r'(?i)(?<![a-zA-Z])(' + escaped_term + r')(?![a-zA-Z])'

        regex = re.compile(pattern)

        # Find all matches
        matches = list(regex.finditer(content))

        found_valid = False
        for m in matches:
            start, end = m.start(1), m.end(1)

            # Check: is this inside a tag attribute (between < and >)?
            # Find the character before this match walking back to see if we're in a tag
            before_match = content[max(0, start-500):start]
            # Count unmatched < and >
            # Simple heuristic: if last unmatched bracket is <, we're inside a tag
            last_lt = before_match.rfind('<')
            last_gt = before_match.rfind('>')
            if last_lt > last_gt:
                # We're inside a tag attribute
                continue

            # Check if inside forbidden tags
            if is_inside_forbidden_tag(content, start, end):
                continue

            # Check: is it already inside an <a> tag? (double-check)
            # Look back for <a and forward for </a>
            before_200 = content[max(0, start-200):start]
            after_200 = content[end:end+200]

            # If there's an unclosed <a before us
            a_open_pos = before_200.rfind('<a ')
            a_close_pos = before_200.rfind('</a>')
            if a_open_pos > a_close_pos and a_open_pos != -1:
                continue

            # Valid match found
            found_valid = True
            original_text = m.group(1)
            link = f'<a href="/eating-disorder-glossary/#{anchor}" title="{title_text}">{original_text}</a>'
            content = content[:start] + link + content[end:]
            linked_terms.add(anchor)
            break

        if found_valid:
            # Content was modified, matches indices are now stale - that's fine, we only do first occurrence
            pass

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    files = get_all_html_files()
    modified_files = []

    for filepath in sorted(files):
        if filepath in SKIP_FILES:
            print(f"SKIP (glossary): {filepath}")
            continue

        rel_path = filepath.replace(SITE_ROOT + '/', '')
        try:
            changed = add_glossary_links(filepath)
            if changed:
                print(f"MODIFIED: {rel_path}")
                modified_files.append(filepath)
            else:
                print(f"no changes: {rel_path}")
        except Exception as e:
            print(f"ERROR in {rel_path}: {e}")

    print(f"\nTotal modified: {len(modified_files)} files")
    for f in modified_files:
        print(f"  - {f.replace(SITE_ROOT + '/', '')}")


if __name__ == '__main__':
    main()
