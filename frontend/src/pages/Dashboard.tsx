import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Customer, Product, Challan } from '../types';
import { Users, Package, AlertTriangle, FileText, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const { user, canManageCustomers, canManageProducts, canManageChallans } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    draftChallans: 0,
    confirmedChallans: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes, lowStockRes, draftRes, confRes, recentChallanRes] = await Promise.all([
          apiRequest<Customer[]>('/customers?limit=100'),
          apiRequest<Product[]>('/products?limit=100'),
          apiRequest<Product[]>('/products?lowStock=true'),
          apiRequest<Challan[]>('/challans?status=DRAFT'),
          apiRequest<Challan[]>('/challans?status=CONFIRMED'),
          apiRequest<Challan[]>('/challans?limit=5'),
        ]);

        const customers = custRes.data || [];
        const activeCusts = customers.filter((c) => c.status === 'ACTIVE').length;

        setStats({
          totalCustomers: custRes.meta?.total || customers.length,
          activeCustomers: activeCusts,
          totalProducts: prodRes.meta?.total || (prodRes.data || []).length,
          lowStockCount: lowStockRes.meta?.total || (lowStockRes.data || []).length,
          draftChallans: draftRes.meta?.total || (draftRes.data || []).length,
          confirmedChallans: confRes.meta?.total || (confRes.data || []).length,
        });

        setLowStockProducts(lowStockRes.data || []);
        setRecentChallans(recentChallanRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Gathering portal metrics..." />;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Operations Dashboard</h1>
          <p className="subtitle">
            Welcome back, <strong>{user?.name}</strong> ({user?.role} Role)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canManageCustomers && (
            <Link to="/customers/new" className="btn btn-primary btn-sm">
              <Plus size={16} /> New Customer
            </Link>
          )}
          {canManageProducts && (
            <Link to="/products/new" className="btn btn-secondary btn-sm">
              <Plus size={16} /> New Product
            </Link>
          )}
          {canManageChallans && (
            <Link to="/challans/new" className="btn btn-success btn-sm">
              <Plus size={16} /> Create Challan
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.totalCustomers}</div>
            <div className="stat-label">Total Customers ({stats.activeCustomers} Active)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Catalog Products</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: stats.lowStockCount > 0 ? '#fca5a5' : undefined }}>
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? '#dc2626' : undefined }}>
              {stats.lowStockCount}
            </div>
            <div className="stat-label">Low Stock Alerts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.draftChallans}</div>
            <div className="stat-label">Draft Challans</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.confirmedChallans}</div>
            <div className="stat-label">Confirmed Challans</div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem', borderColor: '#fecaca' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
              <AlertTriangle size={20} />
              <h3 style={{ color: '#b91c1c' }}>Low Stock Inventory Alert ({lowStockProducts.length} Items)</h3>
            </div>
            <Link to="/products?lowStock=true" className="btn btn-secondary btn-sm">
              View All Low Stock <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Location</th>
                  <th>Current Stock</th>
                  <th>Min Alert Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><code>{p.sku}</code></td>
                    <td>{p.location}</td>
                    <td style={{ color: '#dc2626', fontWeight: 700 }}>{p.currentStock} units</td>
                    <td>{p.minStockAlert} units</td>
                    <td>
                      <Badge variant="low-stock">CRITICAL LOW</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity: Challans */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Sales Challans</h3>
          <Link to="/challans" className="btn btn-secondary btn-sm">
            View All Challans <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer</th>
                <th>Total Items</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentChallans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                    No sales challans created yet.
                  </td>
                </tr>
              ) : (
                recentChallans.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <strong style={{ color: 'var(--color-primary)' }}>{ch.challanNumber}</strong>
                    </td>
                    <td>{ch.customer?.businessName || ch.customer?.name}</td>
                    <td>{ch.totalQuantity} pcs</td>
                    <td style={{ fontWeight: 600 }}>${Number(ch.totalAmount).toFixed(2)}</td>
                    <td>
                      <Badge variant={ch.status.toLowerCase() as any}>{ch.status}</Badge>
                    </td>
                    <td>{ch.createdBy?.name}</td>
                    <td>
                      <Link to={`/challans/${ch.id}`} className="btn btn-secondary btn-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
