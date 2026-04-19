'use server';

import { createClient } from '@supabase/supabase-js';

export async function updateClientToggle(clientId, field, value) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await supabase
    .from('clients')
    .update({ [field]: value })
    .eq('id', clientId);
  if (error) throw new Error(error.message);
}
