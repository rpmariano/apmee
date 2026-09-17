# Configuração do Google Drive para Anexos da APMEE

Este documento descreve os passos necessários para configurar o upload automático de documentos (atas de reuniões, convocatórias, orçamentos, apresentações) diretamente para o **Google Drive** da APMEE EB Cobre, utilizando uma **Supabase Edge Function** (`upload-to-drive`).

---

## 🎯 Porquê uma Edge Function?

O APMEE é uma aplicação SPA (Single Page Application) alojada no GitHub Pages. Armazenar credenciais de serviço ou chaves privadas da Google diretamente no código do frontend exporia essas chaves a qualquer utilizador com acesso ao browser.

A Edge Function do Supabase atua como uma ponte segura:
1. Recebe o ficheiro enviado por um utilizador autenticado da APMEE.
2. Assina internamente um token OAuth2 RS256 com a chave da Conta de Serviço Google.
3. Carrega o ficheiro diretamente para a pasta do Google Drive designada via Google Drive REST API v3.
4. Define as permissões do documento para que qualquer pessoa com o link de visualização possa aceder.
5. Devolve o link e identificador para serem guardados nos metadados do evento.

---

## 📋 Passo a Passo de Configuração

### 1. Criar Projeto e Ativar a Google Drive API no Google Cloud Console

1. Aceda à [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto (ex: `APMEE-EB-Cobre`) ou selecione um existente.
3. No menu lateral, vá a **APIs e Serviços** > **Biblioteca**.
4. Pesquise por **Google Drive API** e clique em **Ativar** (Enable).

---

### 2. Criar uma Conta de Serviço (Service Account)

1. Vá a **APIs e Serviços** > **Credenciais**.
2. Clique em **+ Criar Credenciais** > **Conta de Serviço**.
3. Preencha os detalhes:
   - **Nome da Conta de Serviço**: `apmee-drive-uploader`
   - **ID da Conta de Serviço**: `apmee-drive-uploader@...`
4. Clique em **Criar e Continuar**. Pode saltar a atribuição de papéis do projeto (a partilha é feita diretamente na pasta do Drive).
5. Conclua clicando em **Concluído**.
6. Copie o **endereço de email** da conta de serviço recém-criada (ex: `apmee-drive-uploader@apmee-cobre.iam.gserviceaccount.com`).

---

### 3. Gerar e Descarregar a Chave Privada JSON

1. Na lista de Contas de Serviço, clique sobre a conta que acabou de criar.
2. Aceda ao separador **Chaves** (Keys).
3. Clique em **Adicionar Chave** > **Criar Nova Chave**.
4. Selecione o tipo de chave **JSON** e clique em **Criar**.
5. O ficheiro `.json` será descarregado para o seu computador. Guarde-o em segurança (não o adicione ao Git!).

---

### 4. Criar e Partilhar a Pasta no Google Drive

1. Abra o [Google Drive](https://drive.google.com/) da Associação de Pais (ou conta institucional).
2. Crie uma nova pasta (ex: `APMEE - Documentos Reuniões`).
3. Clique com o botão direito na pasta > **Partilhar** > **Partilhar**.
4. No campo de partilha, cole o email da Conta de Serviço (ex: `apmee-drive-uploader@apmee-cobre.iam.gserviceaccount.com`).
5. Atribua-lhe a permissão de **Editor** (ou Organizador se for um Drive Partilhado) e desmarque a notificação por email.
6. Guarde a partilha.
7. Abra a pasta no navegador e copie o ID da pasta a partir do URL:
   `https://drive.google.com/drive/folders/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz12345`**
   *(Neste exemplo, o ID é `1AbCdEfGhIjKlMnOpQrStUvWxYz12345`)*.

---

### 5. Configurar os Segredos no Supabase

Tem duas formas de configurar os segredos no Supabase:

#### Opção A: Pelo Dashboard do Supabase (Mais fácil)
1. Aceda ao [Supabase Dashboard](https://supabase.com/dashboard).
2. Abra o projeto da APMEE.
3. No menu lateral, aceda a **Project Settings** > **Edge Functions**.
4. Em **Secrets**, adicione dois segredos:
   - **`GOOGLE_SERVICE_ACCOUNT_KEY`**: Abra o ficheiro JSON da chave que descarregou no Passo 3, copie todo o seu conteúdo `{ ... }` e cole neste campo.
   - **`GOOGLE_DRIVE_FOLDER_ID`**: Cole o ID da pasta do Google Drive copiado no Passo 4.

#### Opção B: Pela CLI do Supabase
Na linha de comandos, execute:
```bash
# Definir a chave da conta de serviço (conteúdo do ficheiro json em string)
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Definir o ID da pasta
npx supabase secrets set GOOGLE_DRIVE_FOLDER_ID='seu_folder_id_aqui'
```

---

### 6. Fazer Deploy da Edge Function

No terminal, na raiz do projeto `APMEE`, execute o deploy da Edge Function:

```bash
npx supabase functions deploy upload-to-drive
```

---

## 🛡️ Modo de Contingência / Fallback

Se a Edge Function ainda não estiver publicada ou configurada:
1. O utilizador recebe um aviso claro e amigável ao tentar fazer upload direto.
2. A aplicação permite a qualquer momento clicar em **"+ Adicionar Link"** e colar diretamente o link de partilha de qualquer documento do Google Drive, Google Docs, OneDrive ou outro serviço na nuvem.
3. Todos os documentos com links do Google Drive recebem automaticamente o distintivo visual azul **"Google Drive"** na lista de anexos da reunião.

---

## 🔍 Teste e Validação

1. Inicie a aplicação: `npm run dev`.
2. Aceda à **Agenda** e abra uma reunião (ou crie uma nova com tipo Reunião).
3. Na secção de **Documentos e Atas**, clique em **"Anexar para o Google Drive"** e selecione um documento PDF ou imagem.
4. O documento será carregado para a pasta do Drive configurada e surgirá na lista com a etiqueta **Google Drive** e botão direto para abrir/visualizar.
