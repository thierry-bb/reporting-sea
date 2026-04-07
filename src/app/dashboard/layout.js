import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          minWidth: 0,
          transition: 'margin-left var(--transition-base)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
