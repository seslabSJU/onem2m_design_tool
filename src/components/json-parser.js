// async function json_parser(data)
// {
//     // 웹에서 전달받은 json파일 파싱 및 resource_create함수에 전달
// }
//const fs = require('fs'); // Node.js의 파일 시스템 모듈을 불러옵니다.
// 로컬 JSON 파일의 경로 (여기서는 예시 파일 경로입니다. 실제 파일 경로로 변경해야 합니다.)
// import fs from 'fs';
import { create_resource, update_resource } from "@/components/protocol-dispatcher.js";
//const jsonFilePath = "./storagedata.json"//local json file path;
// export let resource = {};

// JSON 파일을 읽어오는 함수
//function readJSONFile(filePath)

export function readJSONFile() {
    try {
        console.log('파일읽는중')
        //const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        var jsonData = resource;
        return jsonData;
    } catch (error) {
        console.error('Unable to Read JSON file : ', error);
        return null;
    }
}


export function attribute_check(resource, currentNode ,attribute_list, path, targetIP)
{
  //console.log("---------");
  //console.log(currentNode);
  for (const key of attribute_list) 
  {
    if (currentNode.hasOwnProperty(key)) 
    {
      resource[key] = currentNode[key];
    }
    if (currentNode["attrs"].hasOwnProperty(key)) 
    { 
    // console.log("!!", key, currentNode["attrs"][key]);
      resource[key] = currentNode["attrs"][key];//JSON.parse(JSON.stringify(currentNode[key]));
      if (key == "cr")
      {
        if (resource[key] == true)
        {
          resource[key] = null;
        }
        else
        {
          delete resource[key];
        }
      }
      // pv/pvs: 배열이면 {acr: [...]} 형태로 감싸기 (oneM2M 표준)
      if ((key == "pv" || key == "pvs") && Array.isArray(resource[key]))
      {
        resource[key] = { acr: resource[key] };
      }
      //console.log(currentNode[key]);
      //resource[]
    }
  }
  //console.log(resource);
  return resource;

  //console.log("---------");
  
  // for key:value check
  // const entries = Object.entries(resource);
  // for (const [key, value] of entries) {
  //   console.log(key + ": " + value);
  // }

  // return resource;
}

export async function make_request_resource(currentNode, path, targetIP, originator)
{
  //ty, rn + resource 형성, http-request에 데이터 전송
  //ty에 따라서 호출해야하는 함수가 다름.. 

  const attributeMap = {
    1:  ['ty', 'rn', 'ri', 'pi', 'ct', 'lt', 'lbl', 'acpi', 'et', 'st', 'cr', 'pv', 'pvs'],           // ACP
    2:  ['ty', 'rn', 'lbl', 'at', 'aa', 'ast', 'acpi', 'api', 'rr', 'srv', 'poa'],                      // AE
    3:  ['ty', 'rn', 'lbl', 'acpi', 'at', 'aa', 'cr', 'mni', 'mbs', 'mia'],                              // CNT
    4:  ['ty', 'rn', 'lbl', 'con', 'or'],                                                                  // CIN
    9:  ['ty', 'rn', 'lbl', 'macp', 'at', 'aa', 'ast', 'cr', 'csy', 'gn', 'mt', 'mnm', 'mid', 'macpi'], // GRP
    23: ['ty', 'rn', 'lbl', 'cr', 'acpi', 'enc', 'nu', 'su', 'nec', 'ln', 'nct', 'exc'],                 // SUB
    28: ['ty', 'rn', 'lbl', 'acpi', 'cnd', 'or', 'cr', 'mni', 'mbs', 'mia', 'fcied'],                     // FCNT
    58: ['ty', 'rn', 'lbl', 'con', 'cs'],                                                                  // FCIN
    29: ['ty', 'rn', 'lbl', 'acpi', 'cr', 'mni', 'mbs', 'pei', 'peid', 'mdd', 'mdn', 'mdt', 'mdc', 'mdlt', 'cnf'], // TS
    30: ['ty', 'rn', 'lbl', 'con', 'dgt', 'snr'],                                                          // TSI
  };

  var resource = {};
  const attrList = attributeMap[currentNode.ty];
  if (attrList) {
    resource = attribute_check(resource, currentNode, attrList, path, targetIP);
  }

  // FCNT/FCIN: 스키마에 없는 SDT 커스텀 속성도 body에 포함
  if (currentNode.ty == 28 || currentNode.ty == 58) {
    const knownKeys = new Set(attrList || []);
    Object.entries(currentNode.attrs || {}).forEach(([key, val]) => {
      if (!knownKeys.has(key) && key !== 'ri' && key !== 'ct' && key !== 'lt' && key !== 'pi' && key !== 'et' && key !== 'st') {
        resource[key] = val;
      }
    });
  }

  // 빈 값('', null, undefined)은 요청에서 제외 — 서버 기본값 사용
  Object.keys(resource).forEach(key => {
    if (resource[key] === '' || resource[key] === null || resource[key] === undefined) {
      delete resource[key];
    }
  });

  try {
    const response = await create_resource(resource, path, targetIP);

    // 성공적으로 생성되면 플래그 설정
    currentNode.createdOnServer = true;
    console.log("[CREATE] Resource created:", currentNode.attrs.rn);

    // 서버 응답에서 ri (Resource ID) 추출하여 저장
    if (response) {
      // oneM2M 응답 형식: m2m:ae, m2m:cnt, m2m:cin 등
      const resourceKey = Object.keys(response).find(key => key.startsWith('m2m:'));
      if (resourceKey && response[resourceKey]) {
        const ri = response[resourceKey].ri;
        if (ri) {
          currentNode.attrs.ri = ri;
          console.log("[CREATE] Saved RI:", ri);
        }
      }
    }
  } catch (error) {
    console.error("[CREATE] Failed to create resource:", error);
    throw error;
  }

  return resource
}

