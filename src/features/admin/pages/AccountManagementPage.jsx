import { BadgeCheck, GraduationCap, UserCheck, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { StudentAccountManagementPage } from './StudentAccountManagementPage.jsx'
import { TeacherAccountManagementPage } from './TeacherAccountManagementPage.jsx'
import { VerificationRequestsPage } from './VerificationRequestsPage.jsx'

const validTypes = new Set(['students', 'teachers', 'leaders', 'requests'])

export function AccountManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedType = searchParams.get('type') || 'students'
  const activeType = validTypes.has(requestedType) ? requestedType : 'students'
  const selectType = (type) => setSearchParams({ type }, { replace: true })

  return <div className="page-stack account-management-page">
    <div className="page-header-row"><div><div className="page-kicker">Login & access</div><h2>Account management</h2><p className="page-description">Manage student and teacher login accounts separately from graduation-photo records.</p></div></div>
    <div className="account-management-tabs" role="tablist" aria-label="Choose an account type">
      <button type="button" role="tab" aria-selected={activeType === 'students'} className={activeType === 'students' ? 'active' : ''} onClick={() => selectType('students')}><UserRound size={19} /><span><strong>Student accounts</strong><small>Sign-in status and assigned section</small></span></button>
      <button type="button" role="tab" aria-selected={activeType === 'teachers'} className={activeType === 'teachers' ? 'active' : ''} onClick={() => selectType('teachers')}><GraduationCap size={19} /><span><strong>Teacher accounts</strong><small>Teacher Studio access and handled sections</small></span></button>
      <button type="button" role="tab" aria-selected={activeType === 'leaders'} className={activeType === 'leaders' ? 'active' : ''} onClick={() => selectType('leaders')}><UserCheck size={19} /><span><strong>Alumni leaders</strong><small>One memory contributor per section</small></span></button>
      <button type="button" role="tab" aria-selected={activeType === 'requests'} className={activeType === 'requests' ? 'active' : ''} onClick={() => selectType('requests')}><BadgeCheck size={19} /><span><strong>Access requests</strong><small>Approve or reject new registrations</small></span></button>
    </div>
    {activeType === 'teachers' && <TeacherAccountManagementPage embedded />}
    {activeType === 'requests' && <VerificationRequestsPage embedded />}
    {activeType === 'leaders' && <StudentAccountManagementPage embedded leadersOnly />}
    {activeType === 'students' && <StudentAccountManagementPage embedded />}
  </div>
}
