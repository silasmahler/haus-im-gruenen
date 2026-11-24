# Go-Live-Plan haus-im-gruenen.com

Stand: 2026-11-24. **Nur ein Plan.** An DNS, Amplify-Domains, Amplify-App-Einstellungen, GitHub Pages und am SES-Stack wird erst etwas geändert, wenn Silas den Plan freigegeben hat. Die Schritte, die ein Login bei Namecheap brauchen, führt Silas selbst aus.

## 0. Ist-Zustand (lesend geprüft am 2026-11-24)

| Was | Wert |
| --- | --- |
| Nameserver | Namecheap BasicDNS (`dns1/dns2.registrar-servers.com`) |
| `@` A | 185.199.108–111.153 (GitHub Pages), TTL 60 s |
| `www` CNAME | `haus-im-gruenen.com.` (GitHub Pages leitet www per 301 auf den Apex um) |
| `vorschau` CNAME | `d4scilp9e1sgm.cloudfront.net` (Amplify) |
| ACM-Validierung | `_011780e3f5f9ad6b641c4ef2d8e780fd` CNAME `_af65a9ed….acm-validations.aws.` |
| MX `@` | `eforward1–5.registrar-servers.com` (Namecheap-Mail-Weiterleitung) |
| TXT `@` | `v=spf1 include:spf.efwd.registrar-servers.com ~all` |
| DKIM (SES) | `5fvrdeio…`, `jaixo27w…`, `3ywxq4kg…` `._domainkey` CNAME `….dkim.amazonses.com` (Status SUCCESS) |
| DMARC, CAA, AAAA | nicht vorhanden |
| GitHub Pages | Branch `gh-pages`, Custom Domain `haus-im-gruenen.com`, HTTPS erzwungen, Repo öffentlich |
| Amplify | App `d2tgnt3qldutrv` („haus-im-gruenen-vorschau“), Branch `main`, Domain-Zuordnung `haus-im-gruenen.com` nur mit Subdomain `vorschau` → `main`. Custom Rule `/<*>` → `/404.html` (404-200). Custom Header `X-Robots-Tag: noindex, nofollow` für `**` (gilt **app-weit**) |
| Formular-Stack | `haus-im-gruenen-inquiry`, Recipient `mail@ambergarten.com`. CORS erlaubt Apex, www, vorschau, Amplify-Default-Domain, localhost:3007 |
| SES-Konto | Production Access aktiv, Status HEALTHY |

## 1. Hosting-Entscheidung

**Empfehlung: AWS Amplify** (dieselbe App `d2tgnt3qldutrv`, neuer Branch `production`).

| Kriterium | Amplify | GitHub Pages |
| --- | --- | --- |
| Echte 301-Redirects (www → Apex, alte URLs) | ja, Custom Rules | nein, nur Meta-Refresh per HTML |
| HTTP-Header (noindex für Vorschau, Caching, Security) | ja | nein |
| Clean URLs ohne `.html` | ja (Deploy-Schritt `X.html` → `X/index.html`, läuft schon für die Vorschau) | ja |
| Auftragsverarbeiter | AWS EMEA SARL (Luxemburg), Region Frankfurt. AWS ist für das Formular ohnehin schon Auftragsverarbeiter, es kommt kein neuer Anbieter hinzu | GitHub Inc. (USA) als zusätzlicher Anbieter |
| Vorschau und Produktion | gleiche Plattform, gleicher Deploy-Weg | zwei verschiedene Plattformen |
| Kosten | wenige Cent bis ca. 1 €/Monat bei diesem Traffic | kostenlos |
| Deploy | manueller Zip-Deploy (bekannt, Skript-Schritte siehe NEXT-SESSION-PROMPT) | `npm run deploy` |
| Rollback | DNS zurück auf GitHub Pages (alte Seite bleibt auf `gh-pages` liegen) | – |

