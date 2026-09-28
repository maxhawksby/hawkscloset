# Password screen release: September 15, 2026

## Published result
Live theme: `drop02 Final`, ID `150280110158`, https://hawkscloset.com/password.
The original shop UI is preserved. The password screen uses motionless dimensional HTML numbers, shaded edges, and soft shadows over the existing clothing photograph. Mouse tracking and the chrome clock housing are absent.

## Verification
- Downloaded all 30 live theme files after repair. Every file matches the approved recovery bundle byte for byte.
- Compared with the pre-upload live theme, only `templates/password.liquid` and `assets/password.css` differ. Existing scripts, settings, product templates, and shop styling are restored exactly.
- Fresh live desktop and mobile browser checks passed: countdown runs, no clock artwork or pointer movement, no horizontal overflow or JavaScript errors. No forms submitted.
- Existing local countdown/signup/reduced-motion/keyboard checks passed. Shopify authentication and real SMS delivery were not exercised.
- The recovered live theme retains its pre-existing Theme Check findings (8 errors, 11 warnings); the password template has only an external-font warning. Unrelated live files were intentionally restored exactly.

## Release history and backups
An initial terminal upload changed additional shop files to older worktree versions and removed several files. Maxwell explicitly approved live repair. The prepared recovery theme restored the original live shop while retaining the approved password screen; full file comparison verified the result.

Persistent pre-upload backup: `.local/shopify-snapshots/before-motionless-password-150280110158.tar.gz`.
Recovery theme: `.local/shopify-snapshots/password-release-recovery/`.
Main files replaced during integration were archived in `.local/shopify-snapshots/main-before-password-integration.tar.gz`.

## Local integration
Password template, stylesheet, password browser checks, and screenshots copied into the main checkout. Existing settings, renderer, and supporting password assets already match; they were preserved. Other local gallery changes remain uncommitted and are not published.
Main local preview: http://localhost:4180/preview/ (`npm run preview` if the server is stopped).
The isolated worktree was removed after verification. Branch `codex/isolated-work` retains local checkpoint commit `5d04fbb`. Active checkout is main; its password changes are present alongside the other agent's preserved uncommitted work. No GitHub push is part of this release.
