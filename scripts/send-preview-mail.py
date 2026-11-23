import json, subprocess, sys, base64
from email.message import EmailMessage
from email.headerregistry import Address

body = """Hallo zusammen,

die neue Website ist fertig und kann angeschaut werden:
https://vorschau.haus-im-gruenen.com

Das ist erst eine Vorschau, die alte Seite bleibt bis zum Start online. Schaut gern auch am Handy rein und sagt mir, was ihr ändern möchtet.

Anfragen über die Website kommen per E-Mail an mail@ambergarten.com. Die Test-Anfrage mit „TEST“ im Text könnt ihr löschen.

Im Anhang sind die neuen QR-Code-Karten für das Haus (Deutsch und Englisch). Bitte erst austauschen, wenn die neue Seite online ist.

Zwei Fragen an euch:
1. Logo: Ich habe drei Vorschläge gemacht. Welcher gefällt euch am besten, A, B oder C?
   https://vorschau.haus-im-gruenen.com/brand/logo-options.html
2. Über euch: Für „Ihre Gastgeberin“ auf der Startseite habe ich Susannes Foto und Text aus dem Airbnb-Profil übernommen. Passt das so? Sollen weitere Vornamen dazu, z. B. Horst?

Damit wir starten können, brauche ich außerdem:
- Passt das Gartenfoto (grüne Lounge mit Weinflasche) als großes Startbild?
- Preise 2027, Mindestaufenthalt, Endreinigung und eventuelle Nebenkosten
- zwei bis drei echte Gästebewertungen
- Name, Anschrift und Telefon fürs Impressum
- ungefähre Fahrzeiten (z. B. nach Neumünster, Kiel, Hamburg, zur Ostsee) und die nächsten Einkaufsmöglichkeiten

Viele Grüße
Silas
"""

m = EmailMessage()
m["Subject"] = "Ihre neue Website – Vorschau"
m["From"] = Address("Silas Mahler", "anfrage", "haus-im-gruenen.com")
m["To"] = "info@ambergarten.com"
m["Reply-To"] = "info@silas-mahler.de"
m.set_content(body)
base = "/Users/silasmahler/Directory42/github/kreinn/haus-im-gruenen/public/"
for f in ["willkommen-qr-code.pdf", "willkommen-qr-code-en.pdf"]:
    m.add_attachment(open(base + f, "rb").read(), maintype="application", subtype="pdf", filename=f)

raw = base64.b64encode(m.as_bytes()).decode()
dest = {"ToAddresses": ["info@ambergarten.com"], "BccAddresses": ["info@silas-mahler.de"]}
if "--dry" in sys.argv:
    print("Subject:", m["Subject"]); print("From:", m["From"]); print("To:", m["To"]); print("Bcc:", dest["BccAddresses"]); print("Reply-To:", m["Reply-To"])
    print("Attachments:", [a.get_filename() for a in m.iter_attachments()])
    print(); print(body); sys.exit()
out = subprocess.run(["aws", "sesv2", "send-email", "--profile", "kreinn-mfa", "--region", "eu-central-1",
    "--from-email-address", "anfrage@haus-im-gruenen.com",
    "--destination", json.dumps(dest),
    "--content", json.dumps({"Raw": {"Data": raw}})], capture_output=True, text=True)
print(out.stdout, out.stderr)