Begründung: Wir brauchen die Redirects (www, alte Adressen) und eine saubere Trennung von Vorschau (noindex) und Produktion. Das geht nur mit Amplify richtig. Datenschutzrechtlich ist eine EU-Gesellschaft mit Region Frankfurt, die ohnehin schon eingebunden ist, einfacher als ein weiterer US-Anbieter. Die Kosten sind vernachlässigbar.

**Warum ein zweiter Branch in derselben App und keine neue App?** Eine Domain kann in Amplify nur mit genau einer App verknüpft sein. `haus-im-gruenen.com` hängt schon an `d2tgnt3qldutrv` (wegen `vorschau`). Mit einem Branch `production` zeigen `@` und `www` auf `production`, `vorschau` bleibt auf `main`.

**Folge:** Der Custom Header `X-Robots-Tag: noindex` ist app-weit und muss vor dem Go-Live entfernt werden, sonst wäre auch die Produktion noindex. Die Vorschau bleibt trotzdem aus dem Index: Der Preview-Build (`NEXT_PUBLIC_PREVIEW=1`) liefert `robots.txt` mit `Disallow: /` und `<meta name="robots" content="noindex, nofollow">` auf allen Seiten. Optional App umbenennen in „haus-im-gruenen“ (`aws amplify update-app --name`), rein kosmetisch.

## 2. Build-Konfiguration Produktion

| Variable | Vorschau (`main`) | Produktion (`production`) |
| --- | --- | --- |
| `NEXT_PUBLIC_PREVIEW` | `1` | **nicht setzen** |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | (Standard, zeigt Platzhalter) | `false` |
| `NEXT_PUBLIC_INQUIRY_URL` | Lambda-URL | Lambda-URL |
| `NEXT_PUBLIC_GOATCOUNTER_CODE` | leer | nur setzen, wenn der Besitzer Statistik will (dann erscheint der Abschnitt in der Datenschutzerklärung automatisch) |

Damit gilt in Produktion automatisch (Code ist schon vorbereitet, siehe `src/lib/seo.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/layout.tsx`):

- **noindex:** kein globales `robots`-Meta, nur `/gaestemappe` bleibt `noindex, nofollow`.
- **robots.txt:** `Allow: /` plus `Sitemap: https://haus-im-gruenen.com/sitemap.xml`. `/gaestemappe` wird absichtlich nicht gesperrt, damit Crawler das noindex lesen können.
- **Sitemap:** Start, Ferienhaus, Firmen, Urlaub, Bewertungen, Preise, Kontakt (ohne Gästemappe). Prüfen, ob die Seiten Bewertungen und Preise zum Start Inhalt haben. Wenn nicht: aus der Sitemap nehmen oder auf noindex setzen.
- **Canonical:** jede Seite hat `alternates.canonical`, `metadataBase` ist `https://haus-im-gruenen.com`. Kanonisch ist der **Apex ohne Slash am Ende**. www leitet per 301 dorthin um.
- **JSON-LD:** nur bestätigte Fakten (PLZ, Geo, Telefon erst nach Bestätigung des Besitzers).

Prüfung nach dem Build (`out/`): `grep -L 'noindex' out/*.html` muss alle Seiten außer `gaestemappe.html` liefern. `out/robots.txt` darf kein `Disallow: /` enthalten.

## 3. Datenschutz-Hoster

Heute: Produktionstext nennt GitHub Pages, der Preview-Build ersetzt ihn durch `hostingPreview` (Amplify). Bei Amplify-Hosting:

- In `src/i18n/site.ts` (DE und EN) den `hosting`-Text auf AWS Amplify umstellen: „Diese Website wird über AWS Amplify von Amazon Web Services EMEA SARL (38 Avenue John F. Kennedy, L-1855 Luxemburg) in der Region Frankfurt (eu-central-1) ausgeliefert …“, mit dem Hinweis auf CloudFront und mögliche Übermittlung in Drittländer (wie `hostingPreview`, nur „Website“ statt „Vorschau der Website“).
- `hostingPreview` kann bleiben (Vorschau nennt sich weiter „Vorschau“) oder entfällt.
- GitHub kommt in der Datenschutzerklärung danach nicht mehr vor.
- AWS-Auftragsverarbeitungsvertrag: Die DPA ist Teil der AWS Service Terms und gilt automatisch, bitte trotzdem im Konto (AWS Artifact) prüfen bzw. ablegen.
- Falls doch GitHub Pages: Der bestehende Text ist korrekt, dann nichts ändern.

