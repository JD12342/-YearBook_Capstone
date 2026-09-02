function Icon({ children }) {
  return <span className="nav-icon">{children}</span>
}

const navigation = [
  { label: 'Dashboard', key: '/dashboard', icon: '◫' },
  { label: 'Students', key: '/students', icon: '◌' },
  { label: 'Academic Management', key: '/academic', icon: '◧' },
  { label: 'Photos', key: '/photos', icon: '▣' },
]

const management = [
  { label: 'Alumni', key: '/alumni', icon: '◍', future: true },
  { label: 'Reports', key: '/reports', icon: '◐', future: true },
]

const system = [
  { label: 'Settings', key: '/settings', icon: '⚙', future: true },
  { label: 'Admin Profile', key: '/profile', icon: '◎', future: true },
  { label: 'Logout', key: '/logout', icon: '⇢' },
]

export function Sidebar({ currentPath = '/dashboard', onNavigate }) {
  const renderNavGroup = (items, heading) => (
    <div className="sidebar-section">
      <div className="sidebar-heading">{heading}</div>
      {items.map(({ label, key, icon, future }) => {
        const isActive = currentPath === key
        return (
          <button
            key={key}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''} ${future ? 'future' : ''}`.trim()}
            onClick={() => onNavigate?.(key)}
          >
            <Icon>{icon}</Icon>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <img className="brand-mark" src="/snhs-seal.png" alt="Sorsogon National High School seal" />
        <div>
          <div className="brand-name">GRADBOOK</div>
          <div className="brand-subtitle">Admin Console</div>
        </div>
      </div>

      {renderNavGroup(navigation, 'MAIN')}
      {renderNavGroup(management, 'MANAGEMENT')}
      {renderNavGroup(system, 'SYSTEM')}
    </aside>
  )
}
