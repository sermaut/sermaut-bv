-- Sistema de Avaliações/Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews of their requests"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create reviews for their completed requests"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM service_requests 
      WHERE id = request_id 
      AND user_id = auth.uid() 
      AND status = 'completed'
    )
  );

-- Sistema de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- Adicionar campo deposit_verified à tabela user_transactions
ALTER TABLE public.user_transactions 
ADD COLUMN IF NOT EXISTS deposit_receipt_path text,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Trigger para auditoria em aprovações de usuário
CREATE OR REPLACE FUNCTION audit_user_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.account_status != OLD.account_status THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      'user_status_changed',
      'profile',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.account_status,
        'new_status', NEW.account_status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_profile_status_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_approval();

-- Trigger para auditoria em solicitações
CREATE OR REPLACE FUNCTION audit_request_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, 'request_created', 'service_request', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      'request_status_changed',
      'service_request',
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'request_deleted', 'service_request', OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_service_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION audit_request_changes();