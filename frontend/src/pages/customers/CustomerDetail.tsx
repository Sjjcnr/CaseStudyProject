import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Customer, CustomerFollowUp } from '../../types';
import { ArrowLeft, Building, Phone, Mail, MapPin, Calendar, Clock, Plus, Send, Edit } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { canManageCustomers } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Customer>(`/customers/${id}`);
      setCustomer(res.data);
    } catch (err: any) {
      setError(err.message || 'Customer not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetail();
    }
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    setNoteError(null);

    try {
      const res = await apiRequest<CustomerFollowUp>(`/customers/${id}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });

      setCustomer((prev) => {
        if (!prev) return prev;
        const updatedFollowUps = [res.data, ...(prev.followUps || [])];
        return { ...prev, followUps: updatedFollowUps };
      });

      setNewNote('');
    } catch (err: any) {
      setNoteError(err.message || 'Failed to post follow-up note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading customer details and history..." />;
  }

  if (error || !customer) {
    return (
      <div>
        <Alert type="danger" message={error || 'Customer not found'} />
        <Link to="/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
      </div>
    );
  }

  const followUps = customer.followUps || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/customers" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1>{customer.name}</h1>
            <p className="subtitle">{customer.businessName}</p>
          </div>
        </div>
        {canManageCustomers && (
          <Link to={`/customers/${customer.id}/edit`} className="btn btn-secondary btn-sm">
            <Edit size={16} /> Edit Customer Profile
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Customer Information Card */}
        <div className="card">
          <div className="card-header">
            <h3>Account Overview</h3>
            <Badge variant={customer.status.toLowerCase() as any}>{customer.status}</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Category</span>
              <strong style={{ fontSize: '0.95rem' }}>{customer.type}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Contact Phone</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                <Phone size={16} style={{ color: '#2563eb' }} />
                <span>{customer.mobile}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Email Address</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                <Mail size={16} style={{ color: '#2563eb' }} />
                <span>{customer.email}</span>
              </div>
            </div>

            {customer.gstNumber && (
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>GST Tax ID</span>
                <code>{customer.gstNumber}</code>
              </div>
            )}

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Address</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.1rem' }}>
                <MapPin size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                <span>{customer.address}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Scheduled Follow-up</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem', color: '#2563eb', fontWeight: 600 }}>
                <Calendar size={16} />
                <span>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'No date set'}</span>
              </div>
            </div>

            {customer.notes && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'block' }}>Profile Notes</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.25rem' }}>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Notes Timeline Card */}
        <div className="card">
          <div className="card-header">
            <h3>Follow-up History & CRM Activity</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{followUps.length} entries</span>
          </div>

          {canManageCustomers && (
            <form onSubmit={handleAddFollowUp} style={{ marginBottom: '1.5rem' }}>
              {noteError && <Alert type="danger" message={noteError} />}
              <div className="form-group">
                <label className="form-label">Record New Follow-Up Note</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter details of conversation, email interaction, requirement update..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingNote || !newNote.trim()}>
                  <Send size={14} /> {submittingNote ? 'Saving Note...' : 'Add Note to Timeline'}
                </button>
              </div>
            </form>
          )}

          {followUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
              No follow-up notes recorded for this customer yet.
            </div>
          ) : (
            <div className="timeline">
              {followUps.map((fu) => (
                <div key={fu.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {fu.author?.name || 'Staff User'} ({fu.author?.role})
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {new Date(fu.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                      {fu.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
