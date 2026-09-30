# Gauntlet-Loop-Prompt: 3D-Tour Haus im Grünen

Zum Einfügen in Claude Code. Gestaltete Ansicht: gauntlet-prompt.html

---

Kontext: Repo ist /Users/silasmahler/Directory42/github/kreinn/haus-im-gruenen (Next.js 15, output: 'export', GitHub Pages, Tailwind, DE/EN über src/i18n). Alles bleibt statisch exportierbar, kein Server. Referenzen liegen in tour-refs/: grundriss-neu.png (maßgebliche Raumaufteilung und m²), grundriss-neu-mit-pfeilen.png (gewünschte Möbelumstellungen, grüne Pfeile), grundriss-alt-airbnb.png (alter Stand aus dem Inserat) und fotos/ (46 echte Airbnb-Fotos 01.jpg bis 46.jpg, Bildunterschriften in fotos/captions.json, Quelle https://www.airbnb.de/rooms/1697314718712995655). Die Fotos zeigen Stil, Materialien und Licht des echten Hauses, der neue Grundriss zeigt die Aufteilung und die aktuelle Möblierung.

Raumliste: Schlafen 17,50 / Küche 17,04 / Wohnen 26,52 / Kind 14,85 / Kind 10,85 / Flur 7,00 / Flur 2,00 / Bad 6,44 / WC 1,23 / Abstell. 2,48 m² / Kaminanschluss. Eingang unten (Pfeil). Umstellungen laut Pfeilen (gegen das Bild prüfen, Abweichungen melden): 1. Küche: Esstisch von der Raummitte in die obere rechte Ecke der Küche. 2. Kind 10,85 m²: Bett um 90° gedreht, quer statt längs an der rechten Wand.

Ich will, dass du eine begehbare 3D-Tour des Ferienhauses "Haus im Grünen" für unsere Website baust, in Three.js. Sie soll ein hochwertiger Immobilien-Rundgang auf Matterport-Niveau sein: fotorealistische PBR-Materialien, weiches Tageslicht, korrekte Proportionen, jedes Detail sauber, von Bodenleisten bis Fensterlaibung. Gäste sollen sich das echte Haus vorstellen können, ohne bei der Anreise überrascht zu werden.

Umfang: eine Route /tour (DE/EN) mit Ego-Rundgang (WASD + Maus, Touch-Steuerung am Handy, Wandkollision, Türen als Durchgänge), Dollhouse-/Draufsicht-Umschalter, Sprungmarken pro Raum, Möblierung wie im neuen Grundriss inkl. der zwei Umstellungen, Fensterblick ins Grüne, Kaminanschluss, Küchenzeile mit Coffee-Bar, Bad mit Wanne. Teaser-Link auf der Startseite, Texte in src/i18n/dictionaries.ts. Läuft lokal mit npm run dev, npm run build bleibt grün.

Fächere Sub-Agents auf und lass jeden einen Bereich einzeln bis zur Perfektion bringen. Zuerst ein Sub-Agent, der alle 46 Fotos und captions.json ansieht und eine Raum-Zuordnung mit Materialien, Farben, Möbeln und Lichtstimmung schreibt (tour-refs/fotos/INDEX.md). Danach parallel: 1. Geometrie und Maßtreue zum Grundriss, 2. Materialien und Texturen, 3. Möbel und Ausstattung pro Raum, 4. Licht (Fenster, Schatten, AO, Tone Mapping), 5. Navigation für Desktop und Touch, 6. Web-Integration, i18n, Performance, Static Export.

Auf jeden Bereich /loop. Nach jedem Durchlauf prüft ein anderer, getrennter Sub-Agent das Ergebnis visuell per Playwright: Screenshots aus mehreren Blickwinkeln in jedem Raum, Desktop 1440 px und Mobil 390 px, verglichen mit den passenden Airbnb-Fotos und einem Grundriss-Overlay. Dieser Prüfer ist ein richtig harter Kritiker. Bei Proportionsfehlern, Z-Fighting, schwebenden Möbeln, Möbeln in Wänden, flachem Licht, Plastik-Look oder Abweichungen vom Grundriss läuft die Schleife weiter. Wer baut, prüft nicht.

Hör nicht auf, bevor jeder Prüf-Agent restlos überzeugt ist, wenn er die Renderings blind Seite an Seite mit den echten Airbnb-Fotos vergleicht und sagen muss, welche echt sind, und die 3D-Szene glaubwürdig dasselbe Haus zeigt. Jeder Raum stimmt mit dem Grundriss überein (Position, m², Türen, Fenster), belegt per Overlay-Screenshot. Keine Konsolenfehler, 60 fps auf einem normalen Laptop, brauchbar auf dem Handy, Ladezeit unter 5 s, Lighthouse ohne rote Werte, Tastatur-Alternative und Alt-Texte vorhanden.

Baue nur lokal: NICHT committen, NICHT pushen, NICHT deployen (ein Push auf gh-pages veröffentlicht die Seite live). Am Ende ein kurzer Bericht mit Screenshots pro Raum und offenen Fragen. /loop bis es wirklich perfekt ist. Fächere Sub-Agents auf und ultracode.
