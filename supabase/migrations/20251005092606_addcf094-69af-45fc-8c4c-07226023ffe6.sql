-- Atualizar preços dos serviços
CREATE OR REPLACE FUNCTION public.calculate_service_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  CASE NEW.service_type
    WHEN 'accompaniment' THEN
      NEW.price := 350; -- Acompanhamento: 350 Kz
    WHEN 'arrangement_no_mod' THEN
      NEW.price := 250; -- Arranjos sem Modificações: 250 Kz
    WHEN 'arrangement_with_mod' THEN
      NEW.price := 370; -- Arranjos com Modificações: 370 Kz
    WHEN 'review' THEN
      NEW.price := 50; -- Análises Musicais: 50 Kz
  END CASE;
  RETURN NEW;
END;
$function$;