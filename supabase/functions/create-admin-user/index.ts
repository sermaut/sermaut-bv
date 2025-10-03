import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se admin já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUser?.users.some(u => u.email === 'manuelbemvindom3@gmail.com');

    if (adminExists) {
      console.log('Admin já existe');
      return new Response(
        JSON.stringify({ message: 'Admin já existe' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar admin
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'manuelbemvindom3@gmail.com',
      password: 'mbM-0608',
      email_confirm: true,
      user_metadata: {
        full_name: 'Manuel Bemvindo Mendes',
        phone: '927800658'
      }
    });

    if (createError) throw createError;

    // Adicionar papel de admin
    await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'admin' });

    // Atualizar status para approved
    await supabaseAdmin
      .from('profiles')
      .update({ account_status: 'approved', balance: 0 })
      .eq('id', newUser.user.id);

    console.log('Admin criado com sucesso:', newUser.user.id);

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao criar admin:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
