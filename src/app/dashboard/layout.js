import { createSupabaseServerClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'client';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role={role} />
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
