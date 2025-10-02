-- =====================================================
-- MELODY HUB - SCHEMA COMPLETO DO BANCO DE DADOS
-- =====================================================

-- =====================================================
-- 1. CRIAR ENUMS (TIPOS PERSONALIZADOS)
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TYPE public.service_type AS ENUM (
  'accompaniment',
  'arrangement_no_mod',
  'arrangement_with_mod',
  'review'
);

CREATE TYPE public.request_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE public.file_type AS ENUM (
  'image',
  'audio',
  'document'
);

CREATE TYPE public.contractor_status AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE public.task_status AS ENUM (
  'assigned',
  'in_progress',
  'completed'
);

CREATE TYPE public.transaction_type AS ENUM (
  'task_payment',
  'manual_add',
  'manual_subtract'
);

-- =====================================================
-- 2. CRIAR TABELAS
-- =====================================================

-- Tabela de Perfis de Usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Papéis de Usuários (Segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de Solicitações de Serviços
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  service_type public.service_type NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  description TEXT,
  status public.request_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Anexos de Solicitações
CREATE TABLE public.request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type public.file_type NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Contratados Parciais
CREATE TABLE public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  id_document_front TEXT,
  id_document_back TEXT,
  balance NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  status public.contractor_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Tarefas dos Contratados
CREATE TABLE public.contractor_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status DEFAULT 'assigned' NOT NULL,
  payment NUMERIC(10, 2) DEFAULT 150 NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Transações Financeiras dos Contratados
CREATE TABLE public.contractor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE NOT NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  task_id UUID REFERENCES public.contractor_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Mensagens (Chat tipo WhatsApp)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CRIAR FUNÇÃO SECURITY DEFINER PARA CHECAGEM DE PAPEL
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- 5. CRIAR POLÍTICAS RLS
-- =====================================================

-- Políticas para PROFILES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para USER_ROLES (apenas admins podem gerenciar)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para SERVICE_REQUESTS
CREATE POLICY "Users can view their own requests"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.service_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.service_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all requests"
  ON public.service_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete requests"
  ON public.service_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para REQUEST_ATTACHMENTS
CREATE POLICY "Users can view attachments of their requests"
  ON public.request_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments"
  ON public.request_attachments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert attachments to their requests"
  ON public.request_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert attachments"
  ON public.request_attachments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete attachments"
  ON public.request_attachments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para CONTRACTORS (apenas admins)
CREATE POLICY "Admins can view contractors"
  ON public.contractors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert contractors"
  ON public.contractors FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contractors"
  ON public.contractors FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contractors"
  ON public.contractors FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para CONTRACTOR_TASKS (apenas admins)
CREATE POLICY "Admins can view tasks"
  ON public.contractor_tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tasks"
  ON public.contractor_tasks FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks"
  ON public.contractor_tasks FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tasks"
  ON public.contractor_tasks FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para CONTRACTOR_TRANSACTIONS (apenas admins)
CREATE POLICY "Admins can view transactions"
  ON public.contractor_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions"
  ON public.contractor_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Políticas para MESSAGES
CREATE POLICY "Users can view messages of their requests"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert messages to their requests"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Políticas para NOTIFICATIONS
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 6. CRIAR TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para criar perfil automaticamente ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil ao signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para calcular preço do serviço automaticamente
CREATE OR REPLACE FUNCTION public.calculate_service_price()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
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
$$;

-- Trigger para calcular preço ao inserir solicitação
CREATE TRIGGER set_service_price
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.calculate_service_price();

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar saldo do contratado ao completar tarefa
CREATE OR REPLACE FUNCTION public.update_contractor_balance_on_task_complete()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas quando o status muda para 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Atualizar saldo do contratado
    UPDATE public.contractors
    SET balance = balance + NEW.payment
    WHERE id = NEW.contractor_id;
    
    -- Criar registro de transação
    INSERT INTO public.contractor_transactions (
      contractor_id,
      type,
      amount,
      description,
      task_id
    ) VALUES (
      NEW.contractor_id,
      'task_payment',
      NEW.payment,
      'Pagamento pela conclusão da tarefa: ' || NEW.title,
      NEW.id
    );
    
    -- Definir data de conclusão
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para atualizar saldo ao completar tarefa
CREATE TRIGGER on_task_completed
  BEFORE UPDATE ON public.contractor_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_contractor_balance_on_task_complete();

-- =====================================================
-- 7. CRIAR STORAGE BUCKETS E POLÍTICAS
-- =====================================================

-- Bucket para anexos de solicitações
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-attachments', 'service-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos de contratados
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-documents', 'contractor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para service-attachments

-- Usuários podem ver anexos de suas próprias solicitações
CREATE POLICY "Users can view their own request attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'service-attachments' AND
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE user_id = auth.uid()
        AND id::text = (storage.foldername(name))[1]
    )
  );

-- Admins podem ver todos os anexos
CREATE POLICY "Admins can view all request attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'service-attachments' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Usuários podem fazer upload em suas próprias solicitações
CREATE POLICY "Users can upload to their own requests"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-attachments' AND
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE user_id = auth.uid()
        AND id::text = (storage.foldername(name))[1]
    )
  );

-- Admins podem fazer upload
CREATE POLICY "Admins can upload request attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'service-attachments' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Admins podem deletar anexos
CREATE POLICY "Admins can delete request attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'service-attachments' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Políticas de Storage para contractor-documents (apenas admins)

CREATE POLICY "Admins can view contractor documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contractor-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can upload contractor documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contractor-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update contractor documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'contractor-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete contractor documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contractor-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- 8. HABILITAR REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contractor_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;