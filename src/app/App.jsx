import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../features/auth/context/AuthContext.jsx'
import { AppRoutes } from './AppRoutes.jsx'
import '../styles/App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
