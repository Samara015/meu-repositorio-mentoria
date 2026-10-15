const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
    filme,
    quantasPessoasVotaramNoFilme,
    mediaDasNotas,
    retornarAvaliacao
} = require('../src/analiseFilme.js');

test('deve classificar como recomendado', () => {
    assert.equal(quantasPessoasVotaramNoFilme(filme[0]), 5);
    assert.equal(mediaDasNotas(filme[0]), 4.4);
    assert.equal(retornarAvaliacao(filme[0]), 'recomendado');
});

test('deve classificar como razoável', () => {
    assert.equal(quantasPessoasVotaramNoFilme(filme[1]), 5);
    assert.equal(mediaDasNotas(filme[1]), 3.2);
    assert.equal(retornarAvaliacao(filme[1]), 'razoável');
});

test('deve classificar como ruim', () => {
    assert.equal(quantasPessoasVotaramNoFilme(filme[2]), 3);
    assert.equal(mediaDasNotas(filme[2]), 2);
    assert.equal(retornarAvaliacao(filme[2]), 'ruim');
});