-- Adicionar tipos e colunas para sistema de carteira e aprovação
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM (
      'pending',
      'approved', 
      'rejected',
      'suspended'
    );
  END IF;
END $$;

-- Adicionar colunas em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS balance NUMERIC(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS account_status public.account_status DEFAULT 'pending' NOT NULL;

-- Vincular contratados a contas de usuário
ALTER TABLE public.contractors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar tabela de transações de usuários
CREATE TABLE IF NOT EXISTS public.user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions' AND tablename = 'user_transactions') THEN
    CREATE POLICY "Users can view their own transactions"
      ON public.user_transactions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all transactions' AND tablename = 'user_transactions') THEN
    CREATE POLICY "Admins can view all transactions"
      ON public.user_transactions FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert transactions' AND tablename = 'user_transactions') THEN
    CREATE POLICY "Admins can insert transactions"
      ON public.user_transactions FOR INSERT
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Função para deduzir saldo ao criar solicitação
CREATE OR REPLACE FUNCTION public.deduct_balance_on_request()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário tem saldo suficiente
  IF (SELECT balance FROM public.profiles WHERE id = NEW.user_id) < NEW.price THEN
    RAISE EXCEPTION 'Saldo insuficiente. Você precisa de % Kz mas tem apenas % Kz', 
      NEW.price, 
      (SELECT balance FROM public.profiles WHERE id = NEW.user_id);
  END IF;

  -- Deduzir saldo
  UPDATE public.profiles
  SET balance = balance - NEW.price
  WHERE id = NEW.user_id;

  -- Criar registro de transação
  INSERT INTO public.user_transactions (
    user_id,
    type,
    amount,
    description,
    request_id
  ) VALUES (
    NEW.user_id,
    'service_deduction',
    -NEW.price,
    'Pagamento pela solicitação de ' || NEW.service_type::text,
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Trigger para deduzir saldo
DROP TRIGGER IF EXISTS deduct_balance_after_request ON public.service_requests;
CREATE TRIGGER deduct_balance_after_request
  AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.deduct_balance_on_request();

-- Atualizar função handle_new_user para definir status como pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_status, balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'pending',
    0
  );

  -- Criar notificação para o usuário
  INSERT INTO public.notifications (
    user_id,
    title,
    description,
    type
  ) VALUES (
    NEW.id,
    'Cadastro em Análise',
    'Nossos sistemas estão avaliando seu pedido. Você receberá uma mensagem através de e-mail ou SMS quando for aprovado.',
    'account_status'
  );

  RETURN NEW;
END;
$$;

-- Atualizar políticas RLS para apenas usuários aprovados criarem solicitações
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.service_requests;
CREATE POLICY "Users can insert their own requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT account_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
  );

-- Criar função para adicionar saldo
CREATE OR REPLACE FUNCTION public.add_user_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;
END;
$$;