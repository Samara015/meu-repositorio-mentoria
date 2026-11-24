const express = require("express");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const { conectarBanco, obterBanco } = require("./database");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================================
// DADOS INICIAIS
// =====================================

const produtosIniciais = [
    { id: 1, nome: "Relógio feminino", preco: 299.90, estoque: 5 },
    { id: 2, nome: "Relógio feminino 2", preco: 399.90, estoque: 5 },
    { id: 3, nome: "Relógio feminino 3", preco: 350.00, estoque: 5 },
    { id: 4, nome: "Relógio bicolor", preco: 395.00, estoque: 5 },
    { id: 5, nome: "Conjunto prata", preco: 150.00, estoque: 5 },
    { id: 6, nome: "Conjunto prata 2", preco: 180.00, estoque: 5 },
    { id: 7, nome: "Brinco ponto de luz", preco: 59.90, estoque: 5 },
    { id: 8, nome: "Conjunto ponto de luz", preco: 120.00, estoque: 5 },
    { id: 9, nome: "Kit relógio", preco: 299.00, estoque: 5 },
    { id: 10, nome: "Relógio vermelho", preco: 320.00, estoque: 5 }
];

const usuariosIniciais = [
    {
        id: 1,
        nome: "Cliente Teste",
        email: "cliente@teste.com",
        senha: "123456"
    },
    {
        id: 2,
        nome: "Maria Teste",
        email: "maria@teste.com",
        senha: "123456"
    },
    {
        id: 3,
        nome: "João Teste",
        email: "joao@teste.com",
        senha: "123456"
    }
];

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

function dadosPublicos(usuario) {
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
    };
}

async function buscarUsuario(id) {
    const db = obterBanco();

    return db.collection("usuarios").findOne({
        id: Number(id)
    });
}

async function prepararBanco() {
    const db = obterBanco();

    const produtosCollection = db.collection("produtos");
    const usuariosCollection = db.collection("usuarios");
    const clientesCollection = db.collection("clientes");

    // CADASTRAR PRODUTOS INICIAIS

    for (const produto of produtosIniciais) {
        await produtosCollection.updateOne(
            { id: produto.id },
            { $setOnInsert: produto },
            { upsert: true }
        );
    }

    // CADASTRAR USUÁRIOS INICIAIS

    for (const usuario of usuariosIniciais) {
        await usuariosCollection.updateOne(
            { id: usuario.id },
            { $setOnInsert: usuario },
            { upsert: true }
        );

        await clientesCollection.updateOne(
            { usuarioId: usuario.id },
            {
                $setOnInsert: {
                    usuarioId: usuario.id,
                    totalComprado: 0,
                    vip: false
                }
            },
            { upsert: true }
        );
    }

    console.log(
        "Produtos cadastrados no MongoDB:",
        await produtosCollection.countDocuments()
    );

    console.log(
        "Usuários cadastrados no MongoDB:",
        await usuariosCollection.countDocuments()
    );
}

// =====================================
// CADASTRO
// =====================================

app.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos."
            });
        }

        const db = obterBanco();
        const usuariosCollection = db.collection("usuarios");
        const clientesCollection = db.collection("clientes");

        const emailNormalizado = email.trim().toLowerCase();

        const emailExiste = await usuariosCollection.findOne({
            email: emailNormalizado
        });

        if (emailExiste) {
            return res.status(400).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        const ultimoUsuario = await usuariosCollection
            .find()
            .sort({ id: -1 })
            .limit(1)
            .toArray();

        const novoUsuario = {
            id: ultimoUsuario.length ? ultimoUsuario[0].id + 1 : 1,
            nome: nome.trim(),
            email: emailNormalizado,
            senha
        };

        await usuariosCollection.insertOne(novoUsuario);

        await clientesCollection.insertOne({
            usuarioId: novoUsuario.id,
            totalComprado: 0,
            vip: false
        });

        res.status(201).json({
            mensagem: "Cadastro realizado com sucesso!",
            usuario: dadosPublicos(novoUsuario)
        });

    } catch (erro) {
        console.error("Erro no cadastro:", erro);

        res.status(500).json({
            mensagem: "Erro ao realizar cadastro."
        });
    }
});

