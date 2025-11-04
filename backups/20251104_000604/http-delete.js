import axios from 'axios';

axios.defaults.withCredentials = false;

async function http_resource_delete(originator, protocol, host, port, resourcePath) {
  const sanitizedProtocol = protocol.endsWith(':') ? protocol.slice(0, -1) : protocol;
  const baseUrl = `${sanitizedProtocol}://${host}:${port}`;
  const normalizedPath = resourcePath.replace(/^\/+/, '');
  const url = normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;

  const headers = {
    'X-M2M-Origin': originator,
    'X-M2M-RI': Date.now().toString(),
    'X-M2M-RVI': '2a',
    Accept: 'application/json'
  };

  const response = await axios.delete(url, {
    headers,
    withCredentials: false
  });

  return response.data;
}

export default http_resource_delete;
