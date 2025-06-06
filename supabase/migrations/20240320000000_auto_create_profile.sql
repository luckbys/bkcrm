-- Função para criar perfil automaticamente quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'admin'::user_role -- Default role, pode ser alterado depois
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, ignora o erro
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Política para permitir que o sistema crie perfis automaticamente
CREATE POLICY "Sistema pode criar perfis automaticamente"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política para permitir que usuários autenticados insiram seus próprios perfis
CREATE POLICY "Usuários podem criar seus próprios perfis"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id); 