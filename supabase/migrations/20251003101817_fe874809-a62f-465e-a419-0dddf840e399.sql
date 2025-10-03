-- Criar usuário administrador principal
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Verificar se admin já existe
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'manuelbemvindom3@gmail.com';
  
  IF admin_user_id IS NULL THEN
    -- Criar usuário admin
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'manuelbemvindom3@gmail.com',
      crypt('mbM-0608', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Manuel Bemvindo Mendes","phone":"927800658"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
    
    -- Adicionar role de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin');
    
    -- Atualizar profile
    UPDATE public.profiles
    SET account_status = 'approved',
        balance = 0
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin criado com sucesso: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin já existe com ID: %', admin_user_id;
  END IF;
END $$;