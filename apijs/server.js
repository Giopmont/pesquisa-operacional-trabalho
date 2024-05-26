const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
    const agora = new Date();
    console.log(`Data/Hora da Requisição: ${agora.toLocaleString()}`);
    console.log(`Requisição ${req.method} para ${req.url} em ${agora.toLocaleString()}`);
    console.log('Corpo da Requisição:', JSON.stringify(req.body, null, 2));
    next();
});

app.post('/simplex', (req, res) => {
    const dados = req.body;
    try {
        const resultado = resolverProblema(dados);
        res.send({
            status: "Sucesso",
            resumo: {
                numeroDeIteracoes: resultado.iteracoes.length,
                valorOtimo: resultado.ValorOtimo,
                valoresDasVariaveis: resultado.solucao,
                variaveisBasicas: resultado.VariaveisBasicas
            },
            iteracoes: resultado.iteracoes
        });
    } catch (error) {
        res.status(500).send({
            status: "Falha",
            mensagem: error.message,
            iteracoes: error.iteracoes,
            tabelas: error.tabelas
        });
    }
});

function resolverProblema(dados) {
    let necessitaDuasFases = dados.restricoes.some(r => r.tipo === '>=' || r.tipo === '=');
    if (necessitaDuasFases) {
        return metodoDuasFases(dados);
    } else {
        return solverSimplex(dados);
    }
}

function solverSimplex(dados) {
    let { num_variaveis, objetivo, restricoes, tipo_problema } = dados;
    let c = objetivo.map(coef => tipo_problema === 'maximizar' ? -coef : coef);
    let A = restricoes.map(r => r.coeficientes);
    let b = restricoes.map(r => r.lado_direito);

    let { Tabela, numVariaveis } = inicializaTabela(c, A, b, num_variaveis, restricoes);
    let Tabelas = [clonarTabela(Tabela)];
    let iteracoes = [];

    while (true) {
        let pivot = encontrarPivot(Tabela);
        if (pivot.coluna === -1) break;

        iteracoes.push({
            iteracao: Tabelas.length,
            Tabela: formatarTabela(Tabela),
            pivot,
            variaveisBasicas: identificarVariaveisBasicas(Tabela, numVariaveis)
        });

        pivotearTabela(Tabela, pivot);
        Tabelas.push(clonarTabela(Tabela));
    }

    let ValorOtimo = Tabela[0][Tabela[0].length - 1];
    let solucao = extrairSolucao(Tabela, numVariaveis);
    let VariaveisBasicas = identificarVariaveisBasicas(Tabela, numVariaveis);

    // Adiciona a última iteração com os resultados finais
    iteracoes.push({
        iteracao: Tabelas.length,
        Tabela: formatarTabela(Tabela),
        pivot: null,
        variaveisBasicas: VariaveisBasicas
    });

    return {
        ValorOtimo,
        solucao,
        Tabelas,
        iteracoes,
        VariaveisBasicas
    };
}

function inicializaTabela(c, A, b, numVariaveis, restricoes) {
    let numLinhas = A.length;
    let numColunas = c.length + numLinhas + 1;
    let Tabela = Array(numLinhas + 1).fill(null).map(() => Array(numColunas).fill(0));

    for (let j = 0; j < c.length; j++) {
        Tabela[0][j] = c[j];
    }
    Tabela[0][numColunas - 1] = 0;

    for (let i = 0; i < numLinhas; i++) {
        for (let j = 0; j < c.length; j++) {
            Tabela[i + 1][j] = A[i][j];
        }
        Tabela[i + 1][c.length + i] = (restricoes[i].tipo === "<=") ? 1 : -1;
        Tabela[i + 1][numColunas - 1] = b[i];
    }

    return { Tabela, numVariaveis: c.length + numLinhas };
}

function metodoDuasFases(dados) {
    let { num_variaveis, objetivo, restricoes, tipo_problema } = dados;
    let c = objetivo.map(coef => tipo_problema === 'maximizar' ? -coef : coef);
    let A = restricoes.map(r => r.coeficientes);
    let b = restricoes.map(r => r.lado_direito);

    let { Tabela, numVariaveisComArtificiais } = inicializaTabelaComArtificiais(A, b, num_variaveis, restricoes);
    let Tabelas = [clonarTabela(Tabela)];
    let iteracoes = [];
    let explicacao = [];

    explicacao.push("Iniciando a Fase 1 do método das duas fases...");

    let cArtificial = Array(Tabela[0].length - 1).fill(0).concat(1);

    let resultadoFase1 = resolverSimplexFase1(Tabela, cArtificial, numVariaveisComArtificiais);
    if (resultadoFase1.ValorOtimo > 0) {
        explicacao.push("O problema é inviável, pois o valor ótimo na fase 1 é maior que zero.");
        return { inviavel: true, explicacao };
    }

    explicacao.push("Terminada a Fase 1. A solução básica viável inicial foi encontrada.");

    let resultadoFase2 = solverSimplex({
        num_variaveis: num_variaveis,
        objetivo: objetivo,
        restricoes: A.map((coef, i) => ({
            coeficientes: coef,
            tipo: restricoes[i].tipo,
            lado_direito: b[i]
        })),
        tipo_problema: tipo_problema
    });

    return {
        ValorOtimo: resultadoFase2.ValorOtimo,
        solucao: resultadoFase2.solucao,
        Tabelas: Tabelas.concat(resultadoFase1.Tabelas, resultadoFase2.Tabelas),
        iteracoes: iteracoes.concat(resultadoFase1.iteracoes, resultadoFase2.iteracoes),
        VariaveisBasicas: resultadoFase2.VariaveisBasicas,
        explicacao: explicacao.concat(resultadoFase1.explicacao, resultadoFase2.explicacao)
    };
}

function inicializaTabelaComArtificiais(A, b, numVariaveis, restricoes) {
    let numLinhas = A.length;
    let numColunas = numVariaveis + numLinhas + restricoes.filter(r => r.tipo !== '<=').length + 1;
    let Tabela = Array(numLinhas + 1).fill(null).map(() => Array(numColunas).fill(0));

    for (let i = 0; i < numLinhas; i++) {
        for (let j = 0; j < numVariaveis; j++) {
            Tabela[i + 1][j] = A[i][j];
        }
        if (restricoes[i].tipo === ">=") {
            Tabela[i + 1][numVariaveis + i] = -1; // Variável de excesso
            Tabela[i + 1][numVariaveis + numLinhas + i] = 1; // Variável artificial
        } else if (restricoes[i].tipo === "=") {
            Tabela[i + 1][numVariaveis + numLinhas + i] = 1; // Variável artificial
        } else {
            Tabela[i + 1][numVariaveis + i] = 1; // Variável de folga
        }
        Tabela[i + 1][numColunas - 1] = b[i];
    }

    return { Tabela, numVariaveis: numVariaveis + numLinhas };
}

function resolverSimplexFase1(Tabela, cArtificial, numVariaveisComArtificiais) {
    let Tabelas = [clonarTabela(Tabela)];
    let iteracoes = [];
    let explicacao = [];

    explicacao.push("Iniciando o método Simplex...");

    while (true) {
        let pivot = encontrarPivot(Tabela);
        if (pivot.coluna === -1) break;

        iteracoes.push({
            iteracao: Tabelas.length,
            Tabela: formatarTabela(Tabela),
            pivot,
            variaveisBasicas: identificarVariaveisBasicas(Tabela, numVariaveisComArtificiais)
        });

        pivotearTabela(Tabela, pivot);
        Tabelas.push(clonarTabela(Tabela));
    }

    let ValorOtimo = Tabela[0][Tabela[0].length - 1];
    let solucao = extrairSolucao(Tabela, numVariaveisComArtificiais);
    let VariaveisBasicas = identificarVariaveisBasicas(Tabela, numVariaveisComArtificiais);

    // Adiciona a última iteração com os resultados finais
    iteracoes.push({
        iteracao: Tabelas.length,
        Tabela: formatarTabela(Tabela),
        pivot: null,
        variaveisBasicas: VariaveisBasicas
    });

    explicacao.push(`Valor ótimo encontrado: ${ValorOtimo}`);
    explicacao.push(`Solução: ${solucao}`);

    return {
        Tabela,
        ValorOtimo,
        solucao,
        Tabelas,
        iteracoes,
        VariaveisBasicas,
        explicacao
    };
}

function encontrarPivot(Tabela) {
    let numColunas = Tabela[0].length;
    let colunaPivot = -1;
    let menor = 0;

    for (let j = 0; j < numColunas - 1; j++) {
        if (Tabela[0][j] < menor) {
            menor = Tabela[0][j];
            colunaPivot = j;
        }
    }

    if (colunaPivot === -1) return { linha: -1, coluna: -1 };

    let linhaPivot = selecionarLinhaPivot(Tabela, colunaPivot);

    return { linha: linhaPivot, coluna: colunaPivot };
}

function selecionarLinhaPivot(Tabela, colunaPivot) {
    let numColunas = Tabela[0].length;
    let linhaPivot = -1;
    let menorRazao = Infinity;

    for (let i = 1; i < Tabela.length; i++) {
        if (Tabela[i][colunaPivot] > 0) {
            let razao = Tabela[i][numColunas - 1] / Tabela[i][colunaPivot];
            if (razao < menorRazao) {
                menorRazao = razao;
                linhaPivot = i;
            }
        }
    }

    if (linhaPivot === -1) {
        let error = new Error("O problema é ilimitado.");
        error.iteracoes = iteracoes;
        error.tabelas = Tabelas;
        throw error;
    }

    return linhaPivot;
}

function pivotearTabela(Tabela, pivot) {
    let numLinhas = Tabela.length;
    let numColunas = Tabela[0].length;
    let valorPivot = Tabela[pivot.linha][pivot.coluna];

    for (let j = 0; j < numColunas; j++) {
        Tabela[pivot.linha][j] /= valorPivot;
    }

    for (let i = 0; i < numLinhas; i++) {
        if (i !== pivot.linha) {
            let fator = Tabela[i][pivot.coluna];
            for (let j = 0; j < numColunas; j++) {
                Tabela[i][j] -= fator * Tabela[pivot.linha][j];
            }
        }
    }
}

function extrairSolucao(Tabela, numVariaveis) {
    let solucao = Array(numVariaveis).fill(0);
    let numLinhas = Tabela.length;
    let numColunas = Tabela[0].length - 1;

    for (let j = 0; j < numVariaveis; j++) {
        let linhaBase = -1;

        for (let i = 1; i < numLinhas; i++) {
            if (Tabela[i][j] === 1) {
                if (verificarColunaUnitaria(Tabela, j, i)) {
                    linhaBase = i;
                    break;
                }
            }
        }

        if (linhaBase !== -1) {
            solucao[j] = Tabela[linhaBase][numColunas];
        }
    }

    return solucao;
}

function verificarColunaUnitaria(Tabela, coluna, linhaBase) {
    let numLinhas = Tabela.length;
    for (let i = 1; i < numLinhas; i++) {
        if (i !== linhaBase && Tabela[i][coluna] !== 0) {
            return false;
        }
    }
    return true;
}

function clonarTabela(Tabela) {
    return Tabela.map(linha => [...linha]);
}

function identificarVariaveisBasicas(Tabela, numVariaveis) {
    let VariaveisBasicas = [];
    let numLinhas = Tabela.length;
    let numColunas = Tabela[0].length - 1;

    for (let j = 0; j < numVariaveis; j++) {
        let ehBasica = false;
        for (let i = 1; i < numLinhas; i++) {
            if (Tabela[i][j] === 1 && verificarColunaUnitaria(Tabela, j, i)) {
                VariaveisBasicas.push({ variavel: `x${j + 1}`, linha: i, valor: Tabela[i][numColunas].toFixed(2) });
                ehBasica = true;
                break;
            }
        }
        if (!ehBasica) {
            VariaveisBasicas.push({ variavel: `x${j + 1}`, linha: null, valor: 0 });
        }
    }
    return VariaveisBasicas;
}

function formatarTabela(Tabela) {
    return Tabela.map(linha => linha.map(celula => Number(celula.toFixed(2))));
}

app.listen(3003, () => console.log('Servidor Simplex rodando na porta 3003.'));
