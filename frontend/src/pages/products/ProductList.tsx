import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Product } from '../../types';
import { Search, Plus, AlertTriangle, ArrowLeftRight, Edit, Package } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Pagination } from '../../components/common/Pagination';
import { Badge } from '../../components/common/Badge';
import { StockAdjustmentModal } from './StockAdjustmentModal';

export const ProductList: React.FC = () => {
  const { canManageProducts, canAdjustStock } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const isLowStockFilter = searchParams.get('lowStock') === 'true';

  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (q) params.append('q', q);
      if (isLowStockFilter) params.append('lowStock', 'true');

      const res = await apiRequest<Product[]>(`/products?${params.toString()}`);
      setProducts(res.data || []);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, isLowStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const toggleLowStockFilter = () => {
    if (isLowStockFilter) {
      searchParams.delete('lowStock');
    } else {
      searchParams.set('lowStock', 'true');
    }
    setSearchParams(searchParams);
    setPage(1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Inventory & Product Catalog</h1>
          <p className="subtitle">Track stock levels, warehouse locations, and inventory thresholds</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/stock-movements" className="btn btn-secondary">
            <ArrowLeftRight size={18} /> View Movement Logs
          </Link>
          {canManageProducts && (
            <Link to="/products/new" className="btn btn-primary">
              <Plus size={18} /> Add New Product
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by product name, SKU, or category..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn ${isLowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleLowStockFilter}
            >
              <AlertTriangle size={16} /> {isLowStockFilter ? 'Showing Low Stock Only' : 'Filter Low Stock'}
            </button>

            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Product List Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner message="Fetching inventory records..." />
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU Code</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Current Stock</th>
                    <th>Min Alert Level</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                        No product inventory matching query criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLowStock = p.currentStock <= p.minStockAlert;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Package size={16} style={{ color: '#2563eb' }} />
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td>
                            <code>{p.sku}</code>
                          </td>
                          <td>{p.category}</td>
                          <td style={{ fontWeight: 600 }}>${Number(p.unitPrice).toFixed(2)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, color: isLowStock ? '#dc2626' : 'var(--color-text-main)' }}>
                                {p.currentStock} units
                              </span>
                              {isLowStock && <Badge variant="low-stock">LOW STOCK</Badge>}
                            </div>
                          </td>
                          <td>{p.minStockAlert} units</td>
                          <td>{p.location}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {canAdjustStock && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedProductForAdjustment(p)}
                                  title="Manual Stock IN/OUT Adjustment"
                                >
                                  <ArrowLeftRight size={14} /> Adjust Stock
                                </button>
                              )}
                              {canManageProducts && (
                                <Link to={`/products/${p.id}/edit`} className="btn btn-secondary btn-sm" title="Edit Product Specs">
                                  <Edit size={14} /> Edit
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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

      {/* Stock Adjustment Modal */}
      {selectedProductForAdjustment && (
        <StockAdjustmentModal
          product={selectedProductForAdjustment}
          onClose={() => setSelectedProductForAdjustment(null)}
          onSuccess={() => {
            setSelectedProductForAdjustment(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};
