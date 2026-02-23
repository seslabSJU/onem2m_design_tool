// axios 라이브러리를 사용하여 서버에 POST 요청을 보내어 리소스를 생성
import axios from 'axios';
import {server_info, resource}  from './config.js';
//axios.defaults.baseURL = 'hello/';
//import slave from './app.js'
axios.defaults.withCredentials = false;


// 비동기 작업에서 일정 시간 대기하는 기능, 주어진 초가 지나면 다음 함수를 실행
function sleep(ms) { 
  return new Promise(resolve => setTimeout(resolve, ms));
}

// IoT 환경에서 리소스 유형에 따라 적절한 헤더와 바디를 구성
// attr 매개변수를 통해 전달받은 리소스의 속성을 기반으로 리소스 유형과 필요한 헤더, 바디를 분류하여 리턴
async function select_resource(attr)
{
  // console.log(attr);

  const attr_list = {
    "header" : {},
    "body" : {},
    "type" : ""
  };

  const ae_header = ["ty"];
  const cnt_header = ["ty"];
  const grp_header = ["ty"];
  const acp_header = ["ty"];
  const sub_header = ["ty"];

  var attribute_list = ["ty", "rvi"];
  const typeMap = { 1: "acp", 2: "ae", 3: "cnt", 4: "cin", 9: "grp", 23: "sub", 28: "fcnt", 58: "fcin" };
  attr_list["type"] = typeMap[attr["ty"]] || "unknown";

  // console.log("att list check");
  // console.log(attribute_list);

  for (var key in attr)
  {
    if (attr.hasOwnProperty(key))
    {
      if (attribute_list.includes(key))
      {
        attr_list["header"][key] = attr[key]; 
      }
      else{
        attr_list["body"][key] = attr[key] 
      }
    }
  }
  // console.log("!",attr_list);
  return attr_list;
}




// 실제로 서버에 리소스를 생성하기 위한 POST 요청을 보내는 함수
async function create_resource(attr, path, targetIP)
{ 
  
  targetIP = targetIP.replace(/\/[^/]*$/, '');
  let result = path.replace(/\/[^/]*$/, '');
    const url = `${targetIP}${result}`;
    console.log("now request url", url);
    var attrs = {};

    attrs = await select_resource(attr);
    var now_type = attrs["type"];

    // localStorage에서 리소스별 헤더 설정값 읽기
    const ty = attrs["header"]["ty"];
    let resHeaders = {};
    try { resHeaders = JSON.parse(localStorage.getItem('resourceHeaders') || '{}'); } catch (e) {}
    const h = resHeaders[ty] || {};

    const origin = h.origin || localStorage.getItem('originator') || 'CAdmin';
    const rvi = h.rvi || '2a';
    const ri = h.ri || '12345';
    const accept = h.accept || 'application/json';

    let headers = {
        'X-M2M-Origin': origin,
        'Accept': accept,
        'Content-Type': `application/json;ty=${ty}`,
        'X-M2M-RVI': rvi,
        'X-M2M-RI': ri
    }

    console.log(`Received originator: ${origin}`);

  


    var body_attr = {}

    if (now_type === "unknown") {
      console.error("Unknown resource type:", attrs["header"]["ty"]);
      return;
    }

    // FCNT: cnd 기반 body 키 사용 (예: org.onem2m.common.moduleclass.temperature → cod:tempe)
    let bodyKey;
    if (now_type === "fcnt" && attrs["body"]["cnd"]) {
      const cndParts = attrs["body"]["cnd"].split(".");
      const shortName = cndParts[cndParts.length - 1];
      // oneM2M SDT 약어: temperature→tempe, binarySwitch→binSh 등 (5글자로 축약)
      const abbr = shortName.length > 5 ? shortName.substring(0, 5) : shortName;
      bodyKey = `cod:${abbr}`;
    } else {
      bodyKey = `m2m:${now_type}`;
    }
    // SUB: net 속성을 enc.net으로 감싸기 (oneM2M 명세 구조)
    if (now_type === "sub" && attrs["body"]["net"]) {
      attrs["body"]["enc"] = { "net": attrs["body"]["net"] };
      delete attrs["body"]["net"];
    }

    body_attr = { [bodyKey]: attrs["body"] };

    console.log("body attrs", body_attr);
    
    // await sleep(1000);
    console.log("header :", headers);
    console.log("body :", body_attr);


    try {
        const response = await axios.post(url, body_attr, {
          headers: headers,
          withCredentials: false,
        });

        console.log ("header: ", headers);
        console.log ("body : ", body_attr);


        console.log(`[${now_type} created]`);
        console.log(response.data);

        alert(`Resource of type ${now_type} created successfully!`);


        return response.data;

      } catch (error) {
        console.log(`[${now_type} creation failed]`);
        console.log(error);

        // alert(`Failed to create resource of type ${now_type}.\nError: ${error.message}`);
        alert(`Error: ${error.response.data['m2m:dbg'] || error.response.statusText}`);
        
        //console.log(url);
        throw error;
      }
}

