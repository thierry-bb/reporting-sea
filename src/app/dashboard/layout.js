import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/Sidebar';
import NavigationProgress from '@/components/layout/NavigationProgress';

export default async function DashboardLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'client';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Sidebar role={role} />
      <div
        style={{
          marginLeft: 'var(--sidebar-nav-width)',
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
