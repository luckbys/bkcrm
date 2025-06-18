# 🔐 **CONFIGURAÇÃO AUTENTICAÇÃO SUPABASE - BKCRM**

## 🎯 **FUNCIONALIDADES IMPLEMENTADAS:**

### ✅ **1. Sistema de Login**
- **Arquivo:** `src/pages/auth/login.tsx`
- **Funcionalidades:**
  - Login com email e senha
  - Validação de credenciais
  - Tratamento de erros (credenciais inválidas, email não confirmado, muitas tentativas)
  - Redirecionamento automático após login
  - Link para recuperação de senha
  - Link para registro de nova conta

### ✅ **2. Sistema de Registro**
- **Arquivo:** `src/pages/auth/register.tsx`
- **Funcionalidades:**
  - Formulário completo de registro (nome, email, senha, confirmação)
  - Validação robusta de senha com requisitos:
    - Mínimo 8 caracteres
    - Letra maiúscula
    - Letra minúscula
    - Número
    - Caractere especial
  - Indicador visual de força da senha
  - Verificação de coincidência de senhas
  - Criação automática de perfil no banco
  - Confirmação por email

### ✅ **3. Recuperação de Senha**
- **Arquivo:** `src/pages/auth/forgot-password.tsx`
- **Funcionalidades:**
  - Envio de email de recuperação
  - Validação de email
  - Tratamento de rate limiting
  - Instruções claras para o usuário

### ✅ **4. Hook de Autenticação**
- **Arquivo:** `src/hooks/useAuth.tsx`
- **Funcionalidades:**
  - Gerenciamento global de estado de autenticação
  - Funções: `signIn`, `signUp`, `signOut`
  - Criação automática de perfil no registro
  - Persistência de sessão
  - Escuta de mudanças de estado

---

## 🛠️ **CONFIGURAÇÃO DO SUPABASE:**

### **1. Habilitar Autenticação**

No painel do Supabase → **Authentication** → **Settings**:

```bash
# Email confirmação (recomendado para produção)
Email confirmation: Enabled

# Redirect URLs permitidas
Site URL: http://localhost:3000, https://seu-dominio.com

# Email templates customizados (opcional)
Confirm signup: Personalizar template
Reset password: Personalizar template
```

### **2. Configurar Políticas RLS (Row Level Security)**

Execute no **SQL Editor** do Supabase:

```sql
-- Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem/editarem seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para inserção automática de perfil no registro
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### **3. Trigger para Criação Automática de Perfil**

```sql
-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'agent',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após criação de usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 🌐 **CONFIGURAÇÃO DE EMAILS:**

### **1. SMTP Personalizado (Produção)**

No Supabase → **Authentication** → **Settings** → **SMTP Settings**:

```bash
# Exemplo com Gmail
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: seu-email@gmail.com
SMTP Pass: sua-app-password
SMTP From: BKCRM <noreply@seudominio.com>
```

### **2. Templates de Email Personalizados**

```html
<!-- Template de Confirmação -->
<h2>Bem-vindo ao BKCRM!</h2>
<p>Olá {{ .Email }},</p>
<p>Obrigado por se registrar no BKCRM. Clique no link abaixo para confirmar sua conta:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>

<!-- Template de Recuperação -->
<h2>Recuperação de Senha - BKCRM</h2>
<p>Olá,</p>
<p>Você solicitou a recuperação de senha. Clique no link abaixo para redefinir:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Se você não solicitou isso, ignore este email.</p>
```

---

## 📱 **ROTAS IMPLEMENTADAS:**

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/auth/login` | `LoginPage` | Tela de login |
| `/auth/register` | `RegisterPage` | Tela de registro |
| `/auth/forgot-password` | `ForgotPasswordPage` | Recuperação de senha |

---

## 🔧 **VARIÁVEIS DE AMBIENTE:**

Certifique-se de ter no seu `.env`:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui

# Para URLs de redirecionamento
VITE_APP_URL=http://localhost:3000
```

---

## 🧪 **TESTES FUNCIONAIS:**

### **Testar Registro:**
1. Acesse `/auth/register`
2. Preencha: Nome, Email, Senha (com requisitos), Confirmação
3. Clique "Criar conta"
4. Verifique email de confirmação
5. Confirme conta pelo link

### **Testar Login:**
1. Acesse `/auth/login`
2. Digite credenciais
3. Verifique redirecionamento para dashboard

### **Testar Recuperação:**
1. Acesse `/auth/forgot-password`
2. Digite email cadastrado
3. Verifique recebimento do email
4. Clique no link de recuperação

---

## 🛡️ **SEGURANÇA IMPLEMENTADA:**

- ✅ Validação de email no frontend e backend
- ✅ Requisitos robustos de senha
- ✅ Rate limiting em recuperação de senha
- ✅ Sanitização de inputs
- ✅ HTTPS recomendado para produção
- ✅ RLS (Row Level Security) configurado
- ✅ Confirmação de email obrigatória
- ✅ Tokens JWT seguros
- ✅ Proteção contra CSRF

---

## 🚀 **PRÓXIMOS PASSOS:**

### **Para Produção:**
1. ✅ Configurar domínio personalizado
2. ✅ Configurar SMTP personalizado
3. ✅ Personalizar templates de email
4. ✅ Configurar SSL/TLS
5. ✅ Testar recuperação de senha em produção
6. ✅ Configurar políticas de segurança adicionais

### **Funcionalidades Futuras:**
- [ ] Login social (Google, GitHub)
- [ ] Autenticação de dois fatores (2FA)
- [ ] Sessões múltiplas
- [ ] Logs de autenticação
- [ ] Políticas de expiração de senha

---

## 📞 **SUPORTE:**

Se encontrar problemas:

1. **Erro de Email não confirmado:**
   - Verifique pasta de spam
   - Reenvie email de confirmação
   - Verifique configurações SMTP

2. **Erro de Registro:**
   - Verifique se tabela `profiles` existe
   - Verifique RLS policies
   - Verifique trigger de criação de perfil

3. **Erro de Login:**
   - Verifique credenciais
   - Confirme email primeiro
   - Verifique rate limiting

**Log Debug:** Sempre verifique o console do navegador e logs do Supabase para detalhes específicos.

---

✅ **Sistema de autenticação completo e funcional implementado!** 