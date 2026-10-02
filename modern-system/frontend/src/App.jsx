import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  ToastProvider,
  Spinner,
  PageTransition,
  ScrollToTop,
} from "./components/ui";
import Navbar from "./components/Navbar";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { homeFor } from "./utils/navigation";

// The dashboards are the heavy screens (tables, charts, forms). Splitting
// them out keeps the landing page's first paint small.
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RegistrarDashboard = lazy(() => import("./pages/RegistrarDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChildDetail = lazy(() => import("./pages/ChildDetail"));

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner size={34} label="Restoring your session" />
      </div>
    );
  }

  // Send signed-in users to the dashboard for their role rather than the
  // login/register pages.
  const authRedirect = user ? (
    <Navigate to={homeFor(user.role)} replace />
  ) : null;

  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <main id="main">
        <Suspense fallback={<Spinner size={30} label="Loading page" />}>
          {/* Keyed wrapper so switching dashboards animates instead of
              cutting between two static pages. */}
          <PageTransition>
            <Routes>
              {/* Public pages keep the plain centred container. */}
              <Route
                path="/"
                element={
                  <div className="container mx-auto px-6 pb-20 pt-8">
                    <Home />
                  </div>
                }
              />

              <Route
                path="/login"
                element={
                  <div className="container mx-auto px-6 pb-20 pt-8">
                    {user ? authRedirect : <Login />}
                  </div>
                }
              />
              <Route
                path="/register"
                element={
                  <div className="container mx-auto px-6 pb-20 pt-8">
                    {user ? authRedirect : <Register />}
                  </div>
                }
              />

              {/* Signed-in screens sit inside the app shell so they get
                  persistent, role-aware navigation. */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AppShell>
                      <AdminDashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/registrar/*"
                element={
                  <ProtectedRoute allowedRoles={["registrar", "admin"]}>
                    <AppShell>
                      <RegistrarDashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctor/*"
                element={
                  <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                    <AppShell>
                      <DoctorDashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/parent/*"
                element={
                  <ProtectedRoute allowedRoles={["parent", "admin"]}>
                    <AppShell>
                      <ParentDashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/child/:id"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ChildDetail />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </Suspense>
      </main>
    </Router>
  );
};

function App() {
  return (
    // Outermost so a render failure anywhere still leaves a usable page.
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
