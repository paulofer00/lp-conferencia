import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Usamos o Service Role pois o servidor precisa ter acesso total para registrar e atualizar os pagamentos
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);