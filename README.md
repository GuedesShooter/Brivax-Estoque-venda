# Brivax Inventory

Aplicativo web PWA para controle de estoque, cadastro de clientes e gestão de usuários com visual personalizado Brivax.

## Como executar localmente

1. Instale as dependências do navegador (nenhuma dependência de build é necessária).
2. Inicie um servidor estático apontando para a raiz do projeto:
   ```bash
   python -m http.server 8000
   ```
3. Acesse [http://localhost:8000](http://localhost:8000) no navegador do computador ou dispositivo móvel conectado à mesma rede.
4. Opcionalmente instale como aplicativo (PWA) usando o botão **Instalar app** suportado pelo navegador.

## Como instalar o aplicativo (PWA)

Após abrir o endereço no navegador, siga as instruções de acordo com o dispositivo:

### Desktop (Chrome, Edge ou Brave)
1. Clique no ícone de instalação que aparece na barra de endereços (símbolo de monitor com seta).
2. Confirme em **Instalar** para criar o atalho na área de trabalho ou menu iniciar.
3. Abra o atalho criado para utilizar o app em janela dedicada.

### Android (Chrome ou navegadores compatíveis)
1. Abra o menu do navegador (ícone ⋮) na página do aplicativo.
2. Toque em **Adicionar à tela inicial** ou **Instalar app**.
3. Confirme o nome sugerido e conclua para que o ícone apareça entre os aplicativos instalados.

### iOS/iPadOS (Safari)
1. Toque no botão **Compartilhar** (ícone de quadrado com seta para cima).
2. Selecione **Adicionar à Tela de Início**.
3. Revise o nome exibido e toque em **Adicionar** para instalar o atalho.

Após a instalação, o aplicativo passa a abrir em modo standalone, com suporte offline fornecido pelo service worker incluído no projeto.

## Credenciais padrão

| Perfil | Usuário         | Senha       |
| ------ | --------------- | ----------- |
| Admin  | GuedezShooter   | Guedes/007  |

O primeiro acesso cria esse administrador automaticamente. Após o login como admin é possível cadastrar novos usuários, peças, vendas e clientes.

## Fluxos principais testados

- Cadastro de usuário com opção **Lembrar de mim**, entrada automática no sistema e logout.
- Login utilizando o administrador padrão e acesso às seções exclusivas (vendas, usuários e clientes).
- Registro de peças e atualização automática do estoque após vincular uma venda.
- Cadastro, edição e remoção de produtos no catálogo administrativo com controle de estoque independente.

Esses fluxos foram verificados manualmente executando o servidor local indicado acima.
