-- Adicionar políticas RLS para administradores na tabela profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles 
  FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'::app_role));