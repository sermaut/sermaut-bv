import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PENALTY_AMOUNT = 200;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find tasks that are in_progress and accepted more than 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: overdueTasks, error: fetchError } = await supabase
      .from('contractor_tasks')
      .select('*, contractors(id, user_id, balance)')
      .eq('status', 'in_progress')
      .lt('accepted_at', twoDaysAgo.toISOString())
      .not('accepted_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching overdue tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${overdueTasks?.length || 0} overdue tasks`);

    const results = [];

    for (const task of overdueTasks || []) {
      try {
        // Deduct penalty from contractor balance
        const newBalance = Math.max(0, (task.contractors?.balance || 0) - PENALTY_AMOUNT);
        
        await supabase
          .from('contractors')
          .update({ balance: newBalance })
          .eq('id', task.contractor_id);

        // Create transaction record for the penalty
        await supabase
          .from('contractor_transactions')
          .insert({
            contractor_id: task.contractor_id,
            type: 'manual_subtract',
            amount: -PENALTY_AMOUNT,
            description: `Penalidade por não cumprir prazo de 2 dias na tarefa: ${task.title}`,
            task_id: task.id,
          });

        // Update task status to cancelled
        await supabase
          .from('contractor_tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', task.id);

        // Notify the contractor
        if (task.contractors?.user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: task.contractors.user_id,
              title: 'Penalidade Aplicada',
              description: `Foi debitado ${PENALTY_AMOUNT} Kz da sua conta por não cumprir o prazo de 2 dias na tarefa "${task.title}".`,
              type: 'penalty',
            });
        }

        results.push({ taskId: task.id, status: 'penalized' });
        console.log(`Penalized task ${task.id} for contractor ${task.contractor_id}`);
      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        results.push({ taskId: task.id, status: 'error', error: String(taskError) });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in check-task-deadlines function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
