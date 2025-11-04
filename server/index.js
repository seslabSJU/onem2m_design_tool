const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 4000;
const TINYIOT_HOST = process.env.TINYIOT_HOST || 'localhost';
const TINYIOT_PORT = process.env.TINYIOT_PORT || '3000';
const ORIGINATOR = process.env.ORIGINATOR || 'CAdmin';

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket 클라이언트 관리
const clients = new Set();

// WebSocket 연결 처리
wss.on('connection', (ws) => {
  console.log('[WS] New client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    console.log('[WS] Received from client:', message.toString());
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[WS] WebSocket error:', error);
    clients.delete(ws);
  });
});

// 모든 WebSocket 클라이언트에 메시지 브로드캐스트
function broadcastToClients(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log(`[WS] Broadcasted to ${clients.size} clients:`, data);
}

// TinyIoT에서 notification 받는 엔드포인트
app.post('/notification', (req, res) => {
  console.log('[NOTIFICATION] Received from TinyIoT:');
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const notification = req.body;

    // oneM2M notification 파싱
    const sgn = notification['m2m:sgn'];
    if (sgn) {
      const { nev, sur } = sgn;
      const rep = nev?.rep;
      const net = nev?.net; // 1=CREATE, 2=UPDATE, 3=DELETE, 4=RETRIEVE

      console.log('[NOTIFICATION] Event type:', net);
      console.log('[NOTIFICATION] Resource URI:', sur);
      console.log('[NOTIFICATION] Representation:', rep);

      // WebSocket으로 브라우저에 전달
      broadcastToClients({
        type: 'resource_change',
        eventType: net,
        resourceUri: sur,
        resource: rep
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[NOTIFICATION] Error processing notification:', error);
    res.status(500).send('Error');
  }
});

// Subscription 생성 API
app.post('/api/subscribe', async (req, res) => {
  const { csePath, subscriptionName } = req.body;

  if (!csePath) {
    return res.status(400).json({ error: 'csePath is required' });
  }

  const subscriptionData = {
    'm2m:sub': {
      rn: subscriptionName || 'designToolSub',
      nu: [`http://localhost:${PORT}/notification`],
      nct: 2, // 모든 내용 포함 (modified attributes)
      enc: {
        net: [1, 2, 3], // CREATE, UPDATE, DELETE
        chty: [1, 2, 3, 4, 9, 23, 7] // 모든 자식 리소스 타입 감지
      },
      exc: 0 // 하위 리소스 변경도 감지
    }
  };

  try {
    console.log(`[SUBSCRIBE] Creating subscription on ${csePath}`);
    const response = await axios.post(
      `http://${TINYIOT_HOST}:${TINYIOT_PORT}/${csePath}`,
      subscriptionData,
      {
        headers: {
          'X-M2M-Origin': ORIGINATOR,
          'Content-Type': 'application/json',
          'X-M2M-RVI': '2a'
        }
      }
    );

    console.log('[SUBSCRIBE] Subscription created successfully');
    res.json({
      success: true,
      subscription: response.data
    });
  } catch (error) {
    console.error('[SUBSCRIBE] Failed to create subscription:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Subscription 삭제 API
app.delete('/api/subscribe/:resourcePath', async (req, res) => {
  const { resourcePath } = req.params;

  try {
    console.log(`[UNSUBSCRIBE] Deleting subscription: ${resourcePath}`);
    await axios.delete(
      `http://${TINYIOT_HOST}:${TINYIOT_PORT}/${resourcePath}`,
      {
        headers: {
          'X-M2M-Origin': ORIGINATOR,
          'X-M2M-RVI': '2a'
        }
      }
    );

    console.log('[UNSUBSCRIBE] Subscription deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('[UNSUBSCRIBE] Failed to delete subscription:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  oneM2M Notification Server                    ║
╠════════════════════════════════════════════════╣
║  HTTP Server:    http://localhost:${PORT}        ║
║  WebSocket:      ws://localhost:${PORT}          ║
║  TinyIoT:        ${TINYIOT_HOST}:${TINYIOT_PORT}                ║
╚════════════════════════════════════════════════╝
  `);
});
