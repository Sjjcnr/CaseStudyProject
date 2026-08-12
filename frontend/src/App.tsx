import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { RequireRole } from './components/layout/RequireRole';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/customers/CustomerList';
import { CustomerForm } from './pages/customers/CustomerForm';
import { CustomerDetail } from './pages/customers/CustomerDetail';
import { ProductList } from './pages/products/ProductList';
import { ProductForm } from './pages/products/ProductForm';
import { StockMovementHistory } from './pages/products/StockMovementHistory';
import { ChallanList } from './pages/challans/ChallanList';
import { ChallanForm } from './pages/challans/ChallanForm';
import { ChallanDetail } from './pages/challans/ChallanDetail';
import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Customers CRM */}
            <Route path="/customers" element={<CustomerList />} />
            <Route
              path="/customers/new"
              element={
                <RequireRole roles={['ADMIN', 'SALES']}>
                  <CustomerForm />
                </RequireRole>
              }
            />
            <Route
              path="/customers/:id/edit"
              element={
                <RequireRole roles={['ADMIN', 'SALES']}>
                  <CustomerForm />
                </RequireRole>
              }
            />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* Products & Inventory */}
            <Route path="/products" element={<ProductList />} />
            <Route
              path="/products/new"
              element={
                <RequireRole roles={['ADMIN', 'WAREHOUSE']}>
                  <ProductForm />
                </RequireRole>
              }
            />
            <Route
              path="/products/:id/edit"
              element={
                <RequireRole roles={['ADMIN', 'WAREHOUSE']}>
                  <ProductForm />
                </RequireRole>
              }
            />
            <Route path="/stock-movements" element={<StockMovementHistory />} />

            {/* Sales Challans */}
            <Route path="/challans" element={<ChallanList />} />
            <Route
              path="/challans/new"
              element={
                <RequireRole roles={['ADMIN', 'SALES']}>
                  <ChallanForm />
                </RequireRole>
              }
            />
            <Route
              path="/challans/:id/edit"
              element={
                <RequireRole roles={['ADMIN', 'SALES']}>
                  <ChallanForm />
                </RequireRole>
              }
            />
            <Route path="/challans/:id" element={<ChallanDetail />} />

            {/* Error Pages */}
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
