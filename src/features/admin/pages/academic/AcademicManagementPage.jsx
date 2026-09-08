import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AcademicTabs } from '../../components/academic/AcademicTabs.jsx'
import { SchoolYearManager } from '../../components/academic/SchoolYearManager.jsx'
import { StrandSectionManager } from '../../components/academic/StrandSectionManager.jsx'

const tabs = [
  { label: 'School Years', value: 'school-years' },
  { label: 'Strands & Sections', value: 'strands-sections' },
]

export function AcademicManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'school-years'
  const [activeTab, setActiveTab] = useState(tabs.some((tab) => tab.value === initialTab) ? initialTab : 'school-years')

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab)
    setSearchParams({ tab: nextTab })
  }

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case 'strands-sections':
        return <StrandSectionManager />
      case 'school-years':
      default:
        return <SchoolYearManager />
    }
  }, [activeTab])

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Academic</div>
          <h2>Academic Management</h2>
        </div>
      </div>

      <AcademicTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      {activeContent}
    </div>
  )
}
