#!/usr/bin/env python3
"""
Simple script to inject console logger script tag into HTML files in dev mode.
In production mode, removes the console logger if present.
Automatically processes all HTML files in the public directory.
"""

import os
import sys
from pathlib import Path

# Get project root
project_root = Path(__file__).parent.parent
public_dir = project_root / 'public'
root_dir = project_root

# Check if we're in dev mode
is_dev = os.environ.get('NODE_ENV') != 'production'

# Console logger script tag (with comment)
CONSOLE_LOGGER_COMMENT = '    <!-- Console logger - streams browser console to file for Claude -->'
CONSOLE_LOGGER_SCRIPT = '    <script type="module" src="/shared/consoleLogger.ts"></script>'
CONSOLE_LOGGER = f'{CONSOLE_LOGGER_COMMENT}\n{CONSOLE_LOGGER_SCRIPT}'

def find_html_files(directory: Path) -> list[Path]:
    """Find all HTML files in directory recursively."""
    return sorted(directory.rglob('*.html'))

def inject_or_remove_console_logger(file_path: Path, inject: bool) -> bool:
    """
    Inject or remove console logger script tag before </body>.
    Returns True if file was modified.
    """
    if not file_path.exists():
        return False

    content = file_path.read_text(encoding='utf-8')

    # Check if console logger already exists
    has_logger = CONSOLE_LOGGER in content

    if inject and not has_logger:
        # Inject as first script in body (before any other scripts) or before </body>
        # This ensures console logger loads first to capture all console output

        # Try to inject before the first <script> tag in body
        body_start = content.find('<body')
        if body_start != -1:
            # Find the closing > of the body tag
            body_tag_end = content.find('>', body_start)
            if body_tag_end != -1:
                # Look for first <script> after body opening
                first_script = content.find('<script', body_tag_end)
                if first_script != -1:
                    # Inject before the first script
                    content = content[:first_script] + CONSOLE_LOGGER + '\n    ' + content[first_script:]
                    file_path.write_text(content, encoding='utf-8')
                    return True

        # Fallback: inject before </body> if no script found
        if '</body>' in content:
            content = content.replace('</body>', f'{CONSOLE_LOGGER}\n  </body>')
            file_path.write_text(content, encoding='utf-8')
            return True
    elif not inject and has_logger:
        # Remove console logger (both comment and script)
        content = content.replace(CONSOLE_LOGGER + '\n', '')
        content = content.replace(CONSOLE_LOGGER, '')
        # Also remove standalone comment if it exists
        content = content.replace(CONSOLE_LOGGER_COMMENT + '\n', '')
        content = content.replace(CONSOLE_LOGGER_COMMENT, '')
        # Also remove standalone script if it exists
        content = content.replace(CONSOLE_LOGGER_SCRIPT + '\n', '')
        content = content.replace(CONSOLE_LOGGER_SCRIPT, '')
        file_path.write_text(content, encoding='utf-8')
        return True

    return False

def main():
    """Process all HTML files."""
    mode = 'development' if is_dev else 'production'
    action = 'Injecting' if is_dev else 'Removing'
    print(f'{action} console logger ({mode} mode)...')

    # Find all HTML files in public directory and project root
    html_files = find_html_files(public_dir)
    html_files += sorted(f for f in root_dir.glob('*.html') if f not in html_files)

    if not html_files:
        print('  No HTML files found in public directory')
        return

    modified_count = 0

    for file_path in html_files:
        if inject_or_remove_console_logger(file_path, is_dev):
            modified_count += 1
            symbol = '✓' if is_dev else '✗'
            relative_path = file_path.relative_to(project_root)
            print(f'  {symbol} {relative_path}')

    if modified_count == 0:
        print(f'  All {len(html_files)} files already {"have" if is_dev else "without"} console logger')
    else:
        print(f'Modified {modified_count} of {len(html_files)} file(s)')

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