// =====================================
// LOGIN
// =====================================

app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "Informe e-mail e senha."
            });
        }

        const db = obterBanco();
        const usuariosCollection = db.collection("usuarios");

        const usuario = await usuariosCollection.findOne({
            email: email.trim().toLowerCase(),
            senha
        });

        if (!usuario) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }

        res.json({
            mensagem: "Login realizado com sucesso!",
            usuario: dadosPublicos(usuario)
        });

    } catch (erro) {
        console.error("Erro no login:", erro);

        res.status(500).json({
            mensagem: "Erro ao realizar login."
        });
    }
});

// =====================================
// LISTAR PRODUTOS
// =====================================

app.get("/produtos", async (req, res) => {
    try {
        const db = obterBanco();

        const produtos = await db.collection("produtos")
            .find()
            .sort({ id: 1 })
            .toArray();

        res.json(produtos);

    } catch (erro) {
        console.error("Erro ao listar produtos:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar produtos."
        });
    }
});

// =====================================
// ADICIONAR AO CARRINHO
// =====================================

app.post("/carrinho", async (req, res) => {
    try {
        const { usuarioId, produtoId, quantidade } = req.body;

        const idUsuario = Number(usuarioId);
        const idProduto = Number(produtoId);
        const qtd = Number(quantidade);

        const usuario = await buscarUsuario(idUsuario);

        if (!usuario || !Number.isInteger(qtd) || qtd <= 0) {
            return res.status(400).json({
                mensagem: "Dados inválidos."
            });
        }

        const db = obterBanco();

        const produtosCollection = db.collection("produtos");
        const carrinhosCollection = db.collection("carrinhos");

        const produto = await produtosCollection.findOne({
            id: idProduto
        });

        if (!produto) {
            return res.status(404).json({
                mensagem: "Produto não encontrado."
            });
        }

        const carrinho = await carrinhosCollection.findOne({
            usuarioId: idUsuario
        });

        const item = carrinho?.itens.find(
            item => item.produtoId === idProduto
        );

        const quantidadeAtual = item ? item.quantidade : 0;

        if (quantidadeAtual + qtd > produto.estoque) {
            return res.status(400).json({
                mensagem: "Estoque insuficiente."
            });
        }

        if (carrinho) {
            if (item) {
                await carrinhosCollection.updateOne(
                    {
                        usuarioId: idUsuario,
                        "itens.produtoId": idProduto
                    },
                    {
                        $inc: {
                            "itens.$.quantidade": qtd
                        }
                    }
                );
            } else {
                await carrinhosCollection.updateOne(
                    { usuarioId: idUsuario },
                    {
                        $push: {
                            itens: {
                                produtoId: idProduto,
                                quantidade: qtd
                            }
                        }
                    }
                );
            }
        } else {
            await carrinhosCollection.insertOne({
                usuarioId: idUsuario,
                itens: [
                    {
                        produtoId: idProduto,
                        quantidade: qtd
                    }
                ]
            });
        }

        res.json({
            mensagem: "Produto adicionado ao carrinho."
        });

    } catch (erro) {
        console.error("Erro ao adicionar ao carrinho:", erro);

        res.status(500).json({
            mensagem: "Erro ao adicionar produto ao carrinho."
        });
    }
});

// =====================================
// CONSULTAR CARRINHO
// =====================================