## 4. Redirects alter URLs

Die alte Seite (master/gh-pages, Stand 2026-11-09) war eine einseitige Gästemappe und selbst **noindex**. Es gibt also kein Suchmaschinen-Ranking zu retten, es geht nur um Lesezeichen und gedruckte QR-Codes.

Alte Routen auf `gh-pages`:

| Alte URL | Neue Seite | Maßnahme |
| --- | --- | --- |
| `/` (mit Ankern `#galerie`, `#wlan`, `#hausregeln`, `#preise`, `#ausstattung`, `#ausflugsziele`) | Startseite; die Inhalte sind jetzt unter `/gaestemappe` mit **denselben Ankern** | siehe unten (Anker und alte QR-Codes) |
| `/datenschutz`, `/datenschutz.html` | `/datenschutz` | existiert weiter, `.html` per 301 auf `/datenschutz` |
| `/index.html` | `/` | 301 auf `/` |
| `/willkommen-qr-code.pdf`, `/willkommen-qr-code-en.pdf` | gleich (neue PDFs zeigen auf `/gaestemappe`) | nichts |
| `/tour/grundriss.webp` | gleich | nichts |
| `/index.txt`, `/datenschutz.txt` | Next-RSC-Payloads, werden neu erzeugt | nichts |
| `/robots.txt`, `/icon.svg`, `/404.html` | neu erzeugt | nichts |
| `http://`, `www` | `https://haus-im-gruenen.com` | Amplify erzwingt HTTPS, www per 301 (Regel unten) |

**Alte QR-Codes:** Die bisher gedruckten QR-Codes zeigen auf `https://haus-im-gruenen.com` (Startseite), nicht auf `/gaestemappe`. Gäste landen nach dem Go-Live auf der neuen Startseite. Dort gibt es schon den Link zur Gästemappe (Header, Startseite, Footer). Zusätzlich vor dem Go-Live:

1. Die neuen QR-PDFs (zeigen auf `/gaestemappe`) drucken und im Haus austauschen. Das ist Aufgabe des Besitzers.
2. Kleines Client-Skript auf der Startseite: Ist der Hash `#wlan`, `#hausregeln`, `#ausflugsziele`, `#ausstattung` oder `#galerie`, dann `location.replace('/gaestemappe' + hash)`. Server-Redirects sehen den Hash nicht, deshalb muss das im Browser passieren. Nicht für `#preise` (Gästemappe-Preise und neue Preisseite, bitte entscheiden).

**Amplify Custom Rules** (Reihenfolge wichtig, die bestehende 404-Regel bleibt als **letzte**):

```json
[
  { "source": "https://www.haus-im-gruenen.com/<*>", "target": "https://haus-im-gruenen.com/<*>", "status": "301" },
  { "source": "/index.html", "target": "/", "status": "301" },
  { "source": "/datenschutz.html", "target": "/datenschutz", "status": "301" },
  { "source": "/<*>", "target": "/404.html", "status": "404-200" }
]
```

`aws amplify update-app --custom-rules` ersetzt die ganze Liste. Deshalb immer die vollständige Liste übergeben. Die Regeln gelten auch für die Vorschau, das schadet dort nicht.

Hinweis: Eine unbekannte Adresse wie `/gibtsnicht` wird von Amplify zuerst per 301 auf `/gibtsnicht/` umgeleitet und dann mit 404 beantwortet. Das ist nur kosmetisch.

## 5. Ablauf Go-Live (nach Freigabe)

### 5.1 Vorbereitung (ohne Auswirkung auf Produktion)

