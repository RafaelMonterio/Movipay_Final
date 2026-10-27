# MoviPay — Documentação do Projeto

> Nota: este projeto não continha um `README.md` original no pacote recebido — este documento foi criado do zero durante a reformulação das telas, reunindo a documentação técnica/funcional que normalmente viveria aqui. O `README.md` na raiz ficou apenas com a introdução rápida do projeto; este arquivo concentra os detalhes.

## Stack

- **Next.js 14** (App Router) + **React 18**
- **Framer Motion** para animações
- **Tailwind CSS** (utilitário, usado nas telas mais antigas) + **estilos inline com tokens de tema** (usado nas telas redesenhadas)
- **Axios** para chamadas HTTP (`src/servicos/clienteApi.js`)
- **Leaflet / react-leaflet** para o radar/mapa de profissionais
- Autenticação via JWT em `localStorage` + cookie (`src/contexto/contextoAutenticacao.jsx`)

## Estrutura de rotas