app.get("/carrinho/:usuarioId", async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);
        const usuario = await buscarUsuario(usuarioId);

        if (!usuario) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const db = obterBanco();

        const carrinhosCollection = db.collection("carrinhos");
        const produtosCollection = db.collection("produtos");

        const carrinho = await carrinhosCollection.findOne({
            usuarioId
        });

        const itens = carrinho ? carrinho.itens : [];
        const itensDetalhados = [];

        for (const item of itens) {
            const produto = await produtosCollection.findOne({
                id: item.produtoId
            });

            if (produto) {
                itensDetalhados.push({
                    produtoId: produto.id,
                    nome: produto.nome,
                    quantidade: item.quantidade,
                    preco: produto.preco,
                    subtotal: Number(
                        (produto.preco * item.quantidade).toFixed(2)
                    )
                });
            }
        }

        const total = Number(
            itensDetalhados.reduce(
                (soma, item) => soma + item.subtotal,
                0
            ).toFixed(2)
        );

        res.json({
            itens: itensDetalhados,
            total
        });

    } catch (erro) {
        console.error("Erro ao consultar carrinho:", erro);

        res.status(500).json({
            mensagem: "Erro ao consultar carrinho."
        });
    }
});

// =====================================
// REMOVER PRODUTO DO CARRINHO
// =====================================

app.delete("/carrinho/:usuarioId/:produtoId", async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);
        const produtoId = Number(req.params.produtoId);

        const db = obterBanco();
        const carrinhosCollection = db.collection("carrinhos");

        const carrinho = await carrinhosCollection.findOne({
            usuarioId
        });

        if (!carrinho) {
            return res.status(404).json({
                mensagem: "Carrinho não encontrado."
            });
        }

        const itemExiste = carrinho.itens.some(
            item => item.produtoId === produtoId
        );

        if (!itemExiste) {
            return res.status(404).json({
                mensagem: "Produto não encontrado no carrinho."
            });
        }

        await carrinhosCollection.updateOne(
            { usuarioId },
            {
                $pull: {
                    itens: { produtoId }
                }
            }
        );

        res.json({
            mensagem: "Produto removido do carrinho."
        });

    } catch (erro) {
        console.error("Erro ao remover produto:", erro);

        res.status(500).json({
            mensagem: "Erro ao remover produto do carrinho."
        });
    }
});

// =====================================
// FINALIZAR COMPRA
// =====================================

