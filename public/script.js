const API = "http://localhost:3000";

const produtosContainer = document.getElementById("produtos");
const carrinhoContainer = document.getElementById("conteudoCarrinho");
const campoPesquisa = document.getElementById("campoPesquisa");

const cadastroForm = document.getElementById("cadastroForm");
const loginForm = document.getElementById("loginForm");

const imagens = {
    1: "/imagens/relogio%201.jpeg",
    2: "/imagens/relogio%202.jpeg",
    3: "/imagens/relogio%203.jpeg",
    4: "/imagens/relogio%20bicolor%20.jpeg",
    5: "/imagens/conjunto%20prata%20.jpeg",
    6: "/imagens/conjunto%20prata%202.jpeg",
    7: "/imagens/brinco%20ponto%20de%20luz%20.jpeg",
    8: "/imagens/conjunto%20ponto%20de%20luz.jpeg",
    9: "/imagens/kit%20relogio%20.jpeg",
    10: "/imagens/relogio%20vermelho%20.jpeg"
};

let listaProdutos = [];

let usuarioAtual = JSON.parse(
    localStorage.getItem("usuarioAtual")
) || null;

let carrinhoVisitante = JSON.parse(
    localStorage.getItem("carrinhoVisitante")
) || [];

// FORMATAR PREÇOS

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// NORMALIZAR TEXTO

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// EXIBIR PRODUTOS

function exibirProdutos(produtos) {
    if (!produtosContainer) {
        console.error("Elemento #produtos não encontrado no HTML.");
        return;
    }

    produtosContainer.innerHTML = "";

    if (!Array.isArray(produtos) || produtos.length === 0) {
        produtosContainer.innerHTML =
            "<p>Nenhum produto encontrado.</p>";
        return;
    }

    produtos.forEach(function(produto) {
        const card = document.createElement("div");
        card.className = "produto";

        const imagem = document.createElement("img");
        imagem.src = imagens[produto.id] || "";
        imagem.alt = produto.nome;
        imagem.className = "imagem-produto";

        imagem.onerror = function() {
            imagem.style.display = "none";
        };

        const nome = document.createElement("h3");
        nome.textContent = produto.nome;

        const preco = document.createElement("p");
        preco.textContent = formatarPreco(produto.preco);

        const estoque = document.createElement("p");
        estoque.textContent = "Estoque: " + produto.estoque;

        const botao = document.createElement("button");
        botao.textContent = "Adicionar ao carrinho";
        botao.disabled = Number(produto.estoque) <= 0;

        botao.addEventListener("click", function() {
            adicionarCarrinho(produto.id);
        });

        card.appendChild(imagem);
        card.appendChild(nome);
        card.appendChild(preco);
        card.appendChild(estoque);
        card.appendChild(botao);

        produtosContainer.appendChild(card);
    });
}

// CARREGAR PRODUTOS

async function carregarProdutos() {
    try {
        const resposta = await fetch(API + "/produtos");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar produtos.");
        }

        const dados = await resposta.json();

        // Aceita a lista direta ou dentro de "produtos"
        if (Array.isArray(dados)) {
            listaProdutos = dados;
        } else if (dados && Array.isArray(dados.produtos)) {
            listaProdutos = dados.produtos;
        } else if (dados && Array.isArray(dados.data)) {
            listaProdutos = dados.data;
        } else {
            throw new Error("Formato de resposta dos produtos não reconhecido.");
        }

        pesquisarProdutos();

        return true;

    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);

        if (produtosContainer) {
            produtosContainer.innerHTML =
                "<p>Não foi possível carregar os produtos. Verifique se o servidor está ligado.</p>";
        }

        return false;
    }
}

// PESQUISAR PRODUTOS

function pesquisarProdutos() {
    if (!campoPesquisa) {
        exibirProdutos(listaProdutos);
        return;
    }

    const termo = normalizarTexto(campoPesquisa.value);

    if (!termo) {
        exibirProdutos(listaProdutos);
        return;
    }

    const palavras = termo
        .split(/\s+/)
        .filter(palavra =>
            !["de", "da", "do", "dos", "das"].includes(palavra)
        );

    const resultado = listaProdutos.filter(function(produto) {
        const nome = normalizarTexto(produto.nome);

        return palavras.every(function(palavra) {
            return nome.includes(palavra);
        });
    });

    exibirProdutos(resultado);
}

if (campoPesquisa) {
    campoPesquisa.addEventListener("input", pesquisarProdutos);
}

// ABRIR E FECHAR CADASTRO E LOGIN

const areaContas = document.getElementById("areaContas");
const botoesPainel = document.querySelectorAll("[data-painel]");
const botoesFechar = document.querySelectorAll("[data-fechar]");

botoesPainel.forEach(function(botao) {
    botao.addEventListener("click", function(evento) {
        evento.preventDefault();

        const painelEscolhido = document.getElementById(
            botao.dataset.painel
        );

        const cadastro = document.getElementById("cadastro");
        const login = document.getElementById("login");

        if (!areaContas || !painelEscolhido) return;

        if (cadastro) cadastro.hidden = true;
        if (login) login.hidden = true;

        areaContas.hidden = false;
        painelEscolhido.hidden = false;

        areaContas.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
});

botoesFechar.forEach(function(botao) {
    botao.addEventListener("click", function() {
        const cadastro = document.getElementById("cadastro");
        const login = document.getElementById("login");

        if (cadastro) cadastro.hidden = true;
        if (login) login.hidden = true;
        if (areaContas) areaContas.hidden = true;
    });
});

// SALVAR CARRINHO DE VISITANTE

function salvarCarrinhoVisitante() {
    localStorage.setItem(
        "carrinhoVisitante",
        JSON.stringify(carrinhoVisitante)
    );
}

// ADICIONAR AO CARRINHO

async function adicionarCarrinho(produtoId) {
    if (!usuarioAtual) {
        const item = carrinhoVisitante.find(
            item => Number(item.produtoId) === Number(produtoId)
        );

        const produto = listaProdutos.find(
            produto => Number(produto.id) === Number(produtoId)
        );

        if (!produto || Number(produto.estoque) <= 0) {
            alert("Produto sem estoque disponível.");
            return;
        }

        const quantidadeAtual = item ? item.quantidade : 0;

        if (quantidadeAtual + 1 > Number(produto.estoque)) {
            alert("Estoque insuficiente.");
            return;
        }

        if (item) {
            item.quantidade++;
        } else {
            carrinhoVisitante.push({
                produtoId: produtoId,
                quantidade: 1
            });
        }

        salvarCarrinhoVisitante();

        alert("Produto adicionado ao carrinho!");

        consultarCarrinho();
        return;
    }

    try {
        const resposta = await fetch(API + "/carrinho", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuarioId: usuarioAtual.id,
                produtoId: produtoId,
                quantidade: 1
            })
        });

        const resultado = await resposta.json();

        alert(resultado.mensagem);

        if (resposta.ok) {
            await consultarCarrinho();
        }

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível adicionar o produto.");
    }
}

// CONSULTAR CARRINHO

async function consultarCarrinho() {
    if (!carrinhoContainer) return;

    if (!usuarioAtual) {
        exibirCarrinhoVisitante();
        return;
    }

    try {
        const resposta = await fetch(
            API + "/carrinho/" + usuarioAtual.id
        );

        if (!resposta.ok) {
            throw new Error("Erro ao consultar carrinho.");
        }

        const dados = await resposta.json();

        exibirCarrinho(dados.itens, dados.total);

    } catch (erro) {
        console.error(erro);

        carrinhoContainer.innerHTML =
            "<p>Não foi possível consultar o carrinho.</p>";
    }
}

// EXIBIR CARRINHO DE VISITANTE

function exibirCarrinhoVisitante() {
    const itens = carrinhoVisitante.map(function(item) {
        const produto = listaProdutos.find(
            produto => Number(produto.id) === Number(item.produtoId)
        );

        if (!produto) return null;

        return {
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: item.quantidade,
            preco: produto.preco,
            subtotal: Number(
                (produto.preco * item.quantidade).toFixed(2)
            )
        };
    }).filter(Boolean);

    const total = itens.reduce(
        (soma, item) => soma + item.subtotal,
        0
    );

    exibirCarrinho(itens, total);
}

// EXIBIR ITENS DO CARRINHO

function exibirCarrinho(itens, totalValor) {
    if (!carrinhoContainer) return;

    carrinhoContainer.innerHTML = "";

    if (!itens || itens.length === 0) {
        carrinhoContainer.innerHTML =
            "<p>Seu carrinho está vazio.</p>";
        return;
    }

    itens.forEach(function(item) {
        const linha = document.createElement("div");

        linha.textContent =
            item.nome +
            " - Quantidade: " +
            item.quantidade +
            " - " +
            formatarPreco(item.subtotal);

        const botaoRemover = document.createElement("button");
        botaoRemover.textContent = "Remover";

        botaoRemover.addEventListener("click", function() {
            removerCarrinho(item.produtoId);
        });

        linha.appendChild(botaoRemover);
        carrinhoContainer.appendChild(linha);
    });

    const total = document.createElement("h3");
    total.textContent = "Subtotal: " + formatarPreco(totalValor);

    carrinhoContainer.appendChild(total);

    if (!usuarioAtual) {
        const aviso = document.createElement("p");
        aviso.textContent =
            "Entre na sua conta para finalizar a compra.";

        carrinhoContainer.appendChild(aviso);

        const botaoLogin = document.createElement("button");
        botaoLogin.textContent = "Entrar para finalizar";

        botaoLogin.addEventListener("click", function() {
            const login = document.getElementById("login");

            if (areaContas && login) {
                document.getElementById("cadastro").hidden = true;
                login.hidden = false;
                areaContas.hidden = false;

                areaContas.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        });

        carrinhoContainer.appendChild(botaoLogin);
        return;
    }

    const pagamento = document.createElement("select");
    pagamento.id = "formaPagamento";

    pagamento.innerHTML =
        '<option value="PIX">PIX</option>' +
        '<option value="Cartão de crédito">Cartão de crédito</option>' +
        '<option value="Dinheiro">Dinheiro</option>';

    carrinhoContainer.appendChild(pagamento);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = "Finalizar compra";
    botao.addEventListener("click", finalizarCompra);

    carrinhoContainer.appendChild(botao);
}

// REMOVER PRODUTO DO CARRINHO

async function removerCarrinho(produtoId) {
    if (!confirm("Deseja remover este produto do carrinho?")) {
        return;
    }

    if (!usuarioAtual) {
        carrinhoVisitante = carrinhoVisitante.filter(
            item => Number(item.produtoId) !== Number(produtoId)
        );

        salvarCarrinhoVisitante();
        consultarCarrinho();
        return;
    }

    try {
        const resposta = await fetch(
            API + "/carrinho/" + usuarioAtual.id + "/" + produtoId,
            {
                method: "DELETE"
            }
        );

        const resultado = await resposta.json();

        alert(resultado.mensagem);

        if (resposta.ok) {
            await consultarCarrinho();
        }

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível remover o produto.");
    }
}

// CADASTRAR CLIENTE

if (cadastroForm) {
    cadastroForm.addEventListener("submit", async function(evento) {
        evento.preventDefault();

        const nome = document.getElementById("nomeCadastro").value.trim();
        const email = document.getElementById("emailCadastro").value.trim();
        const senha = document.getElementById("senhaCadastro").value;

        const mensagem = document.getElementById("mensagemCadastro");

        try {
            const resposta = await fetch(API + "/cadastro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nome, email, senha })
            });

            const resultado = await resposta.json();

            mensagem.textContent = resultado.mensagem;
            mensagem.style.color = resposta.ok ? "green" : "red";

            if (resposta.ok) {
                cadastroForm.reset();
            }

        } catch (erro) {
            console.error(erro);
            mensagem.textContent = "Não foi possível realizar o cadastro.";
            mensagem.style.color = "red";
        }
    });
}

// TRANSFERIR CARRINHO DE VISITANTE PARA A CONTA

async function transferirCarrinhoVisitante() {
    for (const item of carrinhoVisitante) {
        const resposta = await fetch(API + "/carrinho", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuarioId: usuarioAtual.id,
                produtoId: item.produtoId,
                quantidade: item.quantidade
            })
        });

        if (!resposta.ok) {
            const resultado = await resposta.json();
            throw new Error(resultado.mensagem);
        }
    }

    carrinhoVisitante = [];
    salvarCarrinhoVisitante();
}

// LOGIN

if (loginForm) {
    loginForm.addEventListener("submit", async function(evento) {
        evento.preventDefault();

        const email = document.getElementById("emailLogin").value.trim();
        const senha = document.getElementById("senhaLogin").value;

        const mensagem = document.getElementById("mensagemLogin");

        try {
            const resposta = await fetch(API + "/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                mensagem.textContent = resultado.mensagem;
                mensagem.style.color = "red";
                return;
            }

            usuarioAtual = resultado.usuario;

            localStorage.setItem(
                "usuarioAtual",
                JSON.stringify(usuarioAtual)
            );

            await transferirCarrinhoVisitante();

            mensagem.textContent =
                "Bem-vindo(a), " + usuarioAtual.nome + "!";

            mensagem.style.color = "green";

            loginForm.reset();

            await consultarCarrinho();

        } catch (erro) {
            console.error(erro);

            mensagem.textContent =
                erro.message || "Não foi possível realizar o login.";

            mensagem.style.color = "red";
        }
    });
}

// FINALIZAR COMPRA

async function finalizarCompra() {
    if (!usuarioAtual) {
        alert("Entre na sua conta para finalizar a compra.");
        return;
    }

    const pagamento =
        document.getElementById("formaPagamento").value;

    if (!confirm("Deseja finalizar sua compra?")) {
        return;
    }

    try {
        const resposta = await fetch(API + "/finalizar-compra", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuarioId: usuarioAtual.id,
                pagamento: pagamento
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.mensagem);
            return;
        }

        const pedido = resultado.pedido;
        const cliente = resultado.cliente;

        let mensagem =
            "COMPRA FINALIZADA COM SUCESSO!\n\n" +
            "Subtotal: " + formatarPreco(pedido.subtotal) + "\n" +
            "Desconto: " + formatarPreco(pedido.desconto) + "\n" +
            "Frete: " + formatarPreco(pedido.frete) + "\n" +
            "Total pago: " + formatarPreco(pedido.total) + "\n\n" +
            "Total acumulado: " +
            formatarPreco(cliente.totalComprado) + "\n\n";

        if (cliente.vip) {
            mensagem +=
                "PARABÉNS! VOCÊ É CLIENTE VIP!\n" +
                "Você conquistou frete grátis nas próximas compras.";
        } else {
            mensagem +=
                "Continue comprando para conquistar o benefício VIP!";
        }

        alert(mensagem);

        await carregarProdutos();
        await consultarCarrinho();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao finalizar a compra.");
    }
}

// INICIAR CATÁLOGO

async function iniciarLoja() {
    await carregarProdutos();
    await consultarCarrinho();
}

iniciarLoja();