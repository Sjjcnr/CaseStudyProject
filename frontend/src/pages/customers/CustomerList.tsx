import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Customer, CustomerStatus, CustomerType } from '../../types';
import { Search, Filter, Plus, Phone, Mail, Building, Eye, Edit } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Pagination } from '../../components/common/Pagination';
import { Badge } from '../../components/common/Badge';

export const CustomerList: React.FC = () => {
  const { canManageCustomers } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (q) params.append('q', q);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await apiRequest<Customer[]>(`/customers?${params.toString()}`);
      setCustomers(res.data || []);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Customer CRM Directory</h1>
          <p className="subtitle">Manage leads, active clients, and follow-up schedules</p>
        </div>
        {canManageCustomers && (
          <Link to="/customers/new" className="btn btn-primary">
            <Plus size={18} /> Add New Customer
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by name, business, mobile, or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ minWidth: '130px' }}
            >
              <option value="">All Statuses</option>
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>

            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Types</option>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>

            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Customer List Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Fetching customer records..." />
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Business Name</th>
                    <th>Contact Info</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Next Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                        No customer records matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>
                          <Link to={`/customers/${c.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)' }}>
                            {c.name}
                          </Link>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building size={14} style={{ color: '#94a3b8' }} />
                            <span>{c.businessName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.825rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Phone size={12} style={{ color: '#94a3b8' }} /> {c.mobile}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)' }}>
                              <Mail size={12} style={{ color: '#94a3b8' }} /> {c.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{c.type}</span>
                        </td>
                        <td>
                          <Badge variant={c.status.toLowerCase() as any}>{c.status}</Badge>
                        </td>
                        <td>
                          {c.followUpDate ? (
                            <span style={{ fontSize: '0.825rem', fontWeight: 500, color: '#2563eb' }}>
                              {new Date(c.followUpDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None scheduled</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/customers/${c.id}`} className="btn btn-secondary btn-sm" title="View Timeline & Details">
                              <Eye size={14} /> Details
                            </Link>
                            {canManageCustomers && (
                              <Link to={`/customers/${c.id}/edit`} className="btn btn-secondary btn-sm" title="Edit Customer">
                                <Edit size={14} /> Edit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={10}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
};
