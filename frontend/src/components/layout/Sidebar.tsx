import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ArrowLeftRight, FileText } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers CRM', path: '/customers', icon: Users },
    { label: 'Products Inventory', path: '/products', icon: Package },
    { label: 'Stock Movements', path: '/stock-movements', icon: ArrowLeftRight },
    { label: 'Sales Challans', path: '/challans', icon: FileText },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">ERP</div>
        <div>
          <div style={{ lineHeight: 1 }}>Mini ERP + CRM</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
            Ops Portal
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