1. Checkliste aus Abschnitt 6 abhaken.
2. Datenschutz-Text (Abschnitt 3) und Anker-Skript (Abschnitt 4) committen, Vorschau neu deployen und prüfen.
3. Produktions-Build in einer Kopie (rsync nach /tmp wie bei der Vorschau) mit den Variablen aus Abschnitt 2. `X.html` → `X/index.html` kopieren, zippen.
4. `aws amplify create-branch --app-id d2tgnt3qldutrv --branch-name production` (kein Repo, manueller Deploy), Zip per `create-deployment` / `curl -T` / `start-deployment` hochladen.
5. Prüfen unter `https://production.d2tgnt3qldutrv.amplifyapp.com`: alle Routen, Bilder, keine Platzhalter sichtbar, `robots.txt`, `sitemap.xml`, Canonicals, Meta-robots nur auf der Gästemappe. Diese Domain steht nicht in der CORS-Liste, deshalb dort nur das Laden des Formulars prüfen, nicht absenden.

### 5.2 Amplify umstellen

6. Custom Header `X-Robots-Tag` entfernen: `aws amplify update-app --app-id d2tgnt3qldutrv --custom-headers ''`. Danach prüfen, dass die Vorschau weiter `Disallow: /` und Meta-noindex ausliefert.
7. Custom Rules aus Abschnitt 4 setzen.
8. Domain-Zuordnung erweitern (vorschau bleibt drin!):

   ```sh
   aws amplify update-domain-association --app-id d2tgnt3qldutrv --domain-name haus-im-gruenen.com \
     --sub-domain-settings prefix=,branchName=production prefix=www,branchName=production prefix=vorschau,branchName=main
   ```

   Danach `aws amplify get-domain-association …` lesen und die DNS-Ziele für `@` und `www` notieren (wahrscheinlich wieder `d4scilp9e1sgm.cloudfront.net`, aber den Wert aus der Ausgabe nehmen). Die ACM-Validierung läuft über den bestehenden `_011780e3…`-CNAME, der bleibt stehen. Bis das DNS umgestellt ist, steht die Zuordnung auf „Pending“. Die Produktion läuft solange weiter auf GitHub Pages. Kurz prüfen, dass `vorschau` erreichbar bleibt.

### 5.3 DNS bei Namecheap (macht Silas, Domain List → haus-im-gruenen.com → Advanced DNS)

Zeitpunkt: ruhige Tageszeit, mit 30 Minuten Puffer. Vorher einen **Screenshot der kompletten Advanced-DNS-Seite** machen (für den Rollback).

9. **Host Records:**
   - Die vier `A Record` mit Host `@` (185.199.108–111.153) **löschen**.
   - **Neu:** `ALIAS Record`, Host `@`, Value = Amplify-Ziel aus Schritt 8 (z. B. `d4scilp9e1sgm.cloudfront.net`), TTL 1 min bzw. 5 min.
   - `CNAME Record` Host `www`: Value von `haus-im-gruenen.com.` auf das Amplify-Ziel für `www` ändern, TTL 1 min.
10. **Nicht anfassen:**
    - Abschnitt **Mail Settings** bleibt auf „Email Forwarding“ (verwaltet die MX `eforward1–5` und den SPF-TXT `@`). Nicht auf „Custom MX“ oder anderes umstellen.
    - TXT `@` `v=spf1 include:spf.efwd.registrar-servers.com ~all`.
    - Die drei DKIM-CNAMEs `*._domainkey` → `*.dkim.amazonses.com`.
    - ACM-CNAME `_011780e3f5f9ad6b641c4ef2d8e780fd`.
    - CNAME `vorschau` → `d4scilp9e1sgm.cloudfront.net`.
11. Speichern (grüner Haken je Zeile).

Hinweise: Ein ALIAS liefert nach außen normale A-Records und verträgt sich mit MX und TXT am Apex, deshalb funktioniert die Mail-Weiterleitung weiter. Ein CNAME am Apex ginge nicht. IPv6 (AAAA) gibt es heute nicht und ist nicht nötig.

### 5.4 Prüfung direkt danach

