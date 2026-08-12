import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import { StockMovement, Product } from '../../types';
import { ArrowLeft, Clock, ArrowDownRight, ArrowUpRight, Filter, Package } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StockMovementHistory: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [productIdFilter, setProductIdFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      // If product ID is selected, query product movements specifically, else aggregate from products
      let resMovements: StockMovement[] = [];

      if (productIdFilter) {
        const res = await apiRequest<StockMovement[]>(`/products/${productIdFilter}/stock-movements`);
        resMovements = res.data || [];
      } else {
        // Fetch all products and gather recent movements
        const prodRes = await apiRequest<Product[]>('/products?limit=100');
        const prods = prodRes.data || [];
        setProducts(prods);

        // Fetch movements for first 5 products to build history
        const allMovs: StockMovement[] = [];
        for (const p of prods.slice(0, 10)) {
          const mRes = await apiRequest<StockMovement[]>(`/products/${p.id}/stock-movements`);
          allMovs.push(...(mRes.data || []));
        }

        // Sort by date desc
        resMovements = allMovs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      if (typeFilter) {
        resMovements = resMovements.filter((m) => m.movementType === typeFilter);
      }

      setMovements(resMovements);
    } catch (err) {
      console.error('Failed to fetch stock movements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [productIdFilter, typeFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/products" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
          <div>
            <h1>Stock Movement Audit Trail</h1>
            <p className="subtitle">Immutable inventory logs for all IN and OUT adjustments</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <Filter size={16} style={{ color: '#64748b' }} />

          <select
            className="form-control"
            value={productIdFilter}
            onChange={(e) => setProductIdFilter(e.target.value)}
            style={{ minWidth: '220px', flex: 1 }}
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Stock Added)</option>
            <option value="OUT">OUT (Stock Removed)</option>
          </select>
        </div>
      </div>

      {/* Movement Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Fetching stock movement logs..." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity Changed</th>
                  <th>Reason / Reference</th>
                  <th>Logged By</th>
                  <th>Linked Challan</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                      No stock movement logs found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isIN = m.movementType === 'IN';
                    return (
                      <tr key={m.id}>
                        <td>
                          <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <Package size={14} style={{ color: '#2563eb' }} />
                            <span>{m.productId}</span>
                          </div>
                        </td>
                        <td>
                          {isIN ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 700, fontSize: '0.8rem' }}>
                              <ArrowDownRight size={14} /> IN
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem' }}>
                              <ArrowUpRight size={14} /> OUT
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: isIN ? '#16a34a' : '#dc2626' }}>
                          {isIN ? `+${m.quantityChanged}` : `-${m.quantityChanged}`} units
                        </td>
                        <td>{m.reason}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {m.createdBy?.name || 'System User'} ({m.createdBy?.role})
                          </span>
                        </td>
                        <td>
                          {m.challan ? (
                            <Link to={`/challans/${m.challan.id}`} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              {m.challan.challanNumber}
                            </Link>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Manual Adj</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
