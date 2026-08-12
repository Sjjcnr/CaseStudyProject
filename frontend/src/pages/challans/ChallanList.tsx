import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Challan, ChallanStatus } from '../../types';
import { FileText, Plus, Filter, Eye, Clock } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Pagination } from '../../components/common/Pagination';
import { Badge } from '../../components/common/Badge';

export const ChallanList: React.FC = () => {
  const { canManageChallans } = useAuth();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await apiRequest<Challan[]>(`/challans?${params.toString()}`);
      setChallans(res.data || []);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch sales challans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, statusFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Sales Delivery Challans</h1>
          <p className="subtitle">Manage draft, confirmed, and cancelled sales dispatches</p>
        </div>
        {canManageChallans && (
          <Link to="/challans/new" className="btn btn-primary">
            <Plus size={18} /> Create Sales Challan
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status Filter:</span>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '180px' }}
          >
            <option value="">All Challan Statuses</option>
            <option value="DRAFT">DRAFT (No Stock Change)</option>
            <option value="CONFIRMED">CONFIRMED (Stock Reduced)</option>
            <option value="CANCELLED">CANCELLED (Stock Restored)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Fetching sales challans..." />
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Challan Number</th>
                    <th>Customer Name</th>
                    <th>Total Items</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                        No sales challans match your selection.
                      </td>
                    </tr>
                  ) : (
                    challans.map((ch) => (
                      <tr key={ch.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                            <FileText size={16} style={{ color: '#2563eb' }} />
                            <Link to={`/challans/${ch.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                              {ch.challanNumber}
                            </Link>
                          </div>
                        </td>
                        <td>{ch.customer?.businessName || ch.customer?.name}</td>
                        <td>{ch.totalQuantity} pcs</td>
                        <td style={{ fontWeight: 600 }}>${Number(ch.totalAmount).toFixed(2)}</td>
                        <td>
                          <Badge variant={ch.status.toLowerCase() as any}>{ch.status}</Badge>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {new Date(ch.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{ch.createdBy?.name}</span>
                        </td>
                        <td>
                          <Link to={`/challans/${ch.id}`} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> View Details
                          </Link>
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
