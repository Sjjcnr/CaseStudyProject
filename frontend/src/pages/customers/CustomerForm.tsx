import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiRequest, ApiError } from '../../api/client';
import { Customer, CustomerType, CustomerStatus } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'RETAIL' as CustomerType,
    address: '',
    status: 'LEAD' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchCustomer = async () => {
        try {
          const res = await apiRequest<Customer>(`/customers/${id}`);
          const c = res.data;
          setFormData({
            name: c.name || '',
            mobile: c.mobile || '',
            email: c.email || '',
            businessName: c.businessName || '',
            gstNumber: c.gstNumber || '',
            type: c.type || 'RETAIL',
            address: c.address || '',
            status: c.status || 'LEAD',
            followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '',
            notes: c.notes || '',
          });
        } catch (err: any) {
          setError(err.message || 'Failed to load customer');
        } finally {
          setLoading(false);
        }
      };

      fetchCustomer();
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails([]);
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        gstNumber: formData.gstNumber.trim() || null,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
        notes: formData.notes.trim() || null,
      };

      if (isEditMode && id) {
        await apiRequest(`/customers/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      navigate('/customers');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details || []);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading customer form data..." />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
        <h1>{isEditMode ? 'Edit Customer Record' : 'Create New Customer'}</h1>
      </div>

      {error && <Alert type="danger" message={error} details={errorDetails} />}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alice Smith"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input
                type="text"
                name="businessName"
                className="form-control"
                required
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Acme Enterprises Ltd"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. contact@acme.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                name="mobile"
                className="form-control"
                required
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. +1-555-0199"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Category *</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange}>
                <option value="RETAIL">RETAIL</option>
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status *</label>
              <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                <option value="LEAD">LEAD</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Tax ID (Optional)</label>
              <input
                type="text"
                name="gstNumber"
                className="form-control"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="e.g. 29ABCDE1234F1Z5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Follow-Up Date (Optional)</label>
              <input
                type="date"
                name="followUpDate"
                className="form-control"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address *</label>
            <textarea
              name="address"
              className="form-control"
              rows={3}
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Full street address, suite, city, state, postal code"
            />
          </div>

          <div className="form-group">
            <label className="form-label">General Notes (Optional)</label>
            <textarea
              name="notes"
              className="form-control"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Background context, specific product interests..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Link to="/customers" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} /> {submitting ? 'Saving...' : isEditMode ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
