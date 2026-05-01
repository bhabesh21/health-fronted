import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Doctors from "./pages/doctor/Doctors.jsx";
import Patients from "./pages/patientpage/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Billing from "./pages/Billing.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
      <Route path="/login" element={<Login />} />



      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    </AuthProvider>
  );
}



