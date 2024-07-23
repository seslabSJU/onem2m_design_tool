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

  var attribute_list = [];
  if (attr["ty"] == 1)
  {
    attribute_list = acp_header;
    attr_list["type"] = "acp";
  }
  else if (attr["ty"] == 2)
  {
    attribute_list = ae_header;
    attr_list["type"] = "ae";
  }
  else if (attr["ty"] == 3)
  {
    attribute_list = cnt_header;
    attr_list["type"] = "cnt";
  }
  else if (attr["ty"] == 9)
  {
    attribute_list = grp_header;
    attr_list["type"] = "grp";
  }
  else
  {
    attribute_list = sub_header;
    attr_list["type"] = "sub";
  }

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
  
  // setAttrs에서 입력받은 originator를 originator로 셋팅
  const originator = localStorage.getItem('originator');
  console.log(`Received originator: ${originator}`); 


  // console.log(path);
  // console.log("create_resource : ", targetIP); 
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
 

    
    let headers = {
        'X-M2M-Origin': originator, // originator가 계속 변하게 하려면, 하드 코딩 하듯이 해야하는데
        "Accept" : "application/json",
        'Content-Type': `application/json;ty=${attrs["header"]["ty"]}`,
        // 'Cache-Control': 'no-cache',
        // 'Access-Control-Allow-Origin' : '*',
        "X-M2M-RVI" : "3",
        "X-M2M-RI" : 12345
    }

  


    var body_attr = {}

    if (now_type == "acp")
    {
      body_attr = {"m2m:acp" : attrs["body"]}
    }

    else if (now_type == "ae")
    {
      body_attr = {
        "m2m:ae" : attrs["body"],
        // "originator" : "Coriginertest",
      } // 수정한 부분
    }
    else if (now_type == "cnt")
    {
      body_attr = {"m2m:cnt" : attrs["body"]}
    }

    else if (now_type == "grp")
    {
      body_attr = {"m2m:grp" : attrs["body"]}
    }
    else if (now_type == "sub")
    {
      body_attr = {"m2m:sub" : attrs["body"]}
    }
    else
    {
      return;
    }

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