export async function make_update_request(currentNode, path, targetIP)
{
  // UPDATE용: make_request_resource와 유사하되 읽기전용 속성 제거
  // TinyIoT 서버 invalid_key와 일치: ty, pi, ri, rn, ct, cr, cnd, cs, st, cni, cbs
  const readOnlyAttrs = ['ty', 'rn', 'ri', 'ct', 'lt', 'pi', 'et', 'st', 'cni', 'cbs', 'cnd', 'cr', 'cs'];

  const attributeMap = {
    1:  ['ty', 'rn', 'ri', 'pi', 'ct', 'lt', 'lbl', 'acpi', 'et', 'st', 'cr', 'pv', 'pvs'],           // ACP
    2:  ['ty', 'rn', 'lbl', 'at', 'aa', 'ast', 'acpi', 'api', 'rr', 'srv', 'poa'],                      // AE
    3:  ['ty', 'rn', 'lbl', 'acpi', 'at', 'aa', 'cr', 'mni', 'mbs', 'mia'],                              // CNT
    9:  ['ty', 'rn', 'lbl', 'macp', 'at', 'aa', 'ast', 'cr', 'csy', 'gn', 'mt', 'mnm', 'mid', 'macpi'], // GRP
    23: ['ty', 'rn', 'lbl', 'cr', 'acpi', 'enc', 'nu', 'su', 'nec', 'ln', 'nct', 'exc'],                 // SUB
    28: ['ty', 'rn', 'lbl', 'acpi', 'cnd', 'or', 'cr', 'mni', 'mbs', 'mia', 'fcied'],                     // FCNT
    29: ['ty', 'rn', 'lbl', 'acpi', 'cr', 'mni', 'mbs', 'pei', 'peid', 'mdd', 'mdn', 'mdt', 'mdc', 'mdlt', 'cnf'], // TS
  };

  var resource = {};
  const attrList = attributeMap[currentNode.ty];
  if (attrList) {
    resource = attribute_check(resource, currentNode, attrList, path, targetIP);
  }

  // FCNT: 스키마에 없는 SDT 커스텀 속성도 body에 포함
  if (currentNode.ty == 28) {
    const knownKeys = new Set(attrList || []);
    Object.entries(currentNode.attrs || {}).forEach(([key, val]) => {
      if (!knownKeys.has(key) && !readOnlyAttrs.includes(key)) {
        resource[key] = val;
      }
    });
  }

  // 빈 값('', null, undefined)은 요청에서 제외 — 서버 기본값 사용
  Object.keys(resource).forEach(key => {
    if (resource[key] === '' || resource[key] === null || resource[key] === undefined) {
      delete resource[key];
    }
  });

  // cnd는 body key 생성에 필요하므로 별도 보관 후 제거
  const cnd = resource['cnd'];

  // 읽기전용 속성 제거
  for (const roAttr of readOnlyAttrs) {
    delete resource[roAttr];
  }

  // ty는 라우팅에, cnd는 body key 생성에 필요하므로 다시 추가
  resource['ty'] = currentNode.ty;
  if (cnd) resource['_cnd'] = cnd; // http-update.js에서 body key 생성 후 제거

  console.log("[UPDATE] Sending UPDATE for:", currentNode.attrs.rn, "path:", path, "body:", JSON.stringify(resource));

  try {
    const response = await update_resource(resource, path, targetIP);
    console.log("[UPDATE] Resource updated OK:", currentNode.attrs.rn, response);
  } catch (error) {
    console.error("[UPDATE] Failed to update resource:", currentNode.attrs.rn, error?.response?.data || error?.message || error);
    // throw하지 않음 — BFS가 다른 리소스도 계속 처리하도록
  }

  return resource;
}

