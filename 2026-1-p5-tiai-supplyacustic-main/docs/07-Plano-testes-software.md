# Plano de testes de software

Este plano descreve os cenários de teste construídos a partir dos Requisitos Funcionais (RF01–RF16) da especificação do SupplyAcustic. Os casos abrangem o fluxo de autenticação, gestão de projetos acústicos, cálculo determinístico do RT60 pela Fórmula de Sabine, geração de relatórios e sugestões via IA, upload/visualização 3D, chat contextual, controle de créditos diários e exportação de relatórios.

## Funcionalidades avaliadas

- Cadastro / login (e-mail+senha e Google OAuth) - RF01, RF02
- CRUD de projetos acústicos e parametrização do ambiente - RF03, RF04, RF05
- Cálculo de RT60 (médio e por banda 125Hz–4kHz) - RF06
- Geração de relatório acústico com IA - RF07
- Listagem de problemas e sugestões de tratamento - RF08, RF09
- Upload e visualização 3D - RF10, RF11
- Chat contextual com IA - RF12
- Limite e renovação de créditos diários - RF13
- Exportação de relatório em PDF - RF14
- Histórico de análises por projeto - RF16

## Ferramentas

- **Vitest 3** + **@testing-library/react** + **jsdom** - testes automatizados unitários e de componentes (`vitest.config.ts`).
- **Chrome** - testes manuais.
- **Supabase Studio** - inspeção do estado do banco (`profiles`, `projects`, `analyses`, `chat_messages`).

## Rastreabilidade RF → CT

| RF | Caso(s) de teste | Tipo |
|----|------------------|------|
| RF01 | CT-001, CT-002 | Manual + Automatizado |
| RF02 | CT-003 | Manual + Automatizado |
| RF03 | CT-004 | Manual |
| RF04 | CT-005 | Manual |
| RF05 | CT-006 | Manual |
| RF06 | CT-007 | Manual + Automatizado |
| RF07 | CT-008 | Manual |
| RF08 | CT-009 | Manual |
| RF09 | CT-010 | Manual |
| RF10 | CT-011 | Manual |
| RF11 | CT-012 | Manual |
| RF12 | CT-013 | Manual |
| RF13 | CT-014 | Manual + Automatizado |
| RF14 | CT-015 | Manual |
| RF16 | CT-016 | Manual |

---

## Casos de teste

