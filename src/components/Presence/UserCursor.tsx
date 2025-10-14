export default function UserCursor({ x, y, name }: { x: number; y: number; name: string | null }) {
  // Render a simple cursor dot and label; Canvas layer renders this via HTML overlay in tests
  return (
    <div data-testid="UserCursor" style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <div style={{ width: 8, height: 8, background: '#3B82F6', borderRadius: '9999px', boxShadow: '0 0 0 2px #ffffff' }} />
      <div style={{ marginTop: 4, fontSize: 10, color: '#E5E7EB', textShadow: '0 0 2px #000' }}>{name ?? 'Unknown'}</div>
    </div>
  )
}