export default create_resource;





/*async function create_cnt(url, rn, attrs)
{ 
    url = url + "/" + rn;
    headers = {
        'X-M2M-Origin': tool_id, //tool에서 설정해야됨
        'Content-Type': 'application/json;ty=3',
        'Cache-Control': 'no-cache',
    }
    body = {
        "m2m:cnt" : {
            "rn" : rn
        } 
    }
    try {
        const response = await axios.post(url, body, {
          headers: headers,
        });
        return response.data;
      } catch (error) {
        throw error;
      }
}

async function create_grp(url, rn, attrs)
{ 
    headers = {
        'X-M2M-Origin': tool_id, //tool에서 설정해야됨
        'Content-Type': 'application/json;ty=2',
        'Cache-Control': 'no-cache',
    }
    body = {
        'm2m:grp': {
            'api': api,
            'rn': rn,
            'rr': true
        }
    }

    try {
        const response = await axios.post(url, body, {
          headers: headers,
        });
        console.log(`[GRP ${rn} created]`)
        return response.data;
      } catch (error) {
        console.log(`[GRP ${rn} creation failed]`)
        throw error;
      }
}

async function create_sub(url, rn, attrs)
{ 
    headers = {
        'X-M2M-Origin': tool_id, //tool에서 설정해야됨
        'Content-Type': 'application/json;ty=2',
        'Cache-Control': 'no-cache',
    }
    body = {
        'm2m:sub': {
            'api': api,
            'rn': rn,
            'rr': true
        }
    }

    try {
        const response = await axios.post(url, body, {
          headers: headers,
        });
        console.log(`[SUB ${ae_name} created]`)
        return response.data;
      } catch (error) {
        console.log(`[SUB ${ae_name} creation failed]`)
        throw error;
      }
}

async function create_acp(url, rn, attrs)
{ 
    headers = {
        'X-M2M-Origin': tool_id, //tool에서 설정해야됨
        'Content-Type': 'application/json;ty=2',
        'Cache-Control': 'no-cache',
    }
    body = {
        'm2m:acp': {
        }
    }

    try {
        const response = await axios.post(url, body, {
          headers: headers,
        });
        console.log(`[ACP ${ae_name} created]`)
        return response.data;
      } catch (error) {
        console.log(`[ACP ${ae_name} creation failed]`)
        throw error;
      }
}
*/ 



async function create_ae(attrs ,path, targetIP, originator) {

  targetIP = targetIP.replace(/\/[^/]*$/, ''); 
  let result = path.replace(/\/[^/]*$/, '');
  // console.log("path : ", result);
    // console.log("hello im free");
    const url = `${targetIP}${result}`;
    console.log("now request url", url);
    var attrs = {};

    attrs = await select_resource(attr);
    var now_type = attrs["type"];
    // var resource_type = `m2m:${now_type}`;
    // console.log("------");
    // console.log(select_resource(attr));
    // console.log("------");
 

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
