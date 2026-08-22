import QRCode from 'qrcode'

export async function SiteQrCode({ url }: { url: string }) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: { dark: '#164e3d', light: '#ffffff' },
  })

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line react/no-danger */}
      <div
        className="h-32 w-32 overflow-hidden rounded-xl border border-[var(--color-brand-200)] bg-white p-2"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-xs text-[var(--brand-ink-soft)]">Seite scannen & teilen</p>
    </div>
  )
}
