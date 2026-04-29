'use server';

import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function upsertAnalysisClient(clientId, reportMonth, text) {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.user_metadata?.role !== 'agency') {
    throw new Error('Unauthorized');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await supabase
    .from('ai_analyses')
    .upsert(
      { client_id: clientId, report_month: reportMonth, analyse_global_client: text },
      { onConflict: 'client_id,report_month' }
    );
  if (error) throw new Error(error.message);
}
