import axios from 'axios';

axios.defaults.withCredentials = false;

/**
 * Update oneM2M resource via HTTP PUT
 * @param {object} attr - Resource attributes (already filtered, no read-only attrs)
 * @param {string} path - Full resource path (e.g., "/myAE/myCNT")
 * @param {string} targetIP - Base URL (e.g., "http://host:port/TinyIoT")
 * @returns {Promise<any>} Response data
 */
async function http_update_resource(attr, path, targetIP) {
  // targetIP에서 마지막 세그먼트 제거 (CSE base)
  targetIP = targetIP.replace(/\/[^/]*$/, '');
  // UPDATE는 리소스 자체 경로에 PUT (path 전체 사용, 마지막 세그먼트 제거 안 함)
  const url = `${targetIP}${path}`;
  console.log("[UPDATE] request url:", url);

  // select_resource 로직: header/body 분리
  const headerAttrs = ['ty', 'rvi'];
  const typeMap = { 1: 'acp', 2: 'ae', 3: 'cnt', 4: 'cin', 9: 'grp', 23: 'sub', 28: 'fcnt', 58: 'fcin', 29: 'ts', 30: 'tsi' };
  const nowType = typeMap[attr['ty']] || 'unknown';

  if (nowType === 'unknown') {
    console.error('[UPDATE] Unknown resource type:', attr['ty']);
    return;
  }

  // body 구성 (헤더 속성 제외)
  const bodyAttrs = {};
  for (const key in attr) {
    if (attr.hasOwnProperty(key) && !headerAttrs.includes(key)) {
      bodyAttrs[key] = attr[key];
    }
  }

  // SUB: net -> enc.net 래핑
  if (nowType === 'sub' && bodyAttrs['net']) {
    bodyAttrs['enc'] = { 'net': bodyAttrs['net'] };
    delete bodyAttrs['net'];
  }

  // FCNT: _cnd(json-parser에서 전달) 또는 cnd 기반 body key
  let bodyKey;
  const cndValue = bodyAttrs['_cnd'] || bodyAttrs['cnd'];
  if (nowType === 'fcnt' && cndValue) {
    const cndParts = cndValue.split('.');
    const shortName = cndParts[cndParts.length - 1];
    const abbr = shortName.length > 5 ? shortName.substring(0, 5) : shortName;
    bodyKey = `cod:${abbr}`;
  } else {
    bodyKey = `m2m:${nowType}`;
  }
  // cnd, _cnd는 body key 생성용이므로 body에서 제거 (서버에서 읽기전용)
  delete bodyAttrs['cnd'];
  delete bodyAttrs['_cnd'];

  const bodyAttr = { [bodyKey]: bodyAttrs };

  // localStorage에서 리소스별 헤더 설정값 읽기
  const ty = attr['ty'];
  let resHeaders = {};
  try { resHeaders = JSON.parse(localStorage.getItem('resourceHeaders') || '{}'); } catch (e) {}
  const h = resHeaders[ty] || {};

  const origin = h.origin || localStorage.getItem('originator') || 'CAdmin';
  const rvi = h.rvi || '2a';
  const ri = h.ri || '12345';
  const accept = h.accept || 'application/json';

  // UPDATE는 Content-Type에 ty= 파라미터 없음
  const headers = {
    'X-M2M-Origin': origin,
    'Accept': accept,
    'Content-Type': 'application/json',
    'X-M2M-RVI': rvi,
    'X-M2M-RI': ri
  };

  console.log("[UPDATE] headers:", headers);
  console.log("[UPDATE] body:", bodyAttr);

  try {
    const response = await axios.put(url, bodyAttr, {
      headers,
      withCredentials: false,
      timeout: 5000
    });

    console.log(`[UPDATE] ${nowType} updated successfully`);
    console.log(response.data);
    alert(`Resource of type ${nowType} updated successfully!`);
    return response.data;

  } catch (error) {
    const dbgMsg = error?.response?.data?.['m2m:dbg'];
    console.error(`[UPDATE] ${nowType} update failed:`, error);
    alert(`Error: ${dbgMsg || error?.response?.statusText || error.message}`);
    throw error;
  }
}

export default http_update_resource;
