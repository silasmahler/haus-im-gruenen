Weiterarbeit am Website-Relaunch „Haus im Grünen“. Repo: ~/Directory42/github/kreinn/haus-im-gruenen, Branch `relaunch` (bereits auf GitHub gepusht). Lies zuerst: docs/KONZEPT.md (Konzept des Besitzers, Texte wörtlich übernehmen), docs/REVIEW-2026-11-23.md (5 Agency-Agent-Reviews), infra/README.md (Formular-Backend), docs/logo-options.html (3 Logo-Konzepte), `git log --oneline -20`.

## Stand
- Next.js 15 als statischer Export, Tailwind v4, DE/EN über src/i18n/site.ts (`en` ist gegen `de` getypt). Die Gästemappe hat ihre eigenen Texte in src/i18n/dictionaries.ts.
- Seiten: / , /ferienhaus, /urlaub, /firmen, /preise, /bewertungen, /kontakt, /impressum, /datenschutz, /gaestemappe (noindex), 404. Fehlendes Material ist als `<Placeholder>` markiert. Inhalte niemals erfinden.
- Logo A (Blattgiebel) ist eingebaut (src/components/Brand.tsx, icon.svg, og.jpg). B und C liegen in public/brand/. Die Wahl des Besitzers steht noch aus.
- Formular-Backend: CloudFormation-Stack `haus-im-gruenen-inquiry` (eu-central-1, KreInn-AWS-Account 809541497932), Lambda-Function-URL https://oc5gtsvhtqsgk6dudsuun5qk240erluc.lambda-url.eu-central-1.on.aws/. SES-Absender anfrage@haus-im-gruenen.com, Domain verifiziert. Empfänger ist mail@ambergarten.com. Die URL steht in .env.local (gitignored, wird beim Build eingebacken).
- Vorschau: Amplify-App `d2tgnt3qldutrv` (haus-im-gruenen-vorschau), Branch main, manueller Zip-Deploy, Header X-Robots-Tag noindex. Erreichbar unter https://vorschau.haus-im-gruenen.com (Domain AVAILABLE) und https://main.d2tgnt3qldutrv.amplifyapp.com. Der dort deployte Stand ist ÄLTER, ohne Logo, Persönlichkeit und neue Gästemappe.
- Produktion: haus-im-gruenen.com läuft weiter mit der alten Seite auf GitHub Pages (master, `npm run deploy` → gh-pages). NICHT anfassen, bevor das Material komplett ist.
- DNS/Registrar: Namecheap (Advanced DNS; Login macht Silas selbst, nie Passwörter eingeben). Die Einträge für DKIM und vorschau sind gesetzt. Die Mail-Weiterleitung von Namecheap mit SPF bleibt unangetastet.
- QR-PDFs (public/willkommen-qr-code*.pdf, scripts/generate-qr-pdf.mjs) zeigen auf /gaestemappe.

