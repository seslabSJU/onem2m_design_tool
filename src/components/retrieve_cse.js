import axios from 'axios';

axios.defaults.withCredentials = false;

async function http_cse_retrieve(originator, host, port, path, callback)
{

    const url = `http://${host}:${port}/${path}`;

    console.log("%%%%%url, origin", url, originator);

    // localStorage에서 헤더 설정값 읽기 (톱니바퀴 설정 패널)
    let resHeaders = {};
    try { resHeaders = JSON.parse(localStorage.getItem('resourceHeaders') || '{}'); } catch (e) {}
    const h = resHeaders['cse'] || {};

    const headers = {
        "X-M2M-Origin": h.origin || localStorage.getItem('originator') || originator,
        "X-M2M-RVI" : h.rvi || "2a",
        "X-M2M-RI" : h.ri || Date.now().toString(),
        "Accept" : h.accept || "application/json"
    }
    // console.log(headers);
   // operation code RETRIEVE 2
    try {
        const response = await axios.get(url, {
          headers: headers,
          withCredentials: false,
        });
        console.log(headers)
        console.log(`[CSE data Retrieved]`)
        console.log(response);
        // return response.data;
        callback(response.data);
      } catch (error) {
        console.log(`[CSE data Retrieve Failed]`)
        //console.log(url);
        throw error;
      }

    
}

export default http_cse_retrieve;