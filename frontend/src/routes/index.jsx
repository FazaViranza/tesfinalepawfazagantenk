import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Login from '../pages/Login';

import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Transactions from '../pages/Transactions';
import POS from '../pages/POS';
import Cashiers from '../pages/Cashiers';

import AIPrediction from '../pages/AIPrediction';
import AIRecommendation from '../pages/AIRecommendation';
import AIInsights from '../pages/AIInsights';
import AIChat from '../pages/AIChat';

import Layout from '../components/Layout';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">
            Memuat UMKM.AI...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'owner') {
      return <Navigate to="/dashboard" replace />;
    }

    if (user.role === 'cashier') {
      return <Navigate to="/pos" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === 'owner') {
      return <Navigate to="/dashboard" replace />;
    }

    if (user.role === 'cashier') {
      return <Navigate to="/pos" replace />;
    }
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>

      {/* =========================================
          LANDING PAGE
          ========================================= */}

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* =========================================
          LOGIN
          ========================================= */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* =========================================
          AUTHENTICATED APPLICATION
          ========================================= */}

      <Route
        path="/"
        element={
          <ProtectedRoute roles={['owner', 'cashier']}>
            <Layout />
          </ProtectedRoute>
        }
      >

        {/* =====================================
            OWNER
            ===================================== */}

        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={['owner']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="products"
          element={
            <ProtectedRoute roles={['owner']}>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="categories"
          element={
            <ProtectedRoute roles={['owner']}>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="cashiers"
          element={
            <ProtectedRoute roles={['owner']}>
              <Cashiers />
            </ProtectedRoute>
          }
        />

        <Route
          path="ai/prediction"
          element={
            <ProtectedRoute roles={['owner']}>
              <AIPrediction />
            </ProtectedRoute>
          }
        />

        <Route
          path="ai/recommendation"
          element={
            <ProtectedRoute roles={['owner']}>
              <AIRecommendation />
            </ProtectedRoute>
          }
        />

        <Route
          path="ai/insights"
          element={
            <ProtectedRoute roles={['owner']}>
              <AIInsights />
            </ProtectedRoute>
          }
        />

        <Route
          path="ai/chat"
          element={
            <ProtectedRoute roles={['owner']}>
              <AIChat />
            </ProtectedRoute>
          }
        />

        {/* =====================================
            OWNER + CASHIER
            ===================================== */}

        <Route
          path="transactions"
          element={
            <ProtectedRoute roles={['owner', 'cashier']}>
              <Transactions />
            </ProtectedRoute>
          }
        />

        {/* =====================================
            CASHIER
            ===================================== */}

        <Route
          path="pos"
          element={
            <ProtectedRoute roles={['cashier']}>
              <POS />
            </ProtectedRoute>
          }
        />

      </Route>

      {/* =========================================
          FALLBACK
          ========================================= */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default AppRoutes;