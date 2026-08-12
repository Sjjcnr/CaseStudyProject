import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiRequest, ApiError } from '../../api/client';
import { Customer, Product, Challan } from '../../types';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface FormItem {
  productId: string;
  quantity: number;
}

export const ChallanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ productId: '', quantity: 1 }]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          apiRequest<Customer[]>('/customers?limit=100'),
          apiRequest<Product[]>('/products?limit=100'),
        ]);

        const loadedCustomers = custRes.data || [];
        const loadedProducts = prodRes.data || [];
        setCustomers(loadedCustomers);
        setProducts(loadedProducts);

        if (loadedCustomers.length > 0) {
          setCustomerId(loadedCustomers[0].id);
        }

        if (loadedProducts.length > 0) {
          setItems([{ productId: loadedProducts[0].id, quantity: 1 }]);
        }

        if (isEditMode && id) {
          const chRes = await apiRequest<Challan>(`/challans/${id}`);
          const ch = chRes.data;

          if (ch.status !== 'DRAFT') {
            setError(`Challan ${ch.challanNumber} is in '${ch.status}' status and cannot be edited.`);
            return;
          }

          setCustomerId(ch.customerId);
          if (ch.items && ch.items.length > 0) {
            setItems(ch.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditMode]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const calculateTotals = () => {
    let totalQty = 0;
    let totalAmt = 0;

    items.forEach((item) => {
      const p = productMap.get(item.productId);
      const qty = item.quantity || 0;
      totalQty += qty;
      if (p) {
        totalAmt += Number(p.unitPrice) * qty;
      }
    });

    return { totalQty, totalAmt };
  };

  const { totalQty, totalAmt } = calculateTotals();

  const handleSave = async (targetStatus: 'DRAFT' | 'CONFIRMED') => {
    setError(null);
    setErrorDetails([]);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      setError('All challan line items must have a valid product and quantity >= 1.');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && id) {
        await apiRequest(`/challans/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ customerId, items }),
        });

        if (targetStatus === 'CONFIRMED') {
          await apiRequest(`/challans/${id}/confirm`, { method: 'POST' });
        }
      } else {
        await apiRequest('/challans', {
          method: 'POST',
          body: JSON.stringify({
            customerId,
            status: targetStatus,
            items,
          }),
        });
      }

      navigate('/challans');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details || []);
      } else {
        setError('An unexpected server error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing sales challan form..." />;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Challans
        </Link>
        <h1>{isEditMode ? 'Edit Draft Challan' : 'Create Sales Delivery Challan'}</h1>
      </div>

      {error && <Alert type="danger" message={error} details={errorDetails} />}

      <div className="card">
        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <label className="form-label">Select Customer *</label>
          <select
            className="form-control"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName} — {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Line Items & Product Quantities</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
              <Plus size={16} /> Add Product Line
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available Stock</th>
                  <th>Unit Price</th>
                  <th style={{ width: '130px' }}>Quantity</th>
                  <th>Line Total</th>
                  <th style={{ width: '60px' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const selectedProduct = productMap.get(item.productId);
                  const isStockShortage = selectedProduct ? selectedProduct.currentStock < item.quantity : false;
                  const lineTotal = selectedProduct ? Number(selectedProduct.unitPrice) * item.quantity : 0;

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-control"
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {selectedProduct ? (
                          <span style={{ fontWeight: 600, color: isStockShortage ? '#dc2626' : '#16a34a' }}>
                            {selectedProduct.currentStock} units
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>${selectedProduct ? Number(selectedProduct.unitPrice).toFixed(2) : '0.00'}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>${lineTotal.toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Line Items:</span>{' '}
            <strong>{items.length}</strong>
            <span style={{ margin: '0 1rem', color: '#cbd5e1' }}>|</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Dispatch Units:</span>{' '}
            <strong>{totalQty} pcs</strong>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            Total Value: ${totalAmt.toFixed(2)}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link to="/challans" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={submitting}
            onClick={() => handleSave('DRAFT')}
          >
            <Save size={16} /> {submitting ? 'Processing...' : 'Save as DRAFT (No Stock Change)'}
          </button>
          <button
            type="button"
            className="btn btn-success"
            disabled={submitting}
            onClick={() => handleSave('CONFIRMED')}
          >
            <CheckCircle2 size={16} /> {submitting ? 'Confirming...' : 'Save & CONFIRM (Reduces Stock)'}
          </button>
        </div>
      </div>
    </div>
  );
};
