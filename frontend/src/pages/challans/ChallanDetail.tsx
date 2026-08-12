import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, ApiError } from '../../api/client';
import { Challan } from '../../types';
import { ArrowLeft, CheckCircle2, XCircle, Edit, Building, Clock, User as UserIcon, Package, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { canManageChallans } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchChallan = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Challan>(`/challans/${id}`);
      setChallan(res.data);
    } catch (err: any) {
      setError(err.message || 'Sales challan not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!id || !challan) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<Challan>(`/challans/${id}/confirm`, { method: 'POST' });
      setChallan(res.data);
      setSuccessMsg(`Challan ${res.data.challanNumber} confirmed successfully. Product stock reduced and OUT movement logged.`);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to confirm challan');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !challan) return;
    if (!window.confirm(`Are you sure you want to cancel challan ${challan.challanNumber}? This will restore product stock.`)) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<Challan>(`/challans/${id}/cancel`, { method: 'POST' });
      setChallan(res.data);
      setSuccessMsg(`Challan ${res.data.challanNumber} cancelled. Product stock restored via IN movement logs.`);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to cancel challan');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading sales challan details..." />;
  }

  if (error && !challan) {
    return (
      <div>
        <Alert type="danger" message={error} />
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Challans
        </Link>
      </div>
    );
  }

  if (!challan) return null;

  const items = challan.items || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/challans" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>Challan #{challan.challanNumber}</h1>
              <Badge variant={challan.status.toLowerCase() as any}>{challan.status}</Badge>
            </div>
            <p className="subtitle">Created on {new Date(challan.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {canManageChallans && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {challan.status === 'DRAFT' && (
              <>
                <Link to={`/challans/${challan.id}/edit`} className="btn btn-secondary btn-sm">
                  <Edit size={16} /> Edit Draft
                </Link>
                <button
                  className="btn btn-success btn-sm"
                  disabled={actionLoading}
                  onClick={handleConfirm}
                >
                  <CheckCircle2 size={16} /> {actionLoading ? 'Confirming...' : 'Confirm Challan (Reduce Stock)'}
                </button>
              </>
            )}

            {challan.status === 'CONFIRMED' && (
              <button
                className="btn btn-outline-danger btn-sm"
                disabled={actionLoading}
                onClick={handleCancel}
              >
                <XCircle size={16} /> {actionLoading ? 'Cancelling...' : 'Cancel Challan (Restore Stock)'}
              </button>
            )}
          </div>
        )}
      </div>

      {error && <Alert type="danger" message={error} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      {/* Grid Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Summary Card */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Dispatch Summary</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Customer</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, marginTop: '0.1rem' }}>
                <Building size={16} style={{ color: '#2563eb' }} />
                <span>{challan.customer?.businessName} ({challan.customer?.name})</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Created By Staff</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                <UserIcon size={16} style={{ color: '#2563eb' }} />
                <span>{challan.createdBy?.name} ({challan.createdBy?.role})</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Total Dispatch Units</span>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>{challan.totalQuantity} pcs</span>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Total Challan Amount</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                ${Number(challan.totalAmount).toFixed(2)}
              </span>
            </div>

            {challan.confirmedAt && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Confirmed At</span>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {new Date(challan.confirmedAt).toLocaleString()}
                </span>
              </div>
            )}

            {challan.cancelledAt && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Cancelled At</span>
                <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {new Date(challan.cancelledAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product Snapshots Items Card */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Product Line Item Snapshots</h3>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th>Snapshot Unit Price</th>
                  <th>Quantity</th>
                  <th>Item Total</th>
                  <th>Current Live Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const lineTotal = Number(item.unitPrice) * item.quantity;
                  const liveStock = item.product?.currentStock;
                  const isStockShortage = liveStock !== undefined && liveStock < item.quantity && challan.status === 'DRAFT';

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Package size={16} style={{ color: '#2563eb' }} />
                          <span>{item.productName}</span>
                        </div>
                      </td>
                      <td><code>{item.sku}</code></td>
                      <td>${Number(item.unitPrice).toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>{item.quantity} pcs</td>
                      <td style={{ fontWeight: 700 }}>${lineTotal.toFixed(2)}</td>
                      <td>
                        {liveStock !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ color: isStockShortage ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                              {liveStock} units
                            </span>
                            {isStockShortage && (
                              <span title="Stock insufficient for confirmation">
                                <AlertTriangle size={14} style={{ color: '#dc2626' }} />
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
