import { GraduationCap, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { StudentManagementPage } from './students/StudentManagementPage.jsx'
import { TeacherManagementPage } from './TeacherManagementPage.jsx'

export function PeopleManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeType = searchParams.get('type') === 'teachers' ? 'teachers' : 'students'
  const selectType = (type) => setSearchParams({ type }, { replace: true })

  return <div className="page-stack people-management-page">
    <div className="page-header-row"><div><div className="page-kicker">Graduation portraits</div><h2>Graduation directory</h2><p className="page-description">Manage the student and teacher records that will appear in graduation photo sessions and yearbooks. Login accounts are managed separately.</p></div></div>
    <div className="people-directory-tabs" role="tablist" aria-label="Choose a graduation directory">
      <button type="button" role="tab" aria-selected={activeType === 'students'} className={activeType === 'students' ? 'active' : ''} onClick={() => selectType('students')}><Users size={19} /><span><strong>Student records</strong><small>Graduating students, class placement, and portraits</small></span></button>
      <button type="button" role="tab" aria-selected={activeType === 'teachers'} className={activeType === 'teachers' ? 'active' : ''} onClick={() => selectType('teachers')}><GraduationCap size={19} /><span><strong>Teacher records</strong><small>Manually added faculty included in graduation photos</small></span></button>
    </div>
    {activeType === 'teachers' ? <TeacherManagementPage embedded /> : <StudentManagementPage embedded />}
  </div>
}
