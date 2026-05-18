import { Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { DashboardPage } from './pages/pro/Dashboard';
import { ProfilePage } from './pages/pro/Profile';
import { SchedulePage } from './pages/pro/Schedule';
import { BookingsPage } from './pages/pro/Bookings';
import { BookingDetailPage } from './pages/pro/BookingDetail';
import { ProfessionalListPage } from './pages/client/ProfessionalList';
import { PublicProfilePage } from './pages/client/PublicProfile';
import { MyBookingsPage } from './pages/client/MyBookings';
import { MyBookingDetailPage } from './pages/client/MyBookingDetail';
import { NotFoundPage } from './pages/shared/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage role="client" />} />
        <Route path="/register-pro" element={<RegisterPage role="professional" />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/profesionales" element={<ProfessionalListPage />} />
        <Route path="/profesionales/:id" element={<PublicProfilePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/mis-reservas" element={<MyBookingsPage />} />
          <Route path="/mis-reservas/:id" element={<MyBookingDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/pro" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
