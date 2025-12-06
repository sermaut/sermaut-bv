-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to insert their own transactions (for deposits)
CREATE POLICY "Users can insert their own transactions"
ON public.user_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to update transactions (for verification)
CREATE POLICY "Admins can update transactions"
ON public.user_transactions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));