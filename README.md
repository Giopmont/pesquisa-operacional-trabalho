### README

# Simplex API e Interface Web

Este projeto consiste em uma API para resolver problemas de Programação Linear utilizando o método Simplex de duas fases e uma interface web para interagir com essa API. A aplicação permite resolver problemas de otimização linear com restrições do tipo `<=`, `>=` e `=`.

## Requisitos

- Node.js
- npm (gerenciador de pacotes do Node.js)

## Instalação

1. Clone este repositório para o seu ambiente local:
    ```bash
    git clone git@github.com:Giopmont/pesquisa-operacional-trabalho.git
    cd pesquisa-operacional-trabalho/apijs
    ```

2. Instale as dependências do projeto:
    ```bash
    npm install
    ```

## Execução

### Servidor da API

Para iniciar o servidor da API:

```bash
npm start
```

Ou para iniciar em modo de desenvolvimento com hot-reload:

```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3003`.

### Interface Web

1. Abra o arquivo `index.html` no seu navegador para acessar a interface web.

## Endpoints da API

### POST /simplex

**Descrição**: Resolve um problema de Programação Linear utilizando o método Simplex de duas fases.

**URL**: `http://localhost:3003/simplex`

**Corpo da Requisição**:

```json
{
    "num_variaveis": 3,
    "objetivo": [4, 3, 9],
    "restricoes": [
        {
            "coeficientes": [2, 4, 6],
            "tipo": "<=",
            "lado_direito": 15
        },
        {
            "coeficientes": [1, 1, 1],
            "tipo": "=",
            "lado_direito": 4.5
        },
        {
            "coeficientes": [6, 1, 6],
            "tipo": ">=",
            "lado_direito": 12
        }
    ],
    "tipo_problema": "minimizar"
}
```

**Exemplo de Resposta**:

```json
{
    "status": "Sucesso",
    "resumo": {
        "numeroDeIteracoes": 5,
        "valorOtimo": 15,
        "valoresDasVariaveis": [1.5, 3, 0],
        "variaveisBasicas": [
            { "variavel": "x1", "linha": 3, "valor": "1.50" },
            { "variavel": "x2", "linha": 1, "valor": "3.00" },
            { "variavel": "x3", "linha": null, "valor": 0 }
        ]
    },
    "iteracoes": [
        {
            "iteracao": 1,
            "Tabela": [
                [ -1, -1, -1, 0, 0, 0, 1, 0, -4.5 ],
                [ 2, 4, 6, 1, 0, 0, 0, 0, 15 ],
                [ 1, 1, 1, 0, 0, 0, 0, 1, 4.5 ],
                [ 6, 1, 6, 0, 0, -1, 0, 0, 12 ]
            ],
            "pivot": { "linha": 3, "coluna": 0 },
            "variaveisBasicas": []
        },
        // Iterações subsequentes...
    ]
}
```

## Estrutura do Projeto

### Backend

- **server.js**: Contém o servidor Express que define as rotas e a lógica para resolver problemas de Programação Linear.
- **package.json**: Define as dependências do projeto e os scripts para executar o servidor.

### Frontend

- **index.html**: Página inicial com links para a documentação e a página do formulário de Programação Linear.
- **Menu.html**: Página com o formulário para inserir os dados do problema de Programação Linear e visualizar os resultados.
- **script.js**: Contém o código JavaScript para manipular o formulário e fazer requisições à API.

### Arquivos e Pastas

- **index.html**: Página inicial.
- **Menu.html**: Página com o formulário de Programação Linear.
- **script.js**: Código JavaScript para manipular o formulário.
- **server.js**: Servidor da API.
- **package.json**: Arquivo de configuração do Node.js.

## Funcionalidades

- **API**:
  - Resolve problemas de Programação Linear usando o método Simplex de duas fases.
  - Retorna o valor ótimo, as variáveis básicas e as iterações do algoritmo.

- **Interface Web**:
  - Formulário para inserir os dados do problema de Programação Linear.
  - Exibição das iterações do método Simplex.
  - Exportação dos resultados para PDF.

Sinta-se à vontade para ajustar as instruções conforme necessário para o seu ambiente e suas necessidades específicas.