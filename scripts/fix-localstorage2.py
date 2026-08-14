#!/usr/bin/env python3
import re, os

base = '/home/z/my-project'

files_and_fixes = {
    f'{base}/src/app/rajeshark/crm/treatments/page.tsx': [
        (r'\n    const token = typeof window !== "undefined" \? localStorage\.getItem\("admin_token"\) : null;\n', '\n'),
    ],
    f'{base}/src/app/rajeshark/crm/doctors/page.tsx': [
        (r'\n        \? localStorage\.getItem\("admin_token"\)', ''),
    ],
    f'{base}/src/app/rajeshark/crm/billing/page.tsx': [
        (r'\n    const token = typeof window !== "undefined" \? localStorage\.getItem\("admin_token"\) : null;\n', '\n'),
    ],
    f'{base}/src/app/rajeshark/crm/patients/page.tsx': [
        (r'\n      const token = typeof window !== "undefined" \? localStorage\.getItem\("admin_token"\) : null;\n', '\n'),
    ],
    f'{base}/src/app/rajeshark/crm/page.tsx': [
        (r'\n          \? localStorage\.getItem\("admin_token"\)', ''),
    ],
    f'{base}/src/app/rajeshark/social/page.tsx': [
        (r"\.split\('\\='\)\[1\] \|\| localStorage\.getItem\('admin_token'\)", ".split('=')[1]"),
    ],
}

for fpath, patterns in files_and_fixes.items():
    if not os.path.exists(fpath):
        print(f'SKIP: {fpath}')
        continue
    with open(fpath, 'r') as f:
        content = f.read()
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            content = new_content
            print(f'FIXED: {os.path.basename(fpath)}')
    with open(fpath, 'w') as f:
        f.write(content)

print('Done')
