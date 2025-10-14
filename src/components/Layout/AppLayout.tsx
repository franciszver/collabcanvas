export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0b1220' }}>
      {children}
    </div>
  )
}