export async function bfs_json(jsonData, targetIP)
{
  console.log(jsonData);
  let resource_req_que = [];
  const queue = [[jsonData, ""]]; // 노드와 부모 노드 정보를 함께 저장
  let rn_list = "";

  while (queue.length > 0)
  {
    const [currentNode, parentRn] = queue.shift(); // 현재 노드와 부모 노드 정보 추출
    if (Array.isArray(currentNode)) {
      for (const item of currentNode) {
        queue.push([item, parentRn]); // 부모 노드 정보를 그대로 전달
      }
    } else if (currentNode !== null && typeof currentNode === 'object') {
      if (currentNode.hasOwnProperty("name") && currentNode.hasOwnProperty("ty"))
      {
        console.log("now bfs location : ", currentNode);
        rn_list = parentRn + "/" + currentNode.attrs.rn; // 부모 노드 정보와 현재 노드의 rn 조합

        // SKIP 대상: 인스턴스(CIN=4, FCIN=58, TSI=30)는 불변, CSE(ty=5)는 UPDATE 대상 아님
        const skipTypes = [4, 58, 30, 5];
        console.log(`[BFS] node: ${currentNode.attrs.rn} ty=${currentNode.ty} createdOnServer=${currentNode.createdOnServer} modified=${currentNode.modified}`);
        if (skipTypes.includes(currentNode.ty) && (currentNode.createdOnServer || currentNode.ty === 5)) {
          console.log("[SKIP] ty=" + currentNode.ty + ":", currentNode.attrs.rn);
        } else if (!currentNode.createdOnServer) {
          // CREATE: 서버에 아직 없는 리소스
          resource_req_que.push(await make_request_resource(currentNode, rn_list, targetIP));
        } else if (currentNode.createdOnServer === true && currentNode.modified === true) {
          // UPDATE: 서버에 이미 존재하고 속성이 변경된 리소스만 → PUT
          try {
            resource_req_que.push(await make_update_request(currentNode, rn_list, targetIP));
            currentNode.modified = false; // UPDATE 성공 시 플래그 해제
          } catch (error) {
            console.error("[BFS] UPDATE failed, continuing:", currentNode.attrs.rn, error);
          }
        } else {
          console.log("[BFS] No action for:", currentNode.attrs.rn);
        }
      }

      for (const key in currentNode) {
        if (Array.isArray(currentNode[key]) || typeof currentNode[key] === 'object') {
          queue.push([currentNode[key], rn_list]); // 부모 노드 정보를 그대로 전달
        }
      }
    }
  }

  return resource_req_que;
}

// export function bfs_json(jsonData, targetIP) {
//   console.log(jsonData);
//   let resource_req_que = []; 
//   const queue = [[jsonData, ""]]; // 노드와 부모 노드 정보를 함께 저장
//   let rn_list = "";

//   while (queue.length > 0) {
//     const [currentNode, parentRn] = queue.shift(); // 현재 노드와 부모 노드 정보 추출

//     if (Array.isArray(currentNode)) {
//       for (const item of currentNode) {
//         queue.push([item, parentRn]); // 부모 노드 정보를 그대로 전달
//       }
//     } else if (typeof currentNode === 'object') 
//     {
//       if (currentNode.hasOwnProperty("name") && currentNode.hasOwnProperty("ty")) 
//       {
//         // if (currentNode.hasOwnProperty("id")) 
//         // {
//           rn_list = parentRn + "/" + currentNode.attrs.rn; // 부모 노드 정보와 현재 노드의 rn 조합
//           // console.log(rn_list);
//         // }
//         resource_req_que.push(make_request_resource(currentNode, rn_list, targetIP)); // 부모 노드 정보 전달
//        }

//       for (const key in currentNode) {
//         if (Array.isArray(currentNode[key]) || typeof currentNode[key] === 'object') {
//           queue.push([currentNode[key], rn_list]); // 부모 노드 정보를 그대로 전달
//         }
//       }
//     }
//   }

//   return resource_req_que;
// }



// get_jsonfile 함수 내에서 서버 응답 분석 및 실패 처리
export async function get_jsonfile(json_data, targetIP) {
  try {
    const response = await bfs_json(json_data, targetIP);
    if (response.status >= 400) { // 가정: 실패 응답 처리
      return Promise.reject(new Error(response.errorMessage || "Tree creation failed"));
    }
    console.log("bfs_json success", response);
    return Promise.resolve(response);
  } catch (error) {
    console.error("bfs_json failed", error);
    return Promise.reject(error);
  }
}


export default get_jsonfile;


// export default {
//   //resource,
//   get_jsonfile,
//   bfs_json,
//   make_request_resource,
//   attribute_check,
//   readJSONFile,
// }


// const originator = Headers;

/*async function create_ae(url, rn, attrs) {
  const headers = {
    'X-M2M-Origin' : originator, // 요청자 ID
    'Content-Type' : 'application/json;ty=2',
    'Cache-Control' : 'no-cache',
  };

  const body = {
    "m2m:ae" : {
      "rn" : rn,
      "api" : api,
      "lbl" : [lbl],
      "rr" : true,
      "aei" : originator
    }
  };

  try {
    const response = await axios.post(url, body, { headers: headers });
    console.log(`[AE ${rn} created]`, response.data); // 생성 성공 로그
    return response.data;
  } catch (error) {
    console.error(`[AE ${rn} creation failed]`, error); // 생성 실패 로그
    throw error;
  }
 
}
*/