import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";

const Home = lazy(() => import("./pages/Home"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return <div className="loading-bar" aria-hidden="true" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header />
      <main id="main-content">
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/service/:code" element={<ServiceDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signin" element={<Auth tab="signin" />} />
              <Route path="/signup" element={<Auth tab="signup" />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BackToTop />
      </ToastProvider>
    </AuthProvider>
  );
}
