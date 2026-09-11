import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute.jsx'
import { AdminLayout } from '../features/admin/components/layout/AdminLayout.jsx'
import { Dashboard } from '../features/admin/pages/Dashboard.jsx'
import { LoginPage } from '../features/auth/pages/LoginPage.jsx'
import { PlaceholderPage } from '../features/admin/pages/placeholders/PlaceholderPage.jsx'
import { PhotoManagement } from '../features/admin/pages/photos/PhotoManagement.jsx'
import { PhotoEditing } from '../features/admin/pages/photos/PhotoEditing.jsx'
import { PhotoRetakes } from '../features/admin/pages/photos/PhotoRetakes.jsx'
import { PhotoEditorPage } from '../features/admin/pages/photos/PhotoEditorPage.jsx'
import { PhotoCapturePage } from '../features/admin/pages/photos/PhotoCapturePage.jsx'
import { ExistingPhotos } from '../features/admin/pages/photos/ExistingPhotos.jsx'
import { AcademicManagementPage } from '../features/admin/pages/academic/AcademicManagementPage.jsx'
import { StudentManagementPage } from '../features/admin/pages/students/StudentManagementPage.jsx'
import { StudentProfilePage } from '../features/admin/pages/students/StudentProfilePage.jsx'
import { VerificationRequestsPage } from '../features/admin/pages/VerificationRequestsPage.jsx'
import { ContentManagementPage } from '../features/admin/pages/ContentManagementPage.jsx'
import { ReportsPage } from '../features/admin/pages/ReportsPage.jsx'
import { LandingPage } from '../features/public/pages/LandingPage.jsx'
import { UserPortalLayout } from '../features/user/layouts/UserPortalLayout.jsx'
import { UserExplorePage } from '../features/user/pages/UserExplorePage.jsx'
import { UserHistoryPage } from '../features/user/pages/UserHistoryPage.jsx'
import { UserHomePage } from '../features/user/pages/UserHomePage.jsx'
import { UserFaceSearchPage } from '../features/user/pages/UserFaceSearchPage.jsx'
import { UserUpdatesPage } from '../features/user/pages/UserUpdatesPage.jsx'
import { UserYearbooksPage } from '../features/user/pages/UserYearbooksPage.jsx'

const UserYearbookViewerPage = lazy(() => import('../features/user/pages/UserYearbookViewerPage.jsx').then((module) => ({ default: module.UserYearbookViewerPage })))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={['User', 'Administrator']} />}>
        <Route path="/community" element={<UserPortalLayout />}>
          <Route index element={<UserHomePage />} />
          <Route path="explore" element={<UserExplorePage />} />
          <Route path="yearbooks" element={<UserYearbooksPage />} />
          <Route path="face-search" element={<UserFaceSearchPage />} />
          <Route path="yearbooks/:yearbookId" element={<Suspense fallback={<div className="yearbook-viewer-message">Opening the 3D yearbook…</div>}><UserYearbookViewerPage /></Suspense>} />
          <Route path="history" element={<UserHistoryPage />} />
          <Route path="updates" element={<UserUpdatesPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/photos" element={<PhotoManagement />} />
          <Route path="/photos/editing" element={<PhotoEditing />} />
          <Route path="/photos/retakes" element={<PhotoRetakes />} />
          <Route path="/photos/existing" element={<ExistingPhotos />} />
          <Route path="/photos/camera" element={<PhotoCapturePage />} />
          <Route path="/photos/capture" element={<PhotoCapturePage />} />
          <Route path="/photos/edit/:photoId" element={<PhotoEditorPage />} />
          <Route path="/students" element={<StudentManagementPage />} />
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/academic" element={<AcademicManagementPage />} />
          <Route path="/school-years" element={<Navigate to="/academic?tab=school-years" replace />} />
          <Route path="/strands" element={<Navigate to="/academic?tab=strands-sections" replace />} />
          <Route path="/sections" element={<Navigate to="/academic?tab=strands-sections" replace />} />
          <Route path="/yearbooks" element={<Navigate to="/academic?tab=yearbooks" replace />} />
          <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
            <Route path="/verification-requests" element={<VerificationRequestsPage />} />
          </Route>
          <Route path="/content" element={<ContentManagementPage />} />
          <Route path="/alumni" element={<Navigate to="/content" replace />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="System configuration is planned for a later update." />} />
          <Route path="/profile" element={<PlaceholderPage title="Admin Profile" description="Profile management is not yet implemented." />} />
          <Route path="/logout" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
