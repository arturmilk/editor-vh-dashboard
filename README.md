# Editor VH · Alinhamento

Dashboard do Arthur e do Victor Hugo para registrar cada alteração no agente de edição, testar e aprovar.
Site estático (HTML + CSS + JS, sem build) publicado no GitHub Pages.

## Como usar
- Entre com seu primeiro nome como usuário e senha (`arthur`/`arthur`, `victor`/`victor`, sem diferença de maiúsculas).
- **Nova anotação**: botão azul, tecla `N` ou clique num horário vazio da agenda.
- Abra uma anotação e use o **interruptor** para marcar *Aprovado* / *Não aprovado*. Cada mudança fica no histórico da anotação.
- **Para você revisar** (barra lateral) lista o que o outro registrou e ainda não foi aprovado.
- Atalhos: `N` nova · `T` hoje · `←`/`→` navegar · `D`/`S`/`L` dia, semana, lista · `Esc` fechar.

## Onde ficam os dados
As anotações ficam em `data/notes.json` neste repositório. O site lê e grava esse arquivo pela API do GitHub,
então cada alteração vira um commit (`[arthur] Aprova: …`) e o histórico completo fica no Git.

Para **gravar**, cada pessoa cola um token do GitHub uma vez por navegador (o site pede depois do login):
1. github.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate new token.
2. Marque só `public_repo` e gere.
3. Cole no site. O token fica salvo apenas no navegador daquela pessoa.

O Victor precisa ser **colaborador** do repositório (Settings → Collaborators) para o token dele poder gravar.
Sem token o site abre em modo leitura.

## Limites (leia)
- O login é **simbólico**: num site estático qualquer pessoa que ler o código vê como entrar.
- O repositório é público (exigência do GitHub Pages grátis), então `data/notes.json` também é. Não anote nada sensível.
- A proteção de verdade é o token: só quem tem permissão de escrita no repositório consegue alterar as anotações.

## Publicar
Settings → Pages → Source: *Deploy from a branch* → Branch `main` / pasta `/ (root)`.
O endereço fica `https://<usuario>.github.io/editor-vh-dashboard/`.

Para testar localmente: `python -m http.server` na pasta e abra `http://localhost:8000` (modo demonstração, dados só no navegador).