app.post("/finalizar-compra", async (req, res) => {
    try {
        const { usuarioId, pagamento } = req.body;

        const idUsuario = Number(usuarioId);
        const usuario = await buscarUsuario(idUsuario);

        if (!usuario || !pagamento) {
            return res.status(400).json({
                mensagem: "Informe um usuário válido e a forma de pagamento."
            });
        }

        const formaPagamento = String(pagamento)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (!["pix", "cartao de credito", "dinheiro"].includes(formaPagamento)) {
            return res.status(400).json({
                mensagem: "Forma de pagamento inválida."
            });
        }

        const db = obterBanco();

        const produtosCollection = db.collection("produtos");
        const carrinhosCollection = db.collection("carrinhos");
        const clientesCollection = db.collection("clientes");
        const pedidosCollection = db.collection("pedidos");

        const carrinho = await carrinhosCollection.findOne({
            usuarioId: idUsuario
        });

        if (!carrinho || carrinho.itens.length === 0) {
            return res.status(400).json({
                mensagem: "Carrinho vazio."
            });
        }

        let cliente = await clientesCollection.findOne({
            usuarioId: idUsuario
        });

        if (!cliente) {
            cliente = {
                usuarioId: idUsuario,
                totalComprado: 0,
                vip: false
            };

            await clientesCollection.insertOne(cliente);
        }

        const itensPedido = [];

        for (const item of carrinho.itens) {
            const produto = await produtosCollection.findOne({
                id: item.produtoId
            });

            if (!produto || produto.estoque < item.quantidade) {
                return res.status(400).json({
                    mensagem: "Estoque insuficiente."
                });
            }

            itensPedido.push({
                produtoId: produto.id,
                nome: produto.nome,
                quantidade: item.quantidade,
                preco: produto.preco,
                subtotal: Number(
                    (produto.preco * item.quantidade).toFixed(2)
                )
            });
        }

        const subtotal = Number(
            itensPedido.reduce(
                (soma, item) => soma + item.subtotal,
                0
            ).toFixed(2)
        );

        // DESCONTO DE 10% PARA DINHEIRO

        const desconto = formaPagamento === "dinheiro"
            ? Number((subtotal * 0.10).toFixed(2))
            : 0;

        // FRETE GRÁTIS PARA CLIENTE VIP

        const frete = cliente.vip ? 0 : 20;

        const valorCompra = Number(
            (subtotal - desconto).toFixed(2)
        );

        const total = Number(
            (valorCompra + frete).toFixed(2)
        );

        // BAIXAR ESTOQUE

        for (const item of carrinho.itens) {
            const resultado = await produtosCollection.updateOne(
                {
                    id: item.produtoId,
                    estoque: { $gte: item.quantidade }
                },
                {
                    $inc: {
                        estoque: -item.quantidade
                    }
                }
            );

            if (resultado.modifiedCount !== 1) {
                return res.status(400).json({
                    mensagem: "Não foi possível atualizar o estoque. Confira o carrinho antes de tentar novamente."
                });
            }
        }

        // ATUALIZAR CLIENTE

        const totalComprado = Number(
            (cliente.totalComprado + valorCompra).toFixed(2)
        );

        const vip = totalComprado >= 300;

        await clientesCollection.updateOne(
            { usuarioId: idUsuario },
            {
                $set: {
                    totalComprado,
                    vip
                }
            }
        );

        // REGISTRAR PEDIDO

        const ultimoPedido = await pedidosCollection
            .find()
            .sort({ id: -1 })
            .limit(1)
            .toArray();

        const pedido = {
            id: ultimoPedido.length ? ultimoPedido[0].id + 1 : 1,
            usuarioId: idUsuario,
            itens: itensPedido,
            pagamento,
            subtotal,
            desconto,
            frete,
            total,
            status: "Finalizado"
        };

        await pedidosCollection.insertOne(pedido);

        // LIMPAR CARRINHO

        await carrinhosCollection.deleteOne({
            usuarioId: idUsuario
        });

        res.json({
            mensagem: "Compra finalizada com sucesso!",
            pedido,
            cliente: {
                totalComprado,
                vip
            }
        });

    } catch (erro) {
        console.error("Erro ao finalizar compra:", erro);

        res.status(500).json({
            mensagem: "Erro ao finalizar compra."
        });
    }
});

// =====================================
// CONSULTAR PEDIDOS
// =====================================

app.get("/pedidos/:usuarioId", async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);
        const usuario = await buscarUsuario(usuarioId);

        if (!usuario) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const db = obterBanco();

        const pedidosUsuario = await db.collection("pedidos")
            .find({ usuarioId })
            .sort({ id: -1 })
            .toArray();

        res.json(pedidosUsuario);

    } catch (erro) {
        console.error("Erro ao consultar pedidos:", erro);

        res.status(500).json({
            mensagem: "Erro ao consultar pedidos."
        });
    }
});

// =====================================
// SWAGGER
// =====================================

const swaggerPath = path.join(__dirname, "swagger.yaml");

const swaggerDocument = YAML.parse(
    fs.readFileSync(swaggerPath, "utf8")
);

app.get("/swagger.yaml", (req, res) => {
    res.type("text/yaml").sendFile(swaggerPath);
});

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

// =====================================
// INICIAR SERVIDOR
// =====================================

if (require.main === module) {
    async function iniciarServidor() {
        try {
            await conectarBanco();

            await prepararBanco();

            app.listen(PORT, () => {
                console.log("Servidor rodando em http://localhost:" + PORT);
                console.log("Documentação Swagger: http://localhost:3000/api-docs");
                console.log("Arquivo YAML: http://localhost:3000/swagger.yaml");
            });

        } catch (erro) {
            console.error("Erro ao iniciar o servidor:", erro);
        }
    }

    iniciarServidor();
}

module.exports = app;