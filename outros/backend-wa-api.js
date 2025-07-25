// Backend completo para integração WhatsApp + API REST
const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

let instances = [];
let qrCodes = {};

// GET todas as instâncias
app.get('/api/instances', (req, res) => {
  res.json(instances.map(i => ({ id: i.id, name: i.name, status: i.status })));
});

// POST cria nova instância
app.post('/api/instances', (req, res) => {
  const { name } = req.body;
  const id = Date.now().toString();
  const client = new Client();
  let instance = { id, name, status: 'connecting', client };
  instances.unshift(instance);
  client.on('qr', qr => {
    qrcode.toDataURL(qr, (err, url) => {
      qrCodes[id] = url;
      instance.status = 'connecting';
    });
  });
  client.on('ready', () => {
    instance.status = 'connected';
  });
  client.on('disconnected', () => {
    instance.status = 'disconnected';
  });
  client.initialize();
  res.json({ id, name, status: 'connecting' });
});

// GET QR code da instância
app.get('/api/instances/:id/qr', (req, res) => {
  const id = req.params.id;
  if (qrCodes[id]) {
    res.json({ qrString: qrCodes[id] });
  } else {
    res.json({ qrString: null });
  }
});

// POST restart
app.post('/api/instances/:id/restart', (req, res) => {
  const id = req.params.id;
  const inst = instances.find(i => i.id === id);
  if (inst && inst.client) {
    inst.client.destroy();
    inst.status = 'disconnected';
    inst.client.initialize();
    inst.status = 'connecting';
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Instância não encontrada' });
  }
});

// POST disconnect
app.post('/api/instances/:id/disconnect', (req, res) => {
  const id = req.params.id;
  const inst = instances.find(i => i.id === id);
  if (inst && inst.client) {
    inst.client.destroy();
    inst.status = 'disconnected';
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Instância não encontrada' });
  }
});

// DELETE instância
app.delete('/api/instances/:id', (req, res) => {
  const id = req.params.id;
  instances = instances.filter(i => i.id !== id);
  delete qrCodes[id];
  res.json({ success: true });
});

// Dashboard mock
app.get('/api/dashboard', (req, res) => {
  res.json({ mensagensEnviadas: 1234, eventosWebhook: 5678 });
});

// Settings mock
app.get('/api/settings', (req, res) => {
  res.json({ theme: 'dark', notifications: true });
});
app.post('/api/settings', (req, res) => {
  res.json({ success: true });
});

app.listen(3000, () => console.log('Backend WA-API rodando na porta 3000'));
