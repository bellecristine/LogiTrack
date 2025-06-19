const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  origem: { type: String, required: true },
  destino: { type: String, required: true },
  cliente: { type: String, required: true },
  tipo: { type: String, required: true },
  status: {
    type: String,
    enum: ['em processamento', 'em rota', 'entregue', 'cancelado'],
    default: 'em processamento'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
