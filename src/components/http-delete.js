import axios from 'axios';

axios.defaults.withCredentials = false;

/**
 * Delete oneM2M resource via HTTP DELETE
 * @param {string} originator - X-M2M-Origin header value (e.g., "CAdmin")
 * @param {string} protocol - Protocol (http or https)
 * @param {string} host - Server hostname or IP
 * @param {string} port - Server port
 * @param {string} resourcePath - Resource path (e.g., "TinyIoT/ae1/cnt1")
 * @returns {Promise<any>} Response data
 */
async function http_resource_delete(originator, protocol, host, port, resourcePath) {
  // Sanitize protocol (remove trailing colon if present)
  const sanitizedProtocol = protocol.endsWith(':') ? protocol.slice(0, -1) : protocol;

  // Normalize resource path (remove leading/trailing slashes, collapse multiple slashes)
  const normalizedPath = (resourcePath || '')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  // Build full URL
  const url = `${sanitizedProtocol}://${host}:${port}/${normalizedPath}`;

  // Prepare oneM2M headers
  const effectiveOriginator = (originator ?? '').toString().trim() || 'CAdmin';
  const headers = {
    'X-M2M-Origin': effectiveOriginator,
    'X-M2M-RI': Date.now().toString(),
    'X-M2M-RVI': '2a',
    'Accept': 'application/json'
  };

  console.log(`[DELETE] ${url} (Origin: ${effectiveOriginator})`);

  try {
    const response = await axios.delete(url, {
      headers,
      withCredentials: false,
      timeout: 5000
    });

    // Success: status 200, 202, 204
    console.log(`[DELETE] Success -> ${response.status}`);
    return response.data;

  } catch (error) {
    // Extract oneM2M error message if available
    const rsc = error?.response?.headers?.['x-m2m-rsc'] || error?.response?.headers?.['X-M2M-RSC'];
    const dbgMsg = error?.response?.data?.['m2m:dbg'];

    if (dbgMsg) {
      error.message = dbgMsg;
    }

    console.error(`[DELETE] Failed -> ${error?.response?.status || 'network error'} RSC=${rsc} ${dbgMsg || ''}`);
    throw error;
  }
}

export default http_resource_delete;
