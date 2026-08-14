#!/usr/bin/env python3
"""SEC-C05 FIX: Replace localStorage token auth with cookie-based auth (credentials: 'include')"""

import re
import os

files = [
    '/home/z/my-project/src/app/rajeshark/crm/treatments/page.tsx',
    '/home/z/my-project/src/app/rajeshark/crm/appointments/page.tsx',
    '/home/z/my-project/src/app/rajeshark/crm/patient/[id]/page.tsx',
    '/home/z/my-project/src/app/rajeshark/crm/doctors/page.tsx',
    '/home/z/my-project/src/app/rajeshark/crm/billing/page.tsx',
    '/home/z/my-project/src/app/rajeshark/crm/patients/page.tsx',
    '/home/z/my-project/src/app/rajeshark/crm/page.tsx',
    '/home/z/my-project/src/app/rajeshark/social/page.tsx',
]

for fpath in files:
    if not os.path.exists(fpath):
        print(f'SKIP (not found): {fpath}')
        continue
    
    with open(fpath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: Remove token variable declaration
    # Handles: const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    # Also: const token = localStorage.getItem('admin_token');
    # Also: const token = localStorage.getItem("admin_token");
    # Also: const token = (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null) || ...;
    # Also: .find((row) => row.startsWith('admin_token='))?.split('=')[1] || localStorage.getItem('admin_token') || '';
    
    # Remove standalone token assignments (lines like: const token = ...localStorage...)
    content = re.sub(
        r'\n\s*const token\s*=\s*(?:typeof window !== "undefined" \? )?localStorage\.getItem\(["\']admin_token["\']\)\s*(?:\|\|[^\n]*)?;\s*\n',
        '\n',
        content
    )
    
    # Remove the cookie parsing + localStorage fallback pattern (social page)
    content = re.sub(
        r'\n\s*const token\s*=\s*document\.cookie\s*\?[^;]+localStorage\.getItem\(["\']admin_token["\']\)\s*\|\|\s*["\'][^"\']*["\']\s*;\s*\n',
        '\n',
        content
    )
    
    # Remove localStorage.removeItem lines
    content = re.sub(r'\n\s*localStorage\.removeItem\(["\']admin_token["\']\);\s*', '', content)
    content = re.sub(r'\n\s*localStorage\.removeItem\(["\']admin_user["\']\);\s*', '', content)
    
    # Pattern 2: Replace headers: { Authorization: `Bearer ${token}` } with credentials: 'include'
    # GET requests (no body)
    content = re.sub(
        r'headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*,?',
        "credentials: 'include',",
        content
    )
    
    # Pattern 3: Replace headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    # with credentials: 'include', headers: { "Content-Type": "application/json" }
    content = re.sub(
        r'headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*,\s*(["\'])Content-Type\1:\s*(["\'])application/json\2\s*\}',
        r"credentials: 'include', headers: { \1Content-Type\1: \2application/json\2 }",
        content
    )
    
    # Pattern 4: Replace headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    content = re.sub(
        r"headers:\s*\{\s*(['\"])Content-Type\1:\s*(['\"])application/json\2\s*,\s*Authorization:\s*`Bearer \$\{token\}`\s*\}",
        r"credentials: 'include', headers: { \1Content-Type\1: \2application/json\2 }",
        content
    )
    
    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        print(f'FIXED: {fpath}')
    else:
        print(f'NO CHANGES: {fpath}')

print('\nDone!')