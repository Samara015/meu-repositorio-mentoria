const filme = [
    { nome: "minha mãe é uma peça",avaliacoes: [5, 4, 4, 4, 5]
    },
    { nome: "saneamento básico",avaliacoes: [3, 4, 2, 3, 4]
    },
    { nome: "se eu fosse você",avaliacoes: [1, 2, 3]
    }
];

function quantasPessoasVotaramNoFilme(filme) {
    return filme.avaliacoes.length;
}
function mediaDasNotas(filme) {
    let soma = 0;
    for (let i = 0; i < filme.avaliacoes.length; i++) {
     soma = soma + filme.avaliacoes[i];
    }

    return soma / filme.avaliacoes.length;
}
function retornarAvaliacao(filme) {
    const media = mediaDasNotas(filme);
    if (media >= 4) {
        return "recomendado";
    }
    if (media >= 3) {
        return "razoável";
    }
    return "ruim";
}
module.exports = {
    filme,
    quantasPessoasVotaramNoFilme,
    mediaDasNotas,
    retornarAvaliacao
};