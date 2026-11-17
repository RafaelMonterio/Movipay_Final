const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',

    info: {
      title: 'MoviPay API',
      version: '0.9.1',
      description: 'Documentação da API do MoviPay',
    },

    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'senha'],
          properties: {
            email: {
              type: 'string',
              example: 'bruno@teste.com',
            },
            senha: {
              type: 'string',
              example: '123456',
            },
          },
        },

        Servico: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            trabalhador_id: {
              type: 'integer',
              example: 2,
            },
            titulo: {
              type: 'string',
              example: 'Instalação de tomadas',
            },
            descricao: {
              type: 'string',
              example: 'Instalação residencial.',
            },
            price: {
              type: 'number',
              example: 150,
            },
            tipo_preco: {
              type: 'string',
              example: 'fixed',
            },
            esta_ativo: {
              type: 'boolean',
              example: true,
            },
          },
        },
      },
    },

    paths: {
      '/health': {
        get: {
          summary: 'Verifica se a API está funcionando',
          tags: ['Sistema'],
          responses: {
            200: {
              description: 'API funcionando',
            },
          },
        },
      },

      '/api/v1/autenticacao/entrar': {
        post: {
          summary: 'Realiza login',
          tags: ['Autenticação'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login realizado com sucesso',
            },
            401: {
              description: 'E-mail ou senha incorretos',
            },
          },
        },
      },

      '/api/v1/autenticacao/me': {
        get: {
          summary: 'Retorna o usuário autenticado',
          tags: ['Autenticação'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: 'Dados do usuário autenticado',
            },
            401: {
              description: 'Token inválido ou ausente',
            },
          },
        },
      },

      '/api/v1/categorias': {
        get: {
          summary: 'Lista as categorias',
          tags: ['Categorias'],
          responses: {
            200: {
              description: 'Lista de categorias',
            },
          },
        },
      },

      '/api/v1/servicos': {
        get: {
          summary: 'Lista os serviços',
          tags: ['Serviços'],
          parameters: [
            {
              name: 'trabalhador_id',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
              },
            },
            {
              name: 'category',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            200: {
              description: 'Lista de serviços',
            },
          },
        },

        post: {
          summary: 'Cria um serviço como trabalhador',
          tags: ['Serviços'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['titulo', 'price'],
                  properties: {
                    titulo: {
                      type: 'string',
                      example: 'Instalação de tomadas',
                    },
                    descricao: {
                      type: 'string',
                      example: 'Instalação e manutenção de tomadas.',
                    },
                    price: {
                      type: 'number',
                      example: 150,
                    },
                    categoria_id: {
                      type: 'integer',
                      example: 1,
                    },
                    tipo_preco: {
                      type: 'string',
                      example: 'fixed',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Serviço criado',
            },
            401: {
              description: 'Token ausente ou inválido',
            },
            403: {
              description: 'Somente trabalhadores podem criar serviços',
            },
          },
        },
      },

      '/api/v1/servicos/{id}': {
        get: {
          summary: 'Busca um serviço pelo ID',
          tags: ['Serviços'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer',
              },
            },
          ],
          responses: {
            200: {
              description: 'Serviço encontrado',
            },
            404: {
              description: 'Serviço não encontrado',
            },
          },
        },

        patch: {
          summary: 'Atualiza um serviço',
          tags: ['Serviços'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    titulo: {
                      type: 'string',
                    },
                    descricao: {
                      type: 'string',
                    },
                    price: {
                      type: 'number',
                    },
                    esta_ativo: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Serviço atualizado',
            },
          },
        },

        delete: {
          summary: 'Desativa um serviço',
          tags: ['Serviços'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer',
              },
            },
          ],
          responses: {
            204: {
              description: 'Serviço desativado',
            },
          },
        },
      },

      '/api/v1/trabalhadores': {
        get: {
          summary: 'Lista os trabalhadores',
          tags: ['Trabalhadores'],
          parameters: [
            {
              name: 'category',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
            },
            {
              name: 'q',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            200: {
              description: 'Lista de trabalhadores',
            },
          },
        },
      },

      '/api/v1/pedidos': {
        get: {
          summary: 'Lista os pedidos do usuário autenticado',
          tags: ['Pedidos'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'role',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['client', 'worker'],
              },
            },
          ],
          responses: {
            200: {
              description: 'Lista de pedidos',
            },
          },
        },
      },

      '/api/v1/conversas': {
        get: {
          summary: 'Lista as conversas do usuário',
          tags: ['Conversas'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: 'Lista de conversas',
            },
          },
        },
      },

      '/api/v1/pagamentos/carteira': {
        get: {
          summary: 'Consulta a carteira do trabalhador',
          tags: ['Pagamentos'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: 'Dados da carteira',
            },
          },
        },
      },

      '/api/v1/ganhos': {
        get: {
          summary: 'Consulta os ganhos do trabalhador',
          tags: ['Ganhos'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: 'months',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                example: 6,
              },
            },
          ],
          responses: {
            200: {
              description: 'Ganhos do trabalhador',
            },
          },
        },
      },
    },
  },

  apis: [],
};

module.exports = swaggerJsdoc(options);
