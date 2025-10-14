import usePresence from '../../hooks/usePresence'

export default function OnlineUsersList() {
  const { onlineUsers, onlineCount } = usePresence()
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 16,
        background: 'rgba(2,6,23,0.9)',
        border: '1px solid #1f2937',
        borderRadius: 8,
        padding: '8px 10px',
        color: '#E5E7EB',
        fontSize: 12,
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Online ({onlineCount})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {onlineUsers.length === 0 ? (
          <div style={{ color: '#9CA3AF' }}>No one online</div>
        ) : (
          onlineUsers.map((u) => (
            <div key={u.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {u.name ?? 'Unknown'}
            </div>
          ))
        )}
      </div>
    </div>
  )
}