12. `dig +short haus-im-gruenen.com A` liefert CloudFront-IPs. `dig +short haus-im-gruenen.com MX` und `TXT` sind unverändert, die DKIM-CNAMEs auch (`dig +short CNAME 5fvrdeio3xovqswrnivulblan6pf3r6n._domainkey.haus-im-gruenen.com`).
13. `aws amplify get-domain-association` zeigt `AVAILABLE`, alle drei Subdomains `verified: true` (kann bis ca. 30 Minuten dauern).
14. `curl -sI https://haus-im-gruenen.com/` kommt von CloudFront, ohne `x-robots-tag`. `curl -sI https://www.haus-im-gruenen.com/ferienhaus` liefert 301 auf den Apex. `/datenschutz.html` liefert 301. `/gaestemappe` funktioniert und hat Meta-noindex. Die QR-PDFs sind erreichbar. Lokaler DNS-Cache hängt? Dann `curl --resolve`.
15. Mail-Weiterleitung testen: von einer privaten Adresse eine Mail an eine bestehende Weiterleitungsadresse @haus-im-gruenen.com schicken (nicht über das Formular).
16. SES-Status: `aws sesv2 get-email-identity --email-identity haus-im-gruenen.com` zeigt DKIM `SUCCESS`.
17. Formular in Produktion **nicht** absenden (geht an eine echte Person). Der Formular-Test läuft vorher gegen den Simulator (Abschnitt 6).
18. Google Search Console: Domain-Property per DNS-TXT anlegen (zusätzlicher TXT `@`, berührt SPF nicht, SPF ist ein eigener TXT-Eintrag) und Sitemap einreichen. Optional, mit Silas absprechen.

### 5.5 Nachlauf (nach ca. 2 Wochen stabil)

19. GitHub Pages: Custom Domain im Repo entfernen oder Pages ganz abschalten. Bis dahin bleibt sie für den Rollback stehen. `public/CNAME` im neuen Build ist für Amplify ohne Wirkung und kann dann raus. `npm run deploy` / `gh-pages`-Skript entfernen, damit niemand versehentlich die alte Plattform bespielt.
20. CORS-Liste in `infra/inquiry.yaml`: `www` kann bleiben (schadet nicht). `main.d2tgnt3qldutrv.amplifyapp.com` und `localhost:3007` bewusst behalten oder entfernen.
21. Optional: DMARC-Eintrag `_dmarc` TXT `v=DMARC1; p=none; rua=…` (verbessert die Zustellbarkeit der SES-Mails). Eigene Freigabe, weil er die Mail betrifft.

## 6. Checkliste vor dem Start

**Material vom Besitzer** (Inhalte niemals erfinden):

- [ ] Preise 2027 und Mindestaufenthalt (`/preise`, Platzhalter ×2)
- [ ] Endreinigung und Nebenkosten
- [ ] Echte Gästebewertungen mit Quelle und Nutzungsrecht (`/bewertungen`)
- [ ] Impressumsdaten (`/impressum`, Pflicht! Ohne Impressum kein Go-Live)
- [ ] Gastgeber-Foto, Namen und persönlicher Satz
- [ ] Logo-Wahl A/B/C
- [ ] Bestätigung Introbild 01.jpg
- [ ] Fahrzeiten, Ausflugsziele, Einkaufsmöglichkeiten (`/urlaub`, Platzhalter ×2)
- [ ] Kontaktdaten (`/kontakt`, Platzhalter)
- [ ] Freigabe der Navigation (Review-Vorschlag Kürzung)
- [ ] Entscheidung Besuchsstatistik (GoatCounter ja/nein)

**Platzhalter:** `grep -rn "<Placeholder" src` muss vor dem Go-Live leer sein, oder jeder verbleibende Platzhalter ist bewusst freigegeben. Der Build mit `NEXT_PUBLIC_SHOW_PLACEHOLDERS=false` blendet Platzhalter nur aus. Leere Abschnitte müssen dann trotzdem sinnvoll aussehen, das im Produktions-Build prüfen. Stand heute: Bewertungen 1, Impressum 1, Kontakt 1, Preise 2, Urlaub 2.

**Technik:**

