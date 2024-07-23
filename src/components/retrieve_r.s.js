import axios from 'axios';

axios.defaults.withCredentials = false;

async function http_resource_retrieve(originator, host, port, path, filterCriteria) {
  const baseUrl = `http://${host}:${port}/`;
  const initialUrl = `${baseUrl}${path}?rcn=4&${filterCriteria}`;
  const headers = {
    'X-M2M-Origin': "CAdmin",
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-M2M-RVI': '1.0'
  };

  try {
    
    const initialResponse = await axios.get(initialUrl, { headers });
    console.log('Initial discovered data:', initialResponse.data);

    if (initialResponse.data) {
      const allData = initialResponse.data;  
      return allData;  
    }
    return {}; 
  } catch (error) {
    console.error('Error during initial resource discovery:', error);
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


