import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute.jsx'
import { LoginPage } from '../features/auth/pages/LoginPage.jsx'
import { LandingPage } from '../features/public/pages/LandingPage.jsx'
import { UserPortalLayout } from '../features/user/layouts/UserPortalLayout.jsx'
import { UserExplorePage } from '../features/user/pages/UserExplorePage.jsx'
import { UserHistoryPage } from '../features/user/pages/UserHistoryPage.jsx'
import { UserHomePage } from '../features/user/pages/UserHomePage.jsx'
import { UserMemoriesPage } from '../features/user/pages/UserMemoriesPage.jsx'
import { UserUpdatesPage } from '../features/user/pages/UserUpdatesPage.jsx'
import { UserYearbooksPage } from '../features/user/pages/UserYearbooksPage.jsx'

const lazyNamed = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })))
const AdminLayout = lazyNamed(() => import('../features/admin/components/layout/AdminLayout.jsx'), 'AdminLayout')
const Dashboard = lazyNamed(() => import('../features/admin/pages/Dashboard.jsx'), 'Dashboard')
const SettingsPage = lazyNamed(() => import('../features/admin/pages/SettingsPage.jsx'), 'SettingsPage')
const AccountProfilePage = lazyNamed(() => import('../features/admin/pages/AccountProfilePage.jsx'), 'AccountProfilePage')
const PhotoManagement = lazyNamed(() => import('../features/admin/pages/photos/PhotoManagement.jsx'), 'PhotoManagement')
const PhotoEditing = lazyNamed(() => import('../features/admin/pages/photos/PhotoEditing.jsx'), 'PhotoEditing')
const PhotoRetakes = lazyNamed(() => import('../features/admin/pages/photos/PhotoRetakes.jsx'), 'PhotoRetakes')
const PhotoEditorPage = lazyNamed(() => import('../features/admin/pages/photos/PhotoEditorPage.jsx'), 'PhotoEditorPage')
const PhotoCapturePage = lazyNamed(() => import('../features/admin/pages/photos/PhotoCapturePage.jsx'), 'PhotoCapturePage')
const ExistingPhotos = lazyNamed(() => import('../features/admin/pages/photos/ExistingPhotos.jsx'), 'ExistingPhotos')
const AcademicManagementPage = lazyNamed(() => import('../features/admin/pages/academic/AcademicManagementPage.jsx'), 'AcademicManagementPage')
const StudentProfilePage = lazyNamed(() => import('../features/admin/pages/students/StudentProfilePage.jsx'), 'StudentProfilePage')
const PeopleManagementPage = lazyNamed(() => import('../features/admin/pages/PeopleManagementPage.jsx'), 'PeopleManagementPage')
const AccountManagementPage = lazyNamed(() => import('../features/admin/pages/AccountManagementPage.jsx'), 'AccountManagementPage')
const ContentManagementPage = lazyNamed(() => import('../features/admin/pages/ContentManagementPage.jsx'), 'ContentManagementPage')
const ReportsPage = lazyNamed(() => import('../features/admin/pages/ReportsPage.jsx'), 'ReportsPage')
const TeacherStudioPage = lazyNamed(() => import('../features/teacher/pages/TeacherStudioPage.jsx'), 'TeacherStudioPage')
const UserYearbookViewerPage = lazy(() => import('../features/user/pages/UserYearbookViewerPage.jsx').then((module) => ({ default: module.UserYearbookViewerPage })))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={['User', 'Teacher', 'Administrator']} />}>
        <Route path="/community" element={<UserPortalLayout />}>
          <Route index element={<UserHomePage />} />
          <Route path="explore" element={<UserExplorePage />} />
          <Route path="yearbooks" element={<UserYearbooksPage />} />
          <Route path="memories" element={<UserMemoriesPage />} />
          <Route path="face-search" element={<Navigate to="/community/yearbooks" replace />} />
          <Route path="yearbooks/:yearbookId" element={<Suspense fallback={<div className="yearbook-viewer-message">Opening the 3D yearbook…</div>}><UserYearbookViewerPage /></Suspense>} />
          <Route path="history" element={<UserHistoryPage />} />
          <Route path="updates" element={<UserUpdatesPage />} />
          <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
            <Route path="teacher" element={<Suspense fallback={<div className="yearbook-viewer-message">Opening Teacher Studio…</div>}><TeacherStudioPage /></Suspense>} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
        <Route element={<Suspense fallback={<div className="route-loading">Opening workspace…</div>}><AdminLayout /></Suspense>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/photos" element={<PhotoManagement />} />
          <Route path="/photos/editing" element={<PhotoEditing />} />
          <Route path="/photos/retakes" element={<PhotoRetakes />} />
          <Route path="/photos/existing" element={<ExistingPhotos />} />
          <Route path="/photos/camera" element={<PhotoCapturePage />} />
          <Route path="/photos/capture" element={<PhotoCapturePage />} />
          <Route path="/photos/edit/:photoId" element={<PhotoEditorPage />} />
          <Route path="/graduation-directory" element={<PeopleManagementPage />} />
          <Route path="/people" element={<Navigate to="/graduation-directory" replace />} />
          <Route path="/students" element={<Navigate to="/graduation-directory?type=students" replace />} />
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/academic" element={<AcademicManagementPage />} />
          <Route path="/school-years" element={<Navigate to="/academic?tab=school-years" replace />} />
          <Route path="/strands" element={<Navigate to="/academic?tab=strands-sections" replace />} />
          <Route path="/sections" element={<Navigate to="/academic?tab=strands-sections" replace />} />
          <Route path="/yearbooks" element={<Navigate to="/academic?tab=yearbooks" replace />} />
          <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
            <Route path="/accounts" element={<AccountManagementPage />} />
            <Route path="/verification-requests" element={<Navigate to="/accounts?type=requests" replace />} />
          </Route>
          <Route path="/content" element={<ContentManagementPage />} />
          <Route path="/teachers" element={<Navigate to="/graduation-directory?type=teachers" replace />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<AccountProfilePage />} />
          <Route path="/logout" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
