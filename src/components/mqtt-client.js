// oneM2M MQTT 바인딩 싱글톤 클라이언트
// TinyIoT mqttClient.c 구현에 맞춤
// request/response 상관(rqi 매칭) 기반
import mqtt from 'mqtt';

let client = null;
let pendingRequests = {};  // rqi -> { resolve, reject, timer }

// oneM2M MQTT 바인딩: originator ID의 '/'를 ':'로 변환 (토픽용)
function idToMqttClientId(id) {
  let s = id;
  if (s.startsWith('/')) s = s.substring(1);
  return s.replace(/\//g, ':');
}

// 연결 (이미 연결 중이면 재사용)
function connect(host, wsPort) {
  if (client && client.connected) return Promise.resolve(client);
  return new Promise((resolve, reject) => {
    // Mosquitto WebSocket: 경로 없이 연결 (기존 App.vue connectMQTT와 동일)
    const url = `ws://${host}:${wsPort}`;
    client = mqtt.connect(url, { reconnectPeriod: 0, connectTimeout: 10000 });
    client.on('connect', () => {
      console.log('[MQTT] Connected to broker:', url);
      // 응답 토픽 구독: /oneM2M/resp/+/+/#
      client.subscribe('/oneM2M/resp/+/+/#', (err) => {
        if (err) reject(err);
        else {
          console.log('[MQTT] Subscribed to /oneM2M/resp/+/+/#');
          resolve(client);
        }
      });
    });
    client.on('message', (topic, msg) => {
      try {
        console.log('[MQTT] Message on topic:', topic);
        const data = JSON.parse(msg.toString());
        console.log('[MQTT] Parsed response:', data);
        const rqi = data?.rqi;
        if (rqi && pendingRequests[rqi]) {
          clearTimeout(pendingRequests[rqi].timer);
          const rsc = data?.rsc;
          if (rsc >= 2000 && rsc < 3000) {
            // 성공: pc (primitive content) 반환
            pendingRequests[rqi].resolve(data?.pc || data);
          } else {
            pendingRequests[rqi].reject({ rsc, data });
          }
          delete pendingRequests[rqi];
        }
      } catch (e) {
        console.error('[MQTT] Failed to parse message:', e);
      }
    });
    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err);
      reject(err);
    });
    setTimeout(() => {
      if (!client?.connected) reject(new Error('MQTT connection timeout'));
    }, 10000);
  });
}

// 요청/응답 (rqi 상관)
// op: 1=Create, 2=Retrieve, 3=Update, 4=Delete
// cseRi: CSE의 Resource ID (토픽에 사용, 기본값 'tinyiot')
function request(host, wsPort, { op, to, fr, ty, pc, fc, rcn, rvi, rqi, cseRi }) {
  return new Promise(async (resolve, reject) => {
    try {
      await connect(host, wsPort);
    } catch (e) {
      return reject(e);
    }
    const requestId = rqi || `rqi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // TinyIoT는 토픽에서 receiver를 CSE_BASE_RI와 비교
    const receiver = cseRi || 'tinyiot';
    // originator ID의 '/'를 ':'로 변환 (oneM2M MQTT 바인딩)
    const mqttOrigin = idToMqttClientId(fr || 'CAdmin');

    const topic = `/oneM2M/req/${mqttOrigin}/${receiver}/json`;
    const body = {
      op, to, fr: fr || 'CAdmin', rqi: requestId, rvi: rvi || '2a',
      ...(ty ? { ty } : {}),
      ...(pc ? { pc } : {}),
      ...(fc && Object.keys(fc).length > 0 ? { fc } : {}),
      ...(rcn !== undefined ? { rcn } : {})
    };

    console.log(`[MQTT] Publishing to ${topic}:`, body);

    // 타임아웃 15초
    const timer = setTimeout(() => {
      delete pendingRequests[requestId];
      reject(new Error(`MQTT request timeout (rqi: ${requestId})`));
    }, 15000);

    pendingRequests[requestId] = { resolve, reject, timer };
    client.publish(topic, JSON.stringify(body));
  });
}

function disconnect() {
  if (client) { client.end(); client = null; }
  pendingRequests = {};
}

export { connect, request, disconnect };
