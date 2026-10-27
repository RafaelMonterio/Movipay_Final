import api from './clienteApi';

const servicoPedidos = {
  listarTodos: () => api.get('/pedidos').then(resposta => resposta.data),
  criar: idServico => api.post('/pedidos', { servico_id: idServico }).then(resposta => resposta.data),
  atualizarStatus: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }).then(resposta => resposta.data),
};

export default servicoPedidos;
