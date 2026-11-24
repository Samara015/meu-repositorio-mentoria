# Samara Joias — Catálogo e API

Projeto de catálogo virtual da Samara Joias, desenvolvido com HTML, CSS, JavaScript e Node.js/Express. A API disponibiliza os produtos, controla o carrinho e registra a finalização de compras.

## Funcionalidades implementadas

- Listagem de produtos com preço e estoque.
- Pesquisa de produtos no catálogo.
- Adição e consulta de itens no carrinho.
- Validação da quantidade solicitada conforme o estoque disponível.
- Finalização da compra com PIX, cartão de crédito ou dinheiro.
- Desconto de 10% para pagamento em dinheiro.
- Redução do estoque após a finalização da compra.
- Acúmulo do valor das compras por usuário.
- Concessão do status VIP quando o total acumulado de compras atinge R$ 300,00.
- Frete grátis para clientes VIP. Para clientes que ainda não são VIP, o frete aplicado pela API é de R$ 20,00.
- Consulta dos pedidos de um usuário.

## Tecnologias

- Node.js
- Express
- HTML, CSS e JavaScript
- Jest e Supertest (dependências de desenvolvimento para os testes)
- Swagger / OpenAPI (arquivo `swagger.yaml`)

## Como executar o projeto

É necessário ter o Node.js instalado.

1. Abra a pasta do projeto no terminal.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie a API:

   ```bash
   node app.js
   ```

4. Acesse o catálogo no navegador:

   `http://localhost:3000`

A API utiliza a porta `3000`.

## Endpoints disponíveis no código da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/produtos` | Lista os produtos e seus estoques. |
| POST | `/carrinho` | Adiciona um produto ao carrinho. |
| GET | `/carrinho/:usuarioId` | Consulta o carrinho de um usuário. |
| POST | `/finalizar-compra` | Finaliza a compra e aplica as regras comerciais. |
| GET | `/pedidos/:usuarioId` | Consulta os pedidos de um usuário. |

### Exemplo de corpo para adicionar ao carrinho

```json
{
  "usuarioId": 1,
  "produtoId": 1,
  "quantidade": 1
}
```

### Exemplo de corpo para finalizar a compra

```json
{
  "usuarioId": 1,
  "pagamento": "PIX"
}
```

Formas de pagamento aceitas: `PIX`, `Cartão de crédito` e `Dinheiro`.

## Regras de negócio

1. Não é permitido adicionar quantidade maior que o estoque disponível.
2. O pagamento em dinheiro concede 10% de desconto sobre o subtotal dos produtos.
3. O cliente se torna VIP ao acumular R$ 300,00 ou mais em compras.
4. Clientes VIP não pagam frete nas compras seguintes. Clientes não VIP pagam R$ 20,00 de frete.
5. O estoque é atualizado quando a compra é finalizada com sucesso.

## Dados e armazenamento

Os produtos, carrinhos, clientes e pedidos são mantidos em memória no próprio processo da API. Portanto, os dados são reiniciados quando o servidor é encerrado ou reiniciado. O projeto não utiliza banco de dados persistente.

## Estrutura do projeto

```text
Samara-Joias-API/
├── app.js
├── package.json
├── package-lock.json
├── swagger.yaml
├── public/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── imagens/
└── tests/
    └── produtos.test.js
```

## Testes

A pasta `tests` está reservada para os testes automatizados. O arquivo `tests/produtos.test.js` está no projeto, mas ainda precisa receber os casos de teste e ser executado/validado.

Quando os testes forem implementados, execute:

```bash
npm test
```

## Observação sobre a documentação Swagger

O arquivo `swagger.yaml` acompanha o projeto. Antes da entrega final, confira se todas as rotas e operações descritas nele correspondem exatamente às rotas implementadas em `app.js`.

## Autoria

Projeto acadêmico desenvolvido para a Samara Joias.
