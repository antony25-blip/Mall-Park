
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { Alert, Container, CircularProgress } from '@mui/material'
import Header from './Components/Header'
import Home from './Pages/Home'
import Footer  from './Components/Footer'
import Parking from './Pages/Parking';
import Booking from './Pages/Booking';
import MyBookings from './Pages/MyBookings';
import AdminDashboard from './Pages/AdminDashboard';
import AuthPage from './Pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

function RequireAuth({ children, adminOnly = false }) {
  const { user, loading, authError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (!user) {
    if (authError) {
      return <Container maxWidth="md" sx={{ py: 5 }}><Alert severity="error">{authError}</Alert></Container>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <>
    <Header/>
    <Routes>
       <Route path="/" element={<Home />} />
       <Route path="/parking" element={<Parking />} />
      <Route path="/book" element={<RequireAuth><Booking /></RequireAuth>} />
      <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth adminOnly><AdminDashboard /></RequireAuth>} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/alternatives" element={<Navigate to="/parking" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} theme="colored"/>

      <Footer/>
    </>
  )
}

export default App
