import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutz – Haus im Grünen',
  robots: { index: false, follow: false },
}

export default function DatenschutzPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 text-sm leading-relaxed text-[var(--brand-ink-soft)]">
      <h1 className="text-2xl font-bold text-[var(--brand-ink)]">Datenschutzerklärung</h1>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          Diese Webseite
        </h2>
        <p>
          Diese Seite dient als Gästeinformation für das Ferienhaus &quot;Haus im
          Grünen&quot; in Rendswühren. Sie enthält keine Formulare und erhebt selbst
          keine personenbezogenen Daten.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          Lokale Speicherung (Hausregeln)
        </h2>
        <p>
          Beim Bestätigen der Hausregeln wird ein Zeitstempel im lokalen
          Speicher (localStorage) deines Browsers abgelegt, damit dir die
          Regeln nicht bei jedem Besuch erneut angezeigt werden. Diese
          Information verlässt dein Gerät nicht und wird nicht an uns oder
          Dritte übertragen.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          Reichweitenmessung
        </h2>
        <p>
          Sofern aktiviert, verwenden wir GoatCounter zur anonymen,
          cookie-freien Reichweitenmessung. Es werden keine
          personenbezogenen Profile erstellt.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-[var(--brand-ink)]">
          Externe Links
        </h2>
        <p>
          Die Seite verlinkt auf externe Angebote, u. a. Airbnb, Google Maps
          (Google Ireland Limited) sowie auf die offiziellen Webseiten der
          empfohlenen Restaurants und Ausflugsziele. Beim Anklicken dieser Links wirst du zur jeweiligen
          externen Webseite weitergeleitet, für deren Datenschutz die
          Anbieter selbst verantwortlich sind. Es werden keine Kartendaten
          eingebettet oder im Hintergrund geladen — eine Datenübertragung an
          Google findet erst statt, wenn du einen solchen Link aktiv
          anklickst.
        </p>
      </section>
    </main>
  )
}
