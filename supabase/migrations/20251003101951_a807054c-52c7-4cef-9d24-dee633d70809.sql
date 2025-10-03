-- Corrigir search_path nas funções para segurança

-- Atualizar função calculate_service_price
CREATE OR REPLACE FUNCTION public.calculate_service_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  CASE NEW.service_type
    WHEN 'accompaniment' THEN
      NEW.price := 0; -- Preço variável, definido manualmente
    WHEN 'arrangement_no_mod' THEN
      NEW.price := 250;
    WHEN 'arrangement_with_mod' THEN
      NEW.price := 350;
    WHEN 'review' THEN
      NEW.price := 0; -- Gratuito
  END CASE;
  RETURN NEW;
END;
$function$;

-- Atualizar função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;