-- Add accepted_at column to contractor_tasks for tracking 2-day deadline
ALTER TABLE public.contractor_tasks 
ADD COLUMN accepted_at timestamp with time zone;

-- Add approval columns to request_attachments for contractor proof workflow
ALTER TABLE public.request_attachments 
ADD COLUMN approved boolean DEFAULT false,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN uploaded_by uuid REFERENCES auth.users(id);

-- Create index for faster queries on pending approvals
CREATE INDEX idx_request_attachments_pending_approval 
ON public.request_attachments (approved) 
WHERE approved = false;

-- RLS policy for contractors to view their own tasks
CREATE POLICY "Contractors can view their own tasks"
ON public.contractor_tasks
FOR SELECT
USING (
  contractor_id IN (
    SELECT id FROM public.contractors WHERE user_id = auth.uid()
  )
);

-- RLS policy for contractors to update their own tasks (accept/reject)
CREATE POLICY "Contractors can update their own tasks"
ON public.contractor_tasks
FOR UPDATE
USING (
  contractor_id IN (
    SELECT id FROM public.contractors WHERE user_id = auth.uid()
  )
);

-- RLS policy for contractors to delete their own tasks (reject)
CREATE POLICY "Contractors can delete their own tasks"
ON public.contractor_tasks
FOR DELETE
USING (
  contractor_id IN (
    SELECT id FROM public.contractors WHERE user_id = auth.uid()
  )
);

-- RLS policy for contractors to view their own transactions
CREATE POLICY "Contractors can view their own transactions"
ON public.contractor_transactions
FOR SELECT
USING (
  contractor_id IN (
    SELECT id FROM public.contractors WHERE user_id = auth.uid()
  )
);

-- RLS policy for contractors to view their own contractor record
CREATE POLICY "Contractors can view their own record"
ON public.contractors
FOR SELECT
USING (user_id = auth.uid());