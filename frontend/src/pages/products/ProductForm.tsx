import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiRequest, ApiError } from '../../api/client';
import { Product } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: '',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchProduct = async () => {
        try {
          const res = await apiRequest<Product>(`/products/${id}`);
          const p = res.data;
          setFormData({
            name: p.name || '',
            sku: p.sku || '',
            category: p.category || '',
            unitPrice: Number(p.unitPrice) || 0,
            currentStock: p.currentStock || 0,
            minStockAlert: p.minStockAlert || 10,
            location: p.location || '',
          });
        } catch (err: any) {
          setError(err.message || 'Failed to load product');
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails([]);
    setSubmitting(true);

    try {
      if (isEditMode && id) {
        // Edit mode excludes changing initial currentStock directly (must use stock adjustment for audit trail)
        const { currentStock, ...updatePayload } = formData;
        await apiRequest(`/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        });
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      navigate('/products');
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
    return <LoadingSpinner message="Loading product data..." />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/products" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
        <h1>{isEditMode ? 'Edit Product Item' : 'Add New Product'}</h1>
      </div>

      {error && <Alert type="danger" message={error} details={errorDetails} />}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ergonomic Wireless Keyboard"
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU Code (Unique) *</label>
              <input
                type="text"
                name="sku"
                className="form-control"
                required
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. KEY-ERG-001"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                name="category"
                className="form-control"
                required
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Peripherals, Audio, Displays"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="unitPrice"
                className="form-control"
                required
                value={formData.unitPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                name="currentStock"
                className="form-control"
                required
                disabled={isEditMode}
                value={formData.currentStock}
                onChange={handleChange}
              />
              {isEditMode && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Stock changes during edit must be recorded via manual Stock Adjustments for audit trail.
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Stock Alert Threshold *</label>
              <input
                type="number"
                min="0"
                name="minStockAlert"
                className="form-control"
                required
                value={formData.minStockAlert}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Rack / Storage Location *</label>
            <input
              type="text"
              name="location"
              className="form-control"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Rack A-04, Bin 12"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Link to="/products" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} /> {submitting ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