- [ ] `npm run build` und `npm run lint` ohne Fehler
- [ ] Datenschutz-Hoster umgestellt (Abschnitt 3), Impressum vollständig
- [ ] Alle Routen mobil und am Desktop angesehen (Screenshots)
- [ ] Gästemappe: WLAN, Hausregeln-Modal, DE/EN, QR, Anker-Weiterleitung von `/#wlan` usw.
- [ ] Neue QR-PDFs gedruckt und im Haus ausgetauscht
- [ ] 404-Seite funktioniert
- [ ] OG-Bild/Vorschau (z. B. in einem Messenger gegen die Production-Branch-URL)

**Formular gegen den SES-Simulator** (nur nach Freigabe, Mail-Empfänger danach zwingend zurückstellen):

1. Stack auf den Simulator umstellen:
   ```sh
   aws cloudformation deploy --region eu-central-1 --stack-name haus-im-gruenen-inquiry \
     --template-file infra/inquiry.yaml --capabilities CAPABILITY_IAM \
     --parameter-overrides Recipient=success@simulator.amazonses.com --tags Project=haus-im-gruenen
   ```
2. `describe-stacks` muss `Recipient=success@simulator.amazonses.com` zeigen. Erst dann testen.
3. Auf `https://vorschau.haus-im-gruenen.com/kontakt` durch Silas im Browser: Urlaub-Anfrage, Firmen-Anfrage (`?typ=firma`), Pflichtfeldfehler, ungültige E-Mail, Abreise vor Anreise. Erwartung: Erfolgsmeldung bzw. passende Fehlermeldung. CloudWatch-Log der Lambda zeigt den Versand an den Simulator.
4. Stack zurück auf `Recipient=mail@ambergarten.com` und mit `describe-stacks` prüfen. Erst danach geht es weiter mit dem Go-Live.
5. Nach dem Go-Live in Produktion nicht absenden. Der Besitzer kann selbst eine echte Testanfrage schicken, wenn er möchte.

## 7. Rollback

Die alte Seite bleibt unverändert auf `gh-pages` und in den GitHub-Pages-Einstellungen (Custom Domain bleibt bis Schritt 19). Rollback dauert ca. 5 Minuten (TTL 60 s):

1. Namecheap Advanced DNS (Silas): ALIAS `@` löschen, die vier A-Records `@` wieder anlegen (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153), `www` CNAME zurück auf `haus-im-gruenen.com.`. Mail-, DKIM-, ACM- und vorschau-Einträge nicht anfassen.
2. Prüfen: `curl -sI https://haus-im-gruenen.com/` zeigt `server: GitHub.com`. Falls GitHub das HTTPS-Zertifikat verloren hat: In den Repo-Settings → Pages die Custom Domain erneut speichern und „Enforce HTTPS“ setzen (Zertifikat kann bis 1 Stunde dauern).
3. Amplify: Subdomains `@`/`www` aus der Domain-Zuordnung entfernen (`update-domain-association` nur mit `prefix=vorschau,branchName=main`). Optional den Header `X-Robots-Tag` wieder setzen.
4. Datenschutz: Die alte Seite hat ihre eigene Datenschutzseite (GitHub Pages), dort ist nichts zu tun.

Teil-Rollback: Ist nur ein Inhalt falsch, ein korrigiertes Zip auf `production` deployen. Amplify behält frühere Deployments, die lassen sich erneut ausrollen. DNS bleibt dann wie es ist.

## 8. Offene Entscheidungen für Silas

1. Hosting Amplify (Empfehlung) oder GitHub Pages?
2. App-weiten noindex-Header entfernen und die Vorschau nur über Meta-noindex und robots.txt schützen: ok?
3. `#preise` von der alten Startseite: auf die Gästemappe oder auf `/preise` leiten?
4. Bewertungen und Preise zum Start in der Sitemap, oder bis zum Material noindex?
5. GoatCounter ja/nein, Search Console ja/nein, DMARC jetzt oder später?
6. Termin für den Simulator-Test und für die DNS-Umstellung.