## Offene Aufgaben (in dieser Reihenfolge)
1. **Gästemappe-Redesign abschließen.** Ein Agent wurde mitten in der Arbeit abgebrochen. Uncommittete Änderungen liegen in GaestemappeContent.tsx, LanguageSwitcher.tsx, RulesAcceptance.tsx, SiteQrCode.tsx, WifiCard.tsx, tailwind.css, src/tour/TourCanvas.tsx und TourUI.tsx. Diese Änderungen per `git diff` prüfen, dann fertigstellen. Ziel: Die Gästemappe sieht aus wie die neue Website (Tokens paper/cream/moss/sage/wood, Fraunces, Logo, Hecken-Trennlinie, gleiche Karten, Icons und Buttons). Mobil kompakt, weil Gäste über den QR-Code kommen. Alle Inhalte und Funktionen bleiben (WLAN, Hausregeln-Modal, DE/EN, Ausflugsziele, QR). Sprachumschalter in der neuen Palette mit a11y. Alte `brand-*`-Tokens und den Body-Gradient entfernen, sobald nichts mehr sie nutzt. Link zurück zur Startseite einbauen.
2. **Review-Vorschläge aus docs/REVIEW-2026-11-23.md umsetzen.** Alle, AUSSER der Kürzung der Navigation (braucht die Zustimmung des Besitzers). Besonders:
   - UI #1: Font-Bug, Inter wird nicht angewendet, `text-6xl` fehlt.
   - UI #2: Hero-Overlay auf dem Desktop.
   - UX: Anfrage-Button im Header, `/kontakt?typ=firma`, Formularreihenfolge, Eingaben bleiben beim Varianten-Wechsel erhalten.
   - Brand: Datenschutz-Hoster korrigieren (Vorschau Amplify, Produktion GitHub Pages; je nach finalem Hosting formulieren), EN-Texte natürlicher.
   - SEO: JSON-LD VacationRental (PLZ 24619 ungeprüft, nicht als Fakt eintragen), Titel mit Ort, Canonical/OG (OG zum Teil schon erledigt), Bilder als WebP/srcset.
   - a11y: Feldrahmen und Fokus, Pflichtfeld-*, Skip-Link, scroll-padding, Lightbox mit aria-live und autoFocus, prefers-reduced-motion.
   Prüfen, was der Branding-Commit schon erledigt hat.
3. **Build und Vorschau neu deployen:** in einer Kopie bauen (rsync nach /tmp ohne .next/node_modules/out/.git, node_modules symlinken), damit der Dev-Server nicht gestört wird. Dann für jedes X.html im Ordner `out/` eine Kopie als `X/index.html` anlegen (Amplify hat sonst keine Clean URLs). Zip erstellen, dann `aws amplify create-deployment --app-id d2tgnt3qldutrv --branch-name main`, Zip per `curl -T` hochladen, `start-deployment`. Danach alle Routen auf vorschau.haus-im-gruenen.com prüfen (lokaler DNS-Cache kann hängen, dann `curl --resolve` nehmen) und Screenshots ansehen.
4. **Mail an den Besitzer** über scripts/send-preview-mail.py (`python3 -I scripts/send-preview-mail.py --dry` zum Prüfen, ohne `--dry` wird gesendet). An info@ambergarten.com, BCC info@silas-mahler.de, Reply-To info@silas-mahler.de, mit beiden QR-PDFs im Anhang. Den Text vorher um diese Fragen ergänzen: Gastgeber-Foto, Vornamen und ein persönlicher Satz; Logo-Wahl A/B/C (Link zur Vergleichsseite auf die Vorschau legen, z. B. public/brand/logo-options.html deployen). Kurz halten, der Empfänger ist kein Techniker. Den finalen Text vor dem Versand vollständig im Chat zeigen.

## Regeln
- NIEMALS ein Formular auf der Website absenden und nie per curl an die Lambda-URL schicken: Das mailt an eine echte Person. Für Tests gegen den SES-Simulator deployen (siehe infra/README.md).
- Keine erfundenen Preise, Bewertungen, Namen, Adressen oder Entfernungen.
- Commits auf `relaunch` mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, danach pushen. Kein gh-pages-Deploy.
- Dev-Server: `npx next dev -p 3007` im Repo (Port 3000 ist belegt). Nie ein breites pkill.
- Arbeit an passende Subagenten geben (agency-agents unter ~/Directory42/github/kreinn/agency-agents), Agenten höchstens 30 Minuten laufen lassen, autonom arbeiten und am Ende eine Zusammenfassung auf Deutsch liefern.
- Material, das der Besitzer noch liefern muss: Preise 2027 und Mindestaufenthalt, Endreinigung und Nebenkosten, Bewertungen, Impressumsdaten, Gastgeber-Foto und Namen, Logo-Wahl, Bestätigung des Introbilds 01.jpg, Fahrzeiten, Einkaufsmöglichkeiten.
