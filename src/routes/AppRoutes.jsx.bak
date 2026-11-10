import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Inventory from '../pages/Inventory';
import VehicleDetails from '../pages/VehicleDetails';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import SellCar from '../pages/SellCar';
import GoogleMyCar from '../pages/GoogleMyCar';
import MySubmissions from '../pages/MySubmissions';
import MyRequests from '../pages/MyRequests';
import SavedCars from '../pages/SavedCars';
import CustomerChat from '../pages/CustomerChat';
import DealerDashboard from '../pages/dealer/DealerDashboard';
import DealerChat from '../pages/dealer/DealerChat';
import SellerSubmissions from '../pages/dealer/SellerSubmissions';
import DealerRequests from '../pages/dealer/DealerRequests';
import DealerVehiclePreview from '../pages/dealer/DealerVehiclePreview';
import AdminUsers from '../pages/dealer/AdminUsers';
import Analytics from '../pages/dealer/Analytics';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import NotFound from '../pages/NotFound';
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventory/:id" element={<VehicleDetails />} />

      {/* About and Contact now live at the bottom of Home and Inventory */}
      <Route path="/about" element={<Navigate to={{ pathname: '/', hash: '#about' }} replace />} />
      <Route path="/contact" element={<Navigate to={{ pathname: '/', hash: '#contact' }} replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/sell" element={<SellCar />} />
      <Route path="/google-my-car" element={<GoogleMyCar />} />
      <Route
        path="/saved"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <SavedCars />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-requests"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-submissions"
        element={
          <ProtectedRoute>
            <MySubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <CustomerChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <CustomerChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DealerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DealerVehiclePreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/chat"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DealerChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/submissions"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SellerSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/requests"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DealerRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
export default AppRoutes;
