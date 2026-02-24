// 프로토콜 라우팅 레이어 — HTTP/MQTT 전환을 한 곳에서 관리
// 기존 HTTP 함수들은 원본 모듈을 그대로 호출하고,
// MQTT 모드일 때만 mqtt-client.js를 통해 대체 경로 사용

import http_create_resource from './http-request.js';
import http_cse_retrieve_fn from './retrieve_cse.js';
import http_resource_retrieve_fn from './retrieve_r.s.js';
import http_resource_delete_fn from './http-delete.js';
import { request as mqttRequest } from './mqtt-client.js';

function getProtocolMode() {
  return localStorage.getItem('protocolMode') || 'http';
}
function getMqttWsPort() {
  return localStorage.getItem('mqttWsPort') || '9001';
}

// targetIP에서 host 추출 (예: "http://192.168.0.1:3000/TinyIoT" -> "192.168.0.1")
function extractHost(targetIP) {
  try {
    const url = new URL(targetIP);
    return url.hostname;
  } catch {
    let s = targetIP.replace(/^https?:\/\//, '');
    return s.split(':')[0].split('/')[0];
  }
}

// ═══ CREATE ═══
async function create_resource(attr, path, targetIP) {
  if (getProtocolMode() === 'mqtt') {
    return mqtt_create_resource(attr, path, targetIP);
  }
  return http_create_resource(attr, path, targetIP);
}

async function mqtt_create_resource(attr, path, targetIP) {
  const host = extractHost(targetIP);
  const wsPort = getMqttWsPort();

  const typeMap = { 1: 'acp', 2: 'ae', 3: 'cnt', 4: 'cin', 9: 'grp', 23: 'sub', 28: 'fcnt', 58: 'fcin', 29: 'ts', 30: 'tsi' };
  const ty = attr['ty'];
  const nowType = typeMap[ty] || 'unknown';

  if (nowType === 'unknown') {
    console.error('[MQTT CREATE] Unknown resource type:', ty);
    return;
  }

  // body 구성 (헤더 속성 제외)
  const headerAttrs = ['ty', 'rvi'];
  const bodyAttrs = {};
  for (const key in attr) {
    if (attr.hasOwnProperty(key) && !headerAttrs.includes(key)) {
      bodyAttrs[key] = attr[key];
    }
  }

  // SUB: net -> enc.net
  if (nowType === 'sub' && bodyAttrs['net']) {
    bodyAttrs['enc'] = { 'net': bodyAttrs['net'] };
    delete bodyAttrs['net'];
  }

  // FCNT: cnd 기반 body 키
  let bodyKey;
  if (nowType === 'fcnt' && bodyAttrs['cnd']) {
    const cndParts = bodyAttrs['cnd'].split('.');
    const shortName = cndParts[cndParts.length - 1];
    const abbr = shortName.length > 5 ? shortName.substring(0, 5) : shortName;
    bodyKey = `cod:${abbr}`;
  } else {
    bodyKey = `m2m:${nowType}`;
  }

  const pc = { [bodyKey]: bodyAttrs };

  // localStorage에서 리소스별 헤더 설정값 읽기
  let resHeaders = {};
  try { resHeaders = JSON.parse(localStorage.getItem('resourceHeaders') || '{}'); } catch (e) {}
  const h = resHeaders[ty] || {};
  const origin = h.origin || localStorage.getItem('originator') || 'CAdmin';
  const rvi = h.rvi || '2a';

  // path에서 마지막 세그먼트 제거 (http-request.js와 동일)
  let toPath = path.replace(/\/[^/]*$/, '');
  if (toPath.startsWith('/')) toPath = toPath.substring(1);

  console.log(`[MQTT CREATE] to=${toPath}, ty=${ty}, bodyKey=${bodyKey}`);

  try {
    const result = await mqttRequest(host, wsPort, {
      op: 1,
      to: toPath,
      fr: origin,
      ty: ty,
      pc: pc,
      rvi: rvi
    });
    console.log(`[MQTT CREATE] Success:`, result);
    alert(`Resource of type ${nowType} created successfully! (MQTT)`);
    return result;
  } catch (error) {
    console.error(`[MQTT CREATE] Failed:`, error);
    const msg = error?.data?.['m2m:dbg'] || error?.message || 'Unknown error';
    alert(`Error (MQTT): ${msg}`);
    throw error;
  }
}

// ═══ RETRIEVE (리소스) ═══
async function retrieve_resource(originator, host, port, path, filterCriteria) {
  if (getProtocolMode() === 'mqtt') {
    return mqtt_retrieve(originator, host, port, path, filterCriteria);
  }
  return http_resource_retrieve_fn(originator, host, port, path, filterCriteria);
}

async function mqtt_retrieve(originator, host, _port, path, filterCriteria) {
  const wsPort = getMqttWsPort();
  const origin = originator || 'CAdmin';

  let toPath = path;
  if (toPath.startsWith('/')) toPath = toPath.substring(1);

  // HTTP와 동일한 rcn/fc 처리
  const isDiscovery = filterCriteria && filterCriteria.includes('fu=1');
  const isIndividual = !filterCriteria || filterCriteria === '';
  const hasRcn = filterCriteria && filterCriteria.includes('rcn=');

  // filterCriteria 파싱 -> fc 객체 + rcn 분리
  let fc = {};
  let rcn = undefined;
  if (filterCriteria && filterCriteria !== '') {
    filterCriteria.split('&').forEach(param => {
      const [k, v] = param.split('=');
      if (k && v !== undefined) {
        if (k === 'rcn') {
          rcn = Number(v);
        } else {
          fc[k] = isNaN(v) ? v : Number(v);
        }
      }
    });
  }

  // 일반 retrieve에서 rcn 기본값 추가 (HTTP 동작과 동일)
  if (!isDiscovery && !isIndividual && !hasRcn) {
    rcn = 4;
  }

  console.log(`[MQTT RETRIEVE] to=${toPath}, fc=`, fc, 'rcn=', rcn);

  try {
    const result = await mqttRequest(host, wsPort, {
      op: 2,
      to: toPath,
      fr: origin,
      rvi: '2a',
      ...(Object.keys(fc).length > 0 ? { fc } : {}),
      ...(rcn !== undefined ? { rcn } : {})
    });
    console.log(`[MQTT RETRIEVE] Success:`, result);
    return result || {};
  } catch (error) {
    console.error(`[MQTT RETRIEVE] Failed:`, error);
    throw error;
  }
}

// ═══ DELETE ═══
async function delete_resource(originator, protocol, host, port, resourcePath) {
  if (getProtocolMode() === 'mqtt') {
    return mqtt_delete(originator, host, port, resourcePath);
  }
  return http_resource_delete_fn(originator, protocol, host, port, resourcePath);
}

async function mqtt_delete(originator, host, _port, resourcePath) {
  const wsPort = getMqttWsPort();
  const origin = originator || 'CAdmin';

  let toPath = (resourcePath || '').replace(/\/+/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');

  console.log(`[DELETE:MQTT] to=${toPath}`);

  try {
    const result = await mqttRequest(host, wsPort, {
      op: 4,
      to: toPath,
      fr: origin,
      rvi: '2a'
    });
    console.log(`[DELETE:MQTT] Success:`, result);
    return result;
  } catch (error) {
    console.error(`[DELETE:MQTT] Failed:`, error);
    throw error;
  }
}

// ═══ CSE RETRIEVE ═══
async function cse_retrieve(originator, host, port, path, callback) {
  if (getProtocolMode() === 'mqtt') {
    try {
      const data = await mqtt_cse_retrieve(originator, host, port, path);
      callback(data);
    } catch (error) {
      console.error('[MQTT CSE RETRIEVE] Failed:', error);
      throw error;
    }
    return;
  }
  return http_cse_retrieve_fn(originator, host, port, path, callback);
}

async function mqtt_cse_retrieve(originator, host, _port, path) {
  const wsPort = getMqttWsPort();
  const origin = originator || 'CAdmin';

  let toPath = path;
  if (toPath.startsWith('/')) toPath = toPath.substring(1);

  console.log(`[MQTT CSE RETRIEVE] to=${toPath}`);

  const result = await mqttRequest(host, wsPort, {
    op: 2,
    to: toPath,
    fr: origin,
    rvi: '2a'
  });
  console.log(`[MQTT CSE RETRIEVE] Success:`, result);
  return result;
}

export { create_resource, retrieve_resource, delete_resource, cse_retrieve };
