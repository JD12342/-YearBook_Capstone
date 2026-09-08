import { BadgeCheck, BookOpenText, Camera, FileText, GraduationCap, Image, LayoutDashboard, LogOut, Settings, Users, UserRound } from 'lucide-react'

function Icon({ children }) {
  return <span className="nav-icon">{children}</span>
}

const navigation = [
  { label: 'Dashboard', key: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Students', key: '/students', icon: <Users size={18} /> },
  { label: 'Academic Management', key: '/academic', icon: <GraduationCap size={18} /> },
  { label: 'Photos', key: '/photos', icon: <Image size={18} /> },
  { label: 'Camera', key: '/photos/camera', icon: <Camera size={17} />, nested: true },
]

const management = [
  { label: 'Verification Requests', key: '/verification-requests', icon: <BadgeCheck size={18} />, allowedRoles: ['Administrator'] },
  { label: 'Content & Alumni', key: '/content', icon: <BookOpenText size={18} /> },
  { label: 'Reports', key: '/reports', icon: <FileText size={18} />, future: true },
]

const system = [
  { label: 'Settings', key: '/settings', icon: <Settings size={18} />, future: true },
  { label: 'Account Profile', key: '/profile', icon: <UserRound size={18} />, future: true },
  { label: 'Logout', key: '/logout', icon: <LogOut size={18} /> },
]

export function Sidebar({ currentPath = '/dashboard', isOpen = false, isCollapsed = false, onClose, onNavigate, role = '' }) {
  const renderNavGroup = (items, heading) => (
    <div className="sidebar-section">
      <div className="sidebar-heading">{heading}</div>
      {items.filter((item) => !item.allowedRoles || item.allowedRoles.includes(role)).map(({ label, key, icon, future, nested }) => {
        const isActive = currentPath === key
        return (
          <button
            key={key}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''} ${future ? 'future' : ''} ${nested ? 'nested' : ''}`.trim()}
            title={label}
            onClick={() => {
              onNavigate?.(key)
              onClose?.()
            }}
          >
            <Icon>{icon}</Icon>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`.trim()}>
      <div className="brand-block">
        <img className="brand-mark" src="/snhs-seal.png" alt="Sorsogon National High School seal" />
        <div>
          <div className="brand-name">GRADBOOK</div>
          <div className="brand-subtitle">Management Console</div>
        </div>
      </div>

      {renderNavGroup(navigation, 'MAIN')}
      {renderNavGroup(management, 'MANAGEMENT')}
      {renderNavGroup(system, 'SYSTEM')}
    </aside>
  )
}
