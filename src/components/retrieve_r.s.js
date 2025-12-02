import axios from 'axios';

axios.defaults.withCredentials = false;

/**
 * Retrieve oneM2M resources from server
 * @param {string} originator - X-M2M-Origin value
 * @param {string} host - Server host
 * @param {string} port - Server port
 * @param {string} path - Resource path
 * @param {string} filterCriteria - Additional filter criteria (optional)
 * @returns {Promise<object>} Retrieved resource data
 */
async function http_resource_retrieve(originator, host, port, path, filterCriteria) {
  const baseUrl = `http://${host}:${port}/`;

  // Discovery 요청인지 확인 (fu=1이 있으면 discovery)
  const isDiscovery = filterCriteria && filterCriteria.includes('fu=1');

  // 개별 리소스 조회인지 확인 (filterCriteria가 없거나 빈 문자열)
  const isIndividualRetrieve = !filterCriteria || filterCriteria === '';

  // rcn이 이미 포함되어 있는지 확인
  const hasRcn = filterCriteria && filterCriteria.includes('rcn=');

  let initialUrl;
  if (isDiscovery) {
    // Discovery 요청에는 rcn을 추가하지 않음
    initialUrl = `${baseUrl}${path}?${filterCriteria}`;
    console.log(`[RETRIEVE] Discovery request: ${initialUrl}`);
  } else if (isIndividualRetrieve) {
    // 개별 리소스 조회는 rcn 없이 (속성만 반환)
    initialUrl = `${baseUrl}${path}`;
    console.log(`[RETRIEVE] Individual retrieve: ${initialUrl}`);
  } else if (hasRcn) {
    // rcn이 이미 포함되어 있으면 그대로 사용
    initialUrl = `${baseUrl}${path}?${filterCriteria}`;
    console.log(`[RETRIEVE] Retrieve with specified rcn: ${initialUrl}`);
  } else {
    // 일반 retrieve 요청에는 rcn=4 추가 (한 레벨 자식만)
    const rcnParam = 'rcn=4';
    const filterParam = filterCriteria ? `&${filterCriteria}` : '';
    initialUrl = `${baseUrl}${path}?${rcnParam}${filterParam}`;
    console.log(`[RETRIEVE] Retrieve with children: ${initialUrl}`);
  }

  const headers = {
    'X-M2M-Origin': originator || "CAdmin",
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-M2M-RVI': '2a'
  };

  console.log(`[RETRIEVE] URL: ${initialUrl}`);

  try {
    const startTime = performance.now();
    const initialResponse = await axios.get(initialUrl, {
      headers,
      timeout: 10000 // 10초 타임아웃 (손상된 리소스에서 무한 대기 방지)
    });
    const endTime = performance.now();

    console.log(`[RETRIEVE] ✅ Success in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('[RETRIEVE] Data:', initialResponse.data);

    if (initialResponse.data) {
      return initialResponse.data;
    }
    return {};
  } catch (error) {
    console.error('[RETRIEVE] ❌ Failed:', error);
    console.error('[RETRIEVE] URL:', initialUrl);
    if (error.response) {
      console.error('[RETRIEVE] Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

export default http_resource_retrieve;







class RemoteCSE {
    constructor(targetIP, originator) {
      this.targetIP = targetIP;
      this.originator = originator;
      console.log("Remote CSE initialized with IP:", targetIP);
    }

    parseUrl(url) {
      const protocol = url.split(':')[0];
      let ip = url.split(':')[1].replace('//', '');
      let port = "";
      let path = "";
  
      if (url.split(':').length === 3) {
        port = url.split(':')[2].split('/')[0];
        path = url.split(':')[2].split('/').slice(1).join('/');
      } else {
        port = "80";
        path = url.split(':')[1].split('/').slice(1).join('/');
      }
      return { protocol, ip, port, path };
    }

    async loadResourcesFromCSE(resourceType) {
      console.log(`Loading ${resourceType} from Remote CSE:`, this.targetIP);
      if (!this.targetIP) {
        alert("Please input CSE IP address");
        return;
      }
  
      const { protocol, ip, port, path } = this.parseUrl(this.targetIP);
      console.log("Parsed URL details:", protocol, ip, port, path);
  
      if (protocol !== "http") {
        alert(protocol === "https" ? "HTTPS is not supported yet" : "Please input correct protocol");
        return;
      }
  
      const resources = await http_resource_retrieve(this.originator, ip, port, path, resourceType);
      if (resources) {
        this.fetchIndividualResources(resources);
      }
    }

    async fetchIndividualResources(resourceList) {
      for (let resource of resourceList) {
        const resourcePath = resource.split('/')[1]; // Assuming the resource format is "TinyIoT/ae_test1"
        try {
          const data = await http_resource_retrieve(this.originator, this.targetIP, "3000", resourcePath, "");
          console.log("Data for " + resource + ":", data);
        } catch (error) {
          console.error(`Error fetching data for ${resource}:`, error);
        }
      }
    }
}


