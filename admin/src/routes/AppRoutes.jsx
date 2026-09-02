import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute.jsx'
import { AdminLayout } from '../components/layout/AdminLayout.jsx'
import { Dashboard } from '../pages/Dashboard.jsx'
import { LoginPage } from '../pages/auth/LoginPage.jsx'
import { PlaceholderPage } from '../pages/placeholders/PlaceholderPage.jsx'
import { PhotoManagement } from '../pages/photos/PhotoManagement.jsx'
import { PhotoEditing } from '../pages/photos/PhotoEditing.jsx'
import { PhotoRetakes } from '../pages/photos/PhotoRetakes.jsx'
import { PhotoEditorPage } from '../pages/photos/PhotoEditorPage.jsx'
import { ExistingPhotos } from '../pages/photos/ExistingPhotos.jsx'
import { AcademicManagementPage } from '../pages/academic/AcademicManagementPage.jsx'
import { SchoolYearManagementPage } from '../pages/schoolYears/SchoolYearManagementPage.jsx'
import { SectionManagementPage } from '../pages/sections/SectionManagementPage.jsx'
import { StrandManagementPage } from '../pages/strands/StrandManagementPage.jsx'
import { StudentManagementPage } from '../pages/students/StudentManagementPage.jsx'
import { StudentProfilePage } from '../pages/students/StudentProfilePage.jsx'
import { YearbookManagementPage } from '../pages/yearbooks/YearbookManagementPage.jsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/photos" element={<PhotoManagement />} />
          <Route path="/photos/editing" element={<PhotoEditing />} />
          <Route path="/photos/retakes" element={<PhotoRetakes />} />
          <Route path="/photos/existing" element={<ExistingPhotos />} />
          <Route path="/photos/edit/:photoId" element={<PhotoEditorPage />} />
          <Route path="/students" element={<StudentManagementPage />} />
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/academic" element={<AcademicManagementPage />} />
          <Route path="/school-years" element={<Navigate to="/academic?tab=school-years" replace />} />
          <Route path="/strands" element={<Navigate to="/academic?tab=strands-sections" replace />} />
          <Route path="/sections" element={<Navigate to="/academic?tab=strands-sections" replace />} />
          <Route path="/yearbooks" element={<Navigate to="/academic?tab=school-years" replace />} />
          <Route path="/alumni" element={<PlaceholderPage title="Alumni" description="Alumni functionality is intentionally deferred." />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" description="Reports and analytics dashboards will be expanded next." />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="System configuration is planned for a later update." />} />
          <Route path="/profile" element={<PlaceholderPage title="Admin Profile" description="Profile management is not yet implemented." />} />
          <Route path="/logout" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
