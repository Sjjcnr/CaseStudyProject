import React, { useState } from 'react';
import { apiRequest, ApiError } from '../../api/client';
import { Product, MovementType } from '../../types';
import { X, ArrowLeftRight } from 'lucide-react';
import { Alert } from '../../components/common/Alert';

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [quantityChanged, setQuantityChanged] = useState<number>(1);
  const [reason, setReason] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    // Client-side quick check
    if (movementType === 'OUT' && quantityChanged > product.currentStock) {
      setError(`Cannot adjust OUT by ${quantityChanged}. Current stock is only ${product.currentStock}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiRequest(`/products/${product.id}/stock-movements`, {
        method: 'POST',
        body: JSON.stringify({
          quantityChanged,
          movementType,
          reason: reason.trim(),
        }),
      });

      onSuccess();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to record stock adjustment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={20} style={{ color: '#2563eb' }} />
            <h3>Manual Stock Adjustment</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <Alert type="danger" message={error} />}

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div><strong>Product:</strong> {product.name} (<code>{product.sku}</code>)</div>
              <div><strong>Current Stock:</strong> {product.currentStock} units</div>
              <div><strong>Location:</strong> {product.location}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Adjustment Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn ${movementType === 'IN' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setMovementType('IN')}
                >
                  ➕ Stock IN (Received)
                </button>
                <button
                  type="button"
                  className={`btn ${movementType === 'OUT' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setMovementType('OUT')}
                >
                  ➖ Stock OUT (Removed)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity to Adjust *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                required
                value={quantityChanged}
                onChange={(e) => setQuantityChanged(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason / Reference *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Warehouse receipt PO-1029, Damage write-off, Sample transfer"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !reason.trim()}>
              {submitting ? 'Applying Adjustment...' : 'Apply Stock Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