| **Caso de teste** | **CT-001 – Cadastrar usuário com e-mail e senha** |
|:---:|:---:|
| Requisito associado | RF01 – O sistema deve permitir cadastro e autenticação de usuários via e-mail e senha. |
| Objetivo do teste | Verificar se um novo usuário consegue criar conta com nome, e-mail e senha. |
| Passos | - Acessar a URL da aplicação <br> - Clicar em "Começar grátis" <br> - Selecionar a aba "Criar conta" <br> - Preencher Nome, Email e Senha (mínimo 6 caracteres) <br> - Clicar em "Criar conta grátis" |
| Critério de êxito | - Toast de sucesso é exibido. <br> - Um registro é criado em `auth.users` e o trigger `handle_new_user` cria a linha correspondente em `public.profiles` com `daily_credits = 5`. |
| Teste automatizado | `src/pages/__tests__/AuthPage.test.tsx` (renderização das abas) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-002 – Efetuar login com e-mail e senha** |
|:---:|:---:|
| Requisito associado | RF01 – O sistema deve permitir cadastro e autenticação de usuários via e-mail e senha. |
| Objetivo do teste | Verificar se um usuário existente consegue autenticar-se com credenciais válidas. |
| Passos | - Acessar a aplicação <br> - Clicar em "Entrar" <br> - Na aba "Entrar", preencher e-mail e senha <br> - Clicar em "Entrar" |
| Critério de êxito | - `supabase.auth.signInWithPassword` é chamado com os dados informados. <br> - Sessão é criada e o usuário é redirecionado para a `HomePage`. |
| Teste automatizado | `src/pages/__tests__/AuthPage.test.tsx` → "submete login com e-mail e senha" |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-003 – Login com Google (OAuth)** |
|:---:|:---:|
| Requisito associado | RF02 – O sistema deve permitir autenticação via Google (OAuth). |
| Objetivo do teste | Verificar se o fluxo Lovable Cloud Managed Google OAuth inicia o redirecionamento. |
| Passos | - Acessar a tela de autenticação <br> - Clicar em "Entrar com Google" <br> - Selecionar conta Google e autorizar |
| Critério de êxito | - `auth.signInWithOAuth("google", ...)` é invocado. <br> - Após o callback, sessão Supabase é definida e a `HomePage` é exibida. |
| Teste automatizado | `src/pages/__tests__/AuthPage.test.tsx` → "chama auth.signInWithOAuth('google')" |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-004 – Criar, editar e excluir projeto acústico** |
|:---:|:---:|
| Requisito associado | RF03 – O usuário deve poder criar, editar e excluir projetos acústicos. |
| Objetivo do teste | Validar o CRUD completo de projetos. |
| Passos | - Estar autenticado <br> - Clicar em "Novo projeto" na HomePage <br> - Informar nome, descrição e tipo de ambiente; salvar <br> - Abrir o projeto criado e editar uma dimensão; salvar <br> - Voltar à HomePage e excluir o projeto pelo botão de lixeira |
| Critério de êxito | - Linha aparece, é atualizada e removida em `public.projects` respeitando RLS (`auth.uid() = user_id`). |
| Teste automatizado | — (manual) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-005 – Informar dimensões do ambiente** |
|:---:|:---:|
| Requisito associado | RF04 – O sistema deve aceitar as dimensões do ambiente (comprimento, largura, altura). |
| Objetivo do teste | Validar que o sistema persiste corretamente comprimento, largura e altura e calcula volume. |
| Passos | - Abrir um projeto <br> - Acessar a aba "Ambiente" <br> - Preencher comprimento=5, largura=4, altura=3 <br> - Salvar |
| Critério de êxito | - Campos `length_m`, `width_m`, `height_m` em `projects` recebem os valores. <br> - O volume calculado (60 m³) é exibido na interface. |
| Teste automatizado | `src/lib/__tests__/acoustics.test.ts` → `calculateVolume` |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-006 – Selecionar materiais para parede, piso e teto** |
|:---:|:---:|
| Requisito associado | RF05 – O usuário deve poder selecionar materiais para parede, piso e teto a partir de uma biblioteca. |
| Objetivo do teste | Verificar a seleção de materiais a partir da biblioteca `public.materials`. |
| Passos | - Na aba "Ambiente", abrir os seletores de "Material da parede", "Material do piso" e "Material do teto" <br> - Selecionar opções distintas (ex.: gesso, carpete, forro acústico) <br> - Salvar |
| Critério de êxito | - Os campos `wall_material_id`, `floor_material_id` e `ceiling_material_id` são gravados corretamente em `projects`. |
| Teste automatizado | — (manual) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-007 – Calcular RT60 médio e por banda** |
|:---:|:---:|
| Requisito associado | RF06 – O sistema deve calcular o RT60 médio e por faixa de frequência (125Hz a 4kHz). |
| Objetivo do teste | Garantir que o cálculo segue a Fórmula de Sabine (`RT60 = 0.161 · V / A`) por banda e gera a média. |
| Passos | - Em um projeto com dimensões e materiais preenchidos, clicar em "Calcular análise" <br> - Aguardar conclusão <br> - Conferir os valores exibidos na aba "Análise" |
| Critério de êxito | - Os campos `rt60_125hz`...`rt60_4000hz` e `rt60_average` em `public.analyses` são preenchidos com valores positivos finitos. <br> - O RT60 em 4kHz é menor ou igual ao de 125Hz (maior absorção em altas frequências). |
| Teste automatizado | `src/lib/__tests__/acoustics.test.ts` (todos os casos de Sabine) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-008 – Gerar relatório acústico automático com IA** |
|:---:|:---:|
| Requisito associado | RF07 – O sistema deve gerar um relatório acústico automático utilizando IA. |
| Objetivo do teste | Validar que a edge function `analyze-acoustics` retorna um relatório textual interpretando o RT60. |
| Passos | - Realizar uma análise completa (CT-007) <br> - Abrir a aba "Análise" e ler o relatório gerado |
| Critério de êxito | - Campo `ai_report` da última linha em `analyses` contém texto não vazio. <br> - 1 crédito é debitado do `profiles.daily_credits`. |
| Teste automatizado | — (manual, depende do Lovable AI Gateway) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-009 – Listar problemas acústicos com severidade** |
|:---:|:---:|
| Requisito associado | RF08 – O sistema deve listar os problemas acústicos identificados com severidade e localização. |
| Objetivo do teste | Confirmar que a aba "Problemas" exibe a lista de problemas com badge de severidade. |
| Passos | - Após gerar a análise (CT-008), abrir a aba "Problemas" |
| Critério de êxito | - Cada item de `analyses.problems_identified` é renderizado com título, descrição, severidade (baixa/média/alta) e localização. |
| Teste automatizado | — (manual) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-010 – Sugestões de tratamento com prioridade e custo** |
|:---:|:---:|
| Requisito associado | RF09 – O sistema deve apresentar sugestões de tratamento com prioridade e estimativa de custo. |
| Objetivo do teste | Verificar a listagem de sugestões com material, prioridade e custo estimado. |
| Passos | - Após CT-008, abrir a aba "Sugestões" |
| Critério de êxito | - Cada item de `analyses.suggestions` exibe material recomendado, prioridade e custo estimado. |
| Teste automatizado | — (manual) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-011 – Upload de modelo 3D** |
|:---:|:---:|
| Requisito associado | RF10 – O usuário deve poder fazer upload de modelos 3D (.glb, .gltf, .obj, .fbx, .skp, .rvt). |
| Objetivo do teste | Validar o upload de um arquivo .glb até 200 MB no bucket `models3d`. |
| Passos | - Abrir um projeto <br> - Na aba "Modelo 3D", arrastar um arquivo .glb <br> - Aguardar conclusão do upload |
| Critério de êxito | - `projects.model_file_path` e `model_file_name` são atualizados. <br> - O arquivo aparece em Supabase Storage > `models3d`. |
| Teste automatizado | — (manual) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-012 – Visualizar modelo 3D no navegador** |
|:---:|:---:|
| Requisito associado | RF11 – O sistema deve exibir o modelo 3D carregado em um visualizador interativo no navegador. |
| Objetivo do teste | Garantir a renderização via `@react-three/fiber` com `OrbitControls`. |
| Passos | - Após CT-011, visualizar o modelo no canvas <br> - Rotacionar, dar zoom e mover a câmera |
| Critério de êxito | - O modelo é renderizado sem travar. <br> - Interações orbit/zoom funcionam. |
| Teste automatizado | — (manual; WebGL não é suportado em jsdom) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-013 – Chat contextual com IA** |
|:---:|:---:|
| Requisito associado | RF12 – O usuário deve poder conversar com uma IA sobre o projeto via chat contextual. |
| Objetivo do teste | Validar o envio de pergunta e o streaming de resposta da edge function `acoustic-chat`. |
| Passos | - Abrir a aba "Chat" em um projeto com análise concluída <br> - Clicar em uma pergunta sugerida ou digitar pergunta e pressionar Enter |
| Critério de êxito | - Mensagem do usuário e resposta da IA aparecem na conversa. <br> - Ambas são persistidas em `public.chat_messages`. <br> - 1 crédito é debitado. |
| Teste automatizado | — (manual; depende de SSE/IA externa) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-014 – Limite de créditos diários** |
|:---:|:---:|
| Requisito associado | RF13 – O sistema deve implementar um limite de créditos diários por usuário. |
| Objetivo do teste | Garantir que cada ação consome 1 crédito, o limite diário é 5 e a renovação ocorre na virada do dia. |
| Passos | - Realizar 5 análises seguidas com um usuário recém-criado <br> - Tentar realizar a 6ª <br> - Avançar a data (manualmente) e tentar novamente |
| Critério de êxito | - Após a 5ª ação, `profiles.daily_credits = 0` e o modal `NoCreditsModal` é exibido. <br> - Após a virada, a função `refill_daily_credits` restaura o saldo para 5. |
| Teste automatizado | `src/lib/__tests__/credits.test.ts` + `src/components/__tests__/NoCreditsModal.test.tsx` |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-015 – Exportar relatório em PDF** |
|:---:|:---:|
| Requisito associado | RF14 – O sistema deve exportar o relatório acústico em formato PDF. |
| Objetivo do teste | Validar a geração de PDF via jsPDF. |
| Passos | - Em um projeto com análise concluída, abrir a aba "Análise" <br> - Clicar em "Exportar PDF" |
| Critério de êxito | - O navegador inicia o download de um arquivo `.pdf` contendo o RT60, gráfico de bandas, problemas e sugestões. |
| Teste automatizado | — (manual; jsPDF requer DOM real) |
| Responsável | Equipe SupplyAcustic |

<br>

| **Caso de teste** | **CT-016 – Histórico de análises por projeto** |
|:---:|:---:|
| Requisito associado | RF16 – O sistema deve exibir histórico de análises por projeto. |
| Objetivo do teste | Confirmar que múltiplas análises de um mesmo projeto ficam acessíveis. |
| Passos | - Em um projeto, gerar uma análise <br> - Alterar materiais e gerar nova análise <br> - Abrir a aba "Análise" e conferir a listagem do histórico |
| Critério de êxito | - As linhas em `public.analyses` para o `project_id` são listadas em ordem decrescente de `created_at`. |
| Teste automatizado | — (manual) |
| Responsável | Equipe SupplyAcustic |

## Ferramentas de testes

- **Vitest** (`bunx vitest run`) — executa todos os testes em `src/**/*.test.{ts,tsx}`.
- **@testing-library/react** + **jsdom** — renderização e interação acessível com componentes.
- **Mocks** com `vi.mock` para isolar `@/integrations/supabase/client`, `@/integrations/lovable/index` e `sonner` nos testes de componente.
- **Chrome DevTools** — inspeção manual da renderização 3D, do streaming SSE no chat.

> **Links úteis**: [Documentação Vitest](https://vitest.dev) · [@testing-library](https://testing-library.com) · [Especificação SupplyAcustic](02-Especificacao.md)
