# PlanoERP - Planejamento e Controle da Produção (PCP) para Pequena Empresa

Sistema de gestão empresarial simplificado com foco no fluxo produtivo (PCP), controle de estoque de matéria-prima, fichas técnicas (BOM), dimensionamento de capacidade fabril e ordens de produção.

## 🛠 Escolha da Stack e Justificativa

- **Backend:** **Node.js com Express e TypeScript**, utilizando persistência em arquivo JSON atômico (`/data/database.json`).
  - *Justificativa:* Leve, sem dependência de instalação ou configuração de SGBDs pesados como PostgreSQL ou MySQL para pequenas empresas. O formato JSON local garante persistência real entre reinicializações, fácil backup e inspeção transparente.
- **Frontend:** **React 19, TypeScript, Vite e Tailwind CSS** com ícones Lucide.
  - *Justificativa:* Interface moderna, responsiva, reativa e de rápida resposta para o operador no chão de fábrica ou no escritório.
- **Arquitetura Full-Stack Integrada:** O servidor Express serve os endpoints da API REST em `/api/*` e orquestra o frontend via middlewares do Vite em desenvolvimento ou build estático em produção.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- Gerenciador de pacotes **npm**

### Passo a Passo

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O servidor Express com o frontend integrado estará disponível em:
   `http://localhost:3000`

3. **Compilar e executar em produção:**
   ```bash
   npm run build
   npm run start
   ```

4. **Persistência dos dados:**
   - O banco de dados é salvo automaticamente no arquivo `data/database.json`.
   - Se o arquivo for excluído ou resetado pelo botão da interface, ele se reinicializa com dados de demonstração de uma pequena fábrica de móveis e marcenaria industrial.

---

## 📋 Módulos e Requisitos Implementados

1. **Ficha Técnica do Produto (BOM - Bill of Materials):**
   - Cadastro de produtos com lista de matérias-primas e quantidades necessárias por unidade.
   - Cálculo automático do custo teórico da peça a partir do custo unitário dos insumos.
   - Tempo padrão de processo por unidade cadastrado e formatado (minutos e horas).
   - Associação com máquina/posto principal de fabricação.

2. **Cadastro de Matéria-Prima & Estoque:**
   - Itens com código/SKU, nome, unidade de medida (`m²`, `kg`, `m`, `un`, `L`, etc.), quantidade em estoque, estoque mínimo de segurança e custo unitário (R$).
   - Alerta visual instantâneo para itens com estoque abaixo do mínimo.
   - Cálculo do valor total imobilizado em estoque.
   - Prevenção de exclusão caso a matéria-prima esteja em uso em uma ficha técnica ativa.

3. **Capacidade Produtiva (Postos de Trabalho & Máquinas):**
   - Cadastro de processos (ex: Corte, Solda, Pintura, Montagem), capacidade nominal por dia (`horas/dia` ou `unidades/dia`), número de operadores e status operacional (operacional, em manutenção, ocioso).
   - Cálculo da carga acumulada de trabalho (horas alocadas pelas OPs ativas vs capacidade disponível).

4. **Tempo de Processo:**
   - Vinculado a cada produto e multiplicado pelo tamanho do lote na emissão da Ordem de Produção para calcular a demanda total de horas fabris e prazos.

5. **Cadastro de Pedidos de Clientes:**
   - Registro de pedidos com cliente associado, produtos, quantidades, data do pedido, prazo de entrega e status (Pendente, Em Produção, Concluído, Cancelado).
   - Botão **"Gerar OP"** (1-Clique): converte itens do pedido em ordens de produção com prazos sincronizados.

6. **Ordens de Produção (PCP) & Explosão da BOM:**
   - Emissão de OPs manuais ou derivadas de pedidos.
   - **Verificação em Tempo Real da Matéria-Prima:** calcula o consumo previsto de cada insumo, compara com o estoque atual e sinaliza itens disponíveis (verde) ou faltantes (vermelho/amarelo) com o saldo previsto.
   - Conforme solicitado: a falta de matéria-prima sinaliza o alerta sem bloquear a emissão da OP, permitindo providenciar compras em paralelo.
   - **Análise de Viabilidade de Capacidade:** compara o tempo total de produção com a capacidade diária do posto no intervalo de datas, avisando sobre sobrecarga ou viabilidade.

7. **Acompanhamento da Produção:**
   - Gestão visual em **Quadro Kanban** (Aguardando Início, Em Produção, Concluída) e visualização alternativa em Tabela com filtros.
   - Transição de status com 1 clique.
   - Opção de dar baixa automática nos insumos consumidos e entrada no estoque de produtos acabados ao concluir a ordem.

8. **Cadastro de Clientes e Fornecedores:**
   - Registro unificado com filtro por tipo (`cliente`, `fornecedor`, `ambos`), dados de contato, documento fiscal (CNPJ/CPF), telefone, e-mail e endereço.
