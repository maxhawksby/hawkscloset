"""Render the password page for local visual checks, without Shopify services.

This adapter substitutes the small set of Liquid expressions in this template.
It fails on unhandled Liquid. Shopify password authentication is not simulated.
SMS requests must be mocked in browser tests, never sent by this preview.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
theme = ROOT / 'hawks-closet-theme'
schema = json.loads((theme / 'config/settings_schema.json').read_text())
target = next(setting['default'] for group in schema for setting in group.get('settings', []) if setting.get('id') == 'next_drop_at')
html = (theme / 'templates/password.liquid').read_text()
html = html.replace('{% layout none %}', '')
html = re.sub(r"{% form 'storefront_password' %}.*?{% endform %}", '''<form action="#" onsubmit="event.preventDefault()"><div class="pw-corner"><span class="pw-corner-label">Early access</span><input class="pw-input" type="password" name="password" aria-label="Store password" placeholder="Password" autocomplete="current-password"><button class="pw-btn-ghost" type="submit">Enter &rarr;</button></div></form>''', html, flags=re.S)
html = re.sub(r'{% if settings.next_drop_at != blank %}(.*?){% else %}.*?{% endif %}', r'\1', html, flags=re.S)
html = re.sub(r"{{ '([^']+)' \| asset_url \| stylesheet_tag }}", r'<link rel="stylesheet" href="/hawks-closet-theme/assets/\1">', html)
html = re.sub(r"{{ '([^']+)' \| asset_url }}", r'/hawks-closet-theme/assets/\1', html)
for expression, value in {
    'request.locale.iso_code': 'en', 'shop.name | escape': 'Hawks Closet', 'content_for_header': '',
    'settings.next_drop_at | escape': target,
    "settings.next_drop_at | date: '%B %d, %Y at %I:%M %p %Z'": 'September 26, 2026 at 12:00 PM EDT',
    "settings.instagram_handle | default: 'hawks.vtg'": 'hawks.vtg',
    "settings.klaviyo_public_key | default: 'TALeYF' | escape": 'PREVIEW',
    "settings.klaviyo_sms_list_id | default: 'X9XfPw' | escape": 'PREVIEW',
}.items():
    html = html.replace('{{ ' + expression + ' }}', value)
assert '{{' not in html and '{%' not in html, 'Unhandled Liquid expression in preview'
# Block outgoing signup requests when viewing the standalone preview manually.
html = html.replace('<head>', '''<head><meta name="robots" content="noindex"><script>
window.fetch = async function () { throw new Error('Local preview: submissions are disabled.'); };
</script>''')
(ROOT / 'preview').mkdir(exist_ok=True)
(ROOT / 'preview/index.html').write_text(html)
print('Rendered preview/index.html from the actual password template.')
