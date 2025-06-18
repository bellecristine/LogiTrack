const express = require('express');
const router = express.Router();

let pedidos = [];

// Criar pedido
router.post('/', (req, res) => {
  const novoPedido = { id: pedidos.length + 1, ...req.body, status: 'em processamento' };
  pedidos.push(novoPedido);
  res.status(201).json(novoPedido);
});

// Listar todos os pedidos
router.get('/', (req, res) => {
  res.json(pedidos);
});

// Buscar pedido por ID
router.get('/:id', (req, res) => {
  const pedido = pedidos.find(p => p.id == req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(pedido);
});

// Atualizar status do pedido
router.patch('/:id/status', (req, res) => {
  const pedido = pedidos.find(p => p.id == req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
  pedido.status = req.body.status;
  res.json(pedido);
});

// Cancelar pedido
router.delete('/:id', (req, res) => {
  pedidos = pedidos.filter(p => p.id != req.params.id);
  res.status(204).send();
});

module.exports = router;
