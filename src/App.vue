<template>
  <header>
    <navBar class="nav" />
  </header>
  <div class="configure">
    <div class="box" style = "borderRadius: 10px">
      <div class="key" style="color: white;">Originator</div>
      <input type="text" v-model="originator" />
    </div>
    <div class="box" style = "borderRadius: 10px">
      <div class="key" style="color: white">IP address</div>
      <input type="text" v-model="targetIP" placeholder="http://127.0.0.1:3000/TinyIoT" />
    </div>
    <div>
      <div class="btn button" @click="loadFromRemoteCSE" 
      style="border: 1px solid black; 
      background-color: #192749; 
      color: white; 
      box-shadow : 5px 5px 5px 5px #D5D5D5;
      borderRadius: 10px">CSE Load</div>
      <div class="btn button" @click="loadResources" 
      style="border: 1px solid black; 
      margin-left: 10px; 
      background-color: #192749; 
      color: white; box-shadow : 5px 5px 5px 5px #D5D5D5;
      borderRadius: 10px"> Resource load</div>
    </div>
  </div>
  <div class="body">
    <div class="canvas">
        <nestedDraggable 
          :tasks="cse1"
          style="padding-left: 0px;"
          :group="{
                    name: 'resourceTree', 
                    pull: true,
                    put: true
                  }"
          :min-height="200"
          item-key="id"
          @clicked="(element) => { 
            this.setAttributes(element); 
          }"
          @move="(evt) => { this.isDragging = true; }"
          @add="handleAdd"
          :dragoverBubble="true"
          class="dragArea resourceTree"
          ></nestedDraggable>
    </div>
  

    <div class="rightTab">
      <nestedDraggable
        class="right_dragArea resources list-items"
        style="padding-left: 0px; padding-bottom: 10px;"
        :tasks="resources"
        :group="{name:'resources', pull: 'clone', put: false}"
        item-key="id"
      ></nestedDraggable>

      <div class="trashcan">
        <draggable
        :group="{
          name: 'trashcan',
          pull: true,
          put: true,
        }"
          :list="[]"
          name="trashcan"
          class="t_dragArea"
          item-key="id"
          @change="(evt) => { 
            this.isDragging = false; 
            // console.log(evt);
            if(this.selectedElement)
              this.selectedElement.selected=false; 
            this.selectedElement = undefined; 
            this.attrSettingModified = false;

            return evt;
          }"
          >
          <template #item="item">
            <div class="">{{ item }}</div>
          </template>
        </draggable>
        <img src="@/assets/쓰레기통.png" alt="trashcan" class="trashcan-image">
      </div>

      <div class="flex-direction: column">
        <div class="btn button" style="background-color: aqua;" @click="createResourceTree">
          Create ResourceTree
        </div>
        <br /> <br /> 
        <div class="btn button" style="background-color: aquamarine;" @click="saveResourceTree">
          Export to TextFile
        </div>
        <br /> <br />
        <div class="btn button" style="background-color: lightblue; " @click="loadFile">
          Importing TextFile
        </div>
        <br /> <br />
        <mq_re :cse1="cse1"></mq_re>
      </div>
    </div>

    <div v-if="attrSetting" class="modal">
      <div class="overlay"> 
      </div>
      <div class="modalBody">
        <setAttrs 
        :element="selectedElement" 
        @modified="(status) => { this.attrSettingModified = status; }"
        @close="() => { 
          this.attrSetting = false; 
          if(this.selectedElement)
            this.selectedElement.selected=false; 
          this.selectedElement = undefined; 
          this.attrSettingModified = false;
      }"
        @save="(newElement, callback) => {
          this.attrSettingModified = false;
          Object.entries(newElement).forEach(([key, value]) => {
            if(value.value.length == 0)
            return;
          
          if(value.value == 0){
            return;
          }
          if(value.dataType === 'Number'){
            if(parseInt(value.value) != NaN && parseInt(value.value) != 0){
              this.selectedElement.attrs[key] = parseInt(value.value);
            }
            else{
              this.selectedElement.attrs[key] = value.value;
            }
          }
          else{
            this.selectedElement.attrs[key] = value.value;
          }
          callback();
        });
      }"
        @update-rn="handleUpdateRn"
        />
      </div>
    </div>
      
  </div>
  <rawDisplayer class="col-4" :value="cse1" title="List 1" />
</template>

<script>
import draggable from "vuedraggable";
import nestedDraggable from "@/components/infra/nested.vue";
import setAttrs from "@/components/setAttrs.vue";
import navBar from "@/components/navBar.vue";
import { resourceType as RT } from "./components/attributes";
import get_jsonfile from "@/components/json-parser.js";
import mq_re from "@/components/mq-re.vue";
import http_cse_retrieve from "@/components/retrieve_cse.js"
import http_resource_retrieve from "@/components/retrieve_r.s.js";
import loadResourceDetails from "@/components/retrieve_r.s.js";


export default {
  name: "App",
  display: "app",
  order: 3,
  components: {
    navBar,
    draggable,
    nestedDraggable,
    setAttrs,
    mq_re,
    // rawDisplayer
  },

  data() {
    return {
      cse1: [
      {
          name: "CSE1",
          ty: RT.CSE,
          tasks: [
          ],
          attrs:{

          }
        }
      ],

      resources: [
          { name: "AE", ty: RT.AE },
          { name: "CNT", ty: RT.CNT },
          { name: "ACP", ty: RT.ACP },
          { name: "GRP", ty: RT.GRP },
          { name: "SUB", ty: RT.SUB },
          // { name: "FCNT", ty: RT.FCNT },
      ]
      ,
      attrSetting : false,
      attrSettingModified: false,
      isDragging: false,
      selectedElement: {},
      targetIP: "",
      originator: "Cae-test-1"
    }
  },

  created(){
    const cse = JSON.parse(sessionStorage.getItem("CSE1"));
    //get_jsonfile(cse);
    if (cse!=undefined) this.cse1 = cse;
    this.targetIP = sessionStorage.getItem('targetIP');
  },

  methods: {

    saveResourceTree(){ // 리소스트리 텍스트파일로 저장할때 실행되는 곳
      console.log("saveResourceTree");
      this.exportTextFile(); // 리소스트리 텍스트파일로 저장
    },

    createResourceTree(){ //http 프로토콜로 리소스트리 생성요청
      console.log("createResourceTree");
      this.create_oneM2M_resource();
     // console.log("create finish");
    }, 

    setAttributes(element){
      this.selectedElement = element;
      this.attrSettingModified = false;
      this.attrSetting = true;
      element.selected = true;
    },

    // createResourceTree랑 짝꿍
    async create_oneM2M_resource() { 
      const JSON_string = JSON.stringify(this.cse1);
      const dataToSave = JSON.parse(JSON_string);
      const target_IP = this.targetIP;

      try {
      // get_jsonfile 함수를 비동기로 호출하고 결과를 기다림
      const response = await get_jsonfile(dataToSave, target_IP);
      // 성공적으로 작업을 완료했다면 성공 로그를 출력하고, 성공적인 결과를 나타내는 값을 반환
      console.log("Resource creation successful", response);
      // 추가적으로, 성공 메시지를 alert 또는 다른 UI 요소를 통해 사용자에게 알릴 수 있음
      // alert("Resource creation successful!");
      return true;

    } catch (error) {
      // 오류가 발생했다면, 오류 로그를 출력하고, 실패 메시지를 사용자에게 알림
      console.error("Resource creation failed:", error);
      // alert("Failed to create resource. Error: " + error.message);
      return false;
    }
  }, 


    // saveResourceTree랑 짝꿍
    exportTextFile() {
      const dataToSave = sessionStorage.getItem('CSE1');
      const filename = 'storagedata.json';
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/json;charset=utf-8, ' + encodeURIComponent(dataToSave));
      element.setAttribute('download', filename);
      document.body.appendChild(element);
      element.click();
    },


    loadFile() { // 파일 가져와서 모델링툴에 반영
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/json') {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = e.target.result;
              sessionStorage.setItem('CSE1', data);
              this.loadFromSessionStorage();

            } catch (err) {
              console.error('Invalid JSON file:', err);
            }
          };
          reader.readAsText(file);
        } else {
          console.error('Invalid file type. Please upload a JSON file.');
        }
      };
      fileInput.click();
    },


// 서버에 있는 리소스 가져오는 코드 눌럿을때 실행되는 곳
async loadResources() { 
    console.log("loadResources method called");
    console.log("#####", this.targetIP);
    sessionStorage.setItem('targetIP', this.targetIP);

    if (this.targetIP === "") {
      alert("Please input CSE IP address");
      return;
    }

    // URL 파싱
    const url = this.targetIP;
    const protocol = url.split(':')[0];
    let ip = "";
    let port = "";
    let path = "";
    if (url.split(':').length === 3) {
      ip = url.split(':')[1].replace('//', '');
      port = url.split(':')[2].split('/')[0];
      path = url.split(':')[2].split('/').slice(1).join('/');
    } else {
      ip = url.split(':')[1].replace('//', '');
      port = "80";
      path = url.split(':')[1].split('/').slice(1).join('/');
    }

    console.log(protocol, ip, port, path);
    console.log("####Parsed URL details:", protocol, ip, port, path);

    if (protocol === "http") {        

      try {
          const startTime = performance.now(); // 시작 시간 측정 
          console.time("resourceRetrieval");

            const dataFromServer = await http_resource_retrieve(this.originator, ip, port, path);
            console.log("Data from server:", dataFromServer);

            console.log("Data from server:", dataFromServer);

            const convertedData = this.convertListToFileFormat(dataFromServer);
            console.log("Converted data:", convertedData);

            sessionStorage.setItem('CSE1', JSON.stringify(convertedData, null, 2));
            this.loadFromSessionStorage();

            const endTime = performance.now(); // 종료 시간 측정

            const elapsedTime = endTime - startTime;
            console.log(`Execution time: ${elapsedTime} milliseconds`);

      } catch (error) {
        console.error("Failed to load data:", error);
        alert("Failed to load resources. See console for details.");
      }
    } 
    else if (protocol === 'https') { 
      alert("HTTPS is not supported yet");
    } 
    else {
      alert("Please input correct protocol");
    }
    
  },


  convertNode(node, nodeName) {
        const result = {
            name: nodeName,
            ty: node.ty,
            id: node.ri || '',
            tasks: [],
            attrs: {
                rn: node.rn,
                ri: node.ri,
                ct: node.ct,
                lt: node.lt,
                ty: node.ty,
                cst: node.cst,
                csi: node.csi,
                srt: node.srt,
                srv: node.srv,
                rr: node.rr,
                poa: node.poa
            },
            selected: false
        };

        // 자식노드에 재귀적 요청
        for (const key in node) {
            if (node.hasOwnProperty(key) && key.startsWith('m2m:') && Array.isArray(node[key])) {
                const childNodeName = key.replace('m2m:', '').toUpperCase();
                result.tasks.push(...node[key].map(child => this.convertNode(child, childNodeName)));
            }
        }

        return result;
    },

    convertListToFileFormat(data) {
        const rootNode = data['m2m:cb'];
        if (!rootNode) {
            console.error("rootNode is undefined. Data:", data);
            return [];
        }

        const convertedData = {
            name: "CSE1",
            ty: rootNode.ty,
            tasks: [],
            attrs: {
                rn: rootNode.rn,
                ri: rootNode.ri,
                ct: rootNode.ct,
                lt: rootNode.lt,
                ty: rootNode.ty,
                cst: rootNode.cst,
                csi: rootNode.csi,
                srt: rootNode.srt,
                srv: rootNode.srv,
                rr: rootNode.rr,
                poa: rootNode.poa
            },
            selected: false
        };

        // 하위 노드 재귀적으로 변환
        for (const key in rootNode) {
            if (rootNode.hasOwnProperty(key) && key.startsWith('m2m:') && Array.isArray(rootNode[key])) {
                const childNodeName = key.replace('m2m:', '').toUpperCase();
                convertedData.tasks.push(...rootNode[key].map(child => this.convertNode(child, childNodeName)));
            }
        }

        return [convertedData];
    },






  loadFromRemoteCSE(){ // 서버에서 가져오기 
      console.log("loadFromRemoteCSE");
      console.log(this.targetIP);
      sessionStorage.setItem('targetIP', this.targetIP);
      if(this.targetIP === ""){
        alert("Please input CSE IP address");
        return;
      }
      const url = this.targetIP;
      const protocol = url.split(':')[0];
      var ip = "";
      var port = "";
      var path = "";
      if(url.split(':').length == 3){
        ip = url.split(':')[1].replace('//','');
        port = url.split(':')[2].split('/')[0];
        path = url.split(':')[2].split('/').slice(1).join('/');
      }
      else{
        ip = url.split(':')[1].replace('//','');
        port = "80";
        path = url.split(':')[1].split('/').slice(1).join('/');
      }
      console.log(protocol, ip, port, path);
      console.log("####Parsed URL details:", protocol, ip, port, path);
      if(protocol === "http"){
        const setCSEData = (data) => {
          console.log("************");
          console.log("####", data);  
          console.log("--->", data['m2m:cb']);
          this.cse1[0].attrs = data['m2m:cb'];
        };
        http_cse_retrieve(this.originator, ip, port, path, setCSEData);
        // console.log(cb);
      }
      else if(protocol === "https"){
        alert("https is not supported yet");
      }
      else{
        alert("Please input correct protocol");
      }
    },

  



  loadFromSessionStorage() { 
      const data = sessionStorage.getItem('CSE1');
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          if (!this.checkData(parsedData[0])) {
            window.location.reload();
            return;
          }
          this.cse1 = parsedData;
        } catch (err) {
          window.location.reload();
          console.error('Invalid JSON data in sessionStorage:', err);
        }
      }
    },


  checkData(data) {    

      const allowedResourcesMap = { /* childResource */
        'AE': ['SUB', 'CNT', 'GRP', 'ACP'],
        'CNT': ['SUB', 'CNT'],
        'SUB': [],
        'GRP': ['SUB'],
        'ACP': ['SUB'],
      };
      const typeNum = [RT.MIXED, RT.ACP, RT.AE, RT.CNT, RT.CIN, RT.CSE, RT.GRP, RT.CSR, RT.SUB];                                              // TinyIoT Resource Type
      
      const resourceType = ['ACP', 'AE', 'CNT', 'CIN', 'CSE', 'GRP', 'CSR', 'SUB'];                                                           // Resource Type
      const serializations = ['application/json', 'application/xml', 'application/cbor'];                                                     // Serialization Type

      // const announceSyncType = ['UNI_DIRECTIONAL', 'BI_DIRECTIONAL'];
      // const notificationEventCat = ['Immediate', 'BestEffort', 'Latest'];
      // const notificationContentType = ['All_Attributes', 'Modified_Attributes', 'ResourceID', 'Trigger_Payload', 'TimeSeries_notification'];
      // const consistencyStrategy = ['ABANDON_MEMBER', 'ABANDON_GROUP', 'SET_MIXED'];

      
      const attributeCSE = data.attrs;
      if(data.ty !== RT.CSE) // ty가 숫자가 아닐때로 수정하는게 맞을듯..?
      { /* CSE */
       
       if(
          (attributeCSE.ty !== RT.CSE) ||    // 부정                                                                                                 // Mandatory Attribute
          (typeof attributeCSE.rn !== "undefined" && /^[a-zA-Z0-9\-._]*$/.test(attributeCSE.rn)) ||                                         // resourceName
          (typeof attributeCSE.lbl !== "undefined" && /^[a-zA-Z0-9:]*$/.test(attributeCSE.lbl)) ||                                          // labels
          (typeof attributeCSE.acpi !== "undefined" && typeof attributeCSE.acpi == 'string') ||                                             // accessControlPolicyIDs
          (typeof attributeCSE.cst == "undefined" &&  (attributeCSE.cst < 1 || attributeCSE.cst > 3)) ||                              // cseType
          (typeof attributeCSE.csi !== "undefined" &&typeof attributeCSE.csi == 'string') ||                                                // CSE-ID
          (typeof attributeCSE.poa !== "undefined" && typeof attributeCSE.poa!== 'string')                                                   // pointOfAccess
        ){
          alert("Invalid Loading(CSE)");
          return false;





        }
        
        if (Array.isArray(attributeCSE.srt)) {                                                                                                // supportedResourceType                                                                                                   
          for (let i = 0; i < attributeCSE.srt.length; i++) {
            if (!resourceType.includes(attributeCSE.srt[i])) {
              alert("Invalid Loading(CSE)");
              return false;
            }

          }
        }
        if (Array.isArray(attributeCSE.csz)) {                                                                                                // supportedResourceType                                                                                                   
          for (let i = 0; i < attributeCSE.csz.length; i++) {
            if (!serializations.includes(attributeCSE.csz[i])) {
              alert("Invalid Loading(CSE)");
              return false;
            }
          }
        }
      }

      for (const task of data.tasks) { // Recursively check the tasks of this task by calling this function again
        if (Array.isArray(task.tasks)) { /* childResource */
          if (task.tasks.some(subTask => !allowedResourcesMap[task.name].includes(subTask.name))) {
            alert("Invalid ChildResource: ", task.name); 
            return false;
          }
        }
        const attribute = task.attrs;

        if(task.ty !== RT.ACP){ ACP 
          
          if (allowedResourcesMap[task.ty].includes('ACP')){

          if(
            (typeof attribute.pv == "undefined" || typeof attribute.pvs == "undefined" || attribute.ty !== RT.ACP) ||                         // Mandatory Attribute
            (typeof attribute.rn !== "undefined" && !/^[a-zA-Z0-9\-._]*$/.test(attribute.rn)) ||                                              // resourceName
            (typeof attribute.lbl !== "undefined" && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||                                               // labels
            (typeof attribute.pv.acop == "undefined" && (attribute.pv.acop < 1 || attribute.pv.acop > 6)) ||                                  // privileges accessControlOperations
            (typeof attribute.pvs.acop == "undefined" && (attribute.pvs.acop < 1 || attribute.pvs.acop > 6))                                  // selfPrivileges accessControlOperations
            ){ 
              alert("Invalid Loading(ACP)");
              return false;
          }
          if (Array.isArray(attribute.pv.acor)) {                                                                                             // privileges accessControlOriginators
            for (let i = 0; i < attribute.pv.acor.length; i++) {
              if (typeof attribute.pv.acor[i] !== 'string') {
                alert("Invalid Loading(ACP)");
                return false;
              }
            }
          }
          if (Array.isArray(attribute.pvs.acor)) {                                                                                            // selfPrivileges accessControlOriginators
            for (let i = 0; i < attribute.pv.acor.length; i++) {
              if (typeof attribute.pv.acor[i] !== 'string') {
                alert("Invalid Loading(ACP)");
                return false;
              }
            }
          }
          }
          
        }
        

        if(task.ty !== RT.AE){ /* AE */
          if(
            (typeof attribute.api == "undefined" || typeof attribute.rr == "undefined" || attribute.srv == "undefined" || attribute.ty !== RT.AE) ||             // Mandatory Attribute
            (typeof attribute.rn !== "undefined" && !/^[a-zA-Z0-9\-._]*$/.test(attribute.rn)) ||                                                                 // resourceName
            (typeof attribute.lbl !== "undefined" && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||                                                                  // labels
            (typeof attribute.acpi !== "undefined" && typeof attribute.acpi !== 'string') ||                                                                     // accessControlPolicyIDs
            (typeof attribute.at !== "undefined" && typeof attribute.at !== 'string') ||                                                                         // announceTo
            (typeof attribute.aa !== "undefined" && (typeof attribute.aa !== 'string' || attribute.aa.includes(':'))) ||                                         // announcedAttribute
            (typeof attribute.ast !== "undefined" && (attribute.ast < 1 || attribute.ast > 2)) ||                                                                // announceSyncType            
            (typeof attribute.apn !== "undefined" && typeof attribute.apn !== 'string') ||                                                                       // appName
            (typeof attribute.api !== "undefined" && (typeof attribute.api !== 'string' || !attribute.api.startsWith('N'))) ||                                   // App-ID
            (typeof attribute.aei !== "undefined" && typeof attribute.aei !== 'string') ||                                                                       // AE-ID
            (typeof attribute.rr == "undefined" && typeof attribute.rr !== 'boolean') ||                                                                         // requestReachability
            (typeof attribute.poa !== "undefined" && typeof attribute.poa !== 'string')                                                                          // pointOfAccess
            ){ 
            alert("Invalid Loading(AE)");
            return false;
          }
          if (Array.isArray(attribute.srv)) {                                                                                                                    // supportedReleaseVersions
            for (let i = 0; i < attribute.srv.length; i++) {
              if (!['1','2','2a','3','4','5'].includes(attribute.srv[i])) {
                alert("Invalid Loading(AE)");
                return false;
              }
            }
          }
        }


        if(task.ty !== RT.CNT){ /* CNT */
          if(
            (attribute.ty !== RT.CNT) ||                                                                                                      // Mandatory Attribute
            (typeof attribute.lbl !== "undefined" && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||                                               // labels
            (typeof attribute.acpi !== "undefined" && typeof attribute.acpi !== 'string') ||                                                  // accessControlPolicyIDs
            (typeof attribute.at !== "undefined" && typeof attribute.at !== 'string') ||                                                      // announceTo
            (typeof attribute.aa !== "undefined" && (typeof attribute.aa !== 'string' || attribute.aa.includes(':'))) ||                      // announcedAttribute
            (typeof attribute.ast !== "undefined" && (attribute.ast < 1 || attribute.ast > 2)) ||                                             // announceSyncType            
            (typeof attribute.cr !== "undefined" && typeof attribute.cr !== 'boolean') ||                                                     // creator
            (typeof attribute.mni !== "undefined" && (!Number.isInteger(attribute.mni) || attribute.mni < 0)) ||                              // maxNrOfInstances
            (typeof attribute.mbs !== "undefined" && (!Number.isInteger(attribute.mbs) || attribute.mbs < 0)) ||                              // maxByteSize
            (typeof attribute.mia !== "undefined" && (!Number.isInteger(attribute.mia) || attribute.mia < 0))                                 // maxInstanceAge
            ){ 
            alert("Invalid Loading(CNT)");
            return false;
          }
        } 
        
        
        if(task.ty !== RT.SUB){ /* SUB */
          if(
            (typeof attribute.nu == "undefined" || attribute.ty !== RT.SUB) ||                                                                // Mandatory Attribute
            (typeof attribute.lbl !== "undefined" && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||                                               // labels
            (typeof attribute.acpi !== "undefined" && typeof attribute.acpi !== 'string') ||                                                  // accessControlPolicyIDs
            (typeof attribute.cr !== "undefined" && typeof attribute.cr !== 'boolean') ||                                                     // creator
            (typeof attribute.nu !== "undefined" && typeof attribute.nu !== 'string') ||                                                      // notificationURI
            (typeof attribute.su !== "undefined" && typeof attribute.su !== 'string') ||                                                      // subscriberURI
            (typeof attribute.nec !== "undefined" && (attribute.nec < 2 || attribute.nec > 4)) ||                                             // notificationEventCat
            (typeof attribute.ln !== "undefined" && typeof attribute.ln !== 'boolean') ||                                                     // latestNotify
            (typeof attribute.nct !== "undefined" && (attribute.nct < 1 || attribute.nct > 5))                                                // notificationContentType
            ){ 
            alert("Invalid Loading(SUB)");
            return false;
          }
        }


        if(task.ty !== RT.GRP){ /* GRP */
          if(
            (typeof attribute.mnm == "undefined" || typeof attribute.mid == "undefined" || attribute.ty !== RT.GRP) ||                        // Mandatory Attribute
            (typeof attribute.lbl !== "undefined" && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||                                               // labels
            (typeof attribute.acpi !== "undefined" && typeof attribute.acpi !== 'string') ||                                                  // accessControlPolicyIDs
            (typeof attribute.at !== "undefined" && typeof attribute.at !== 'string') ||                                                      // announceTo
            (typeof attribute.aa !== "undefined" && (typeof attribute.aa !== 'string' || attribute.aa.includes(':'))) ||                      // announcedAttribute
            (typeof attribute.ast !== "undefined" && (attribute.ast < 1 || attribute.ast > 2)) ||                                             // announceSyncType            
            (typeof attribute.cr !== "undefined" && typeof attribute.cr !== 'boolean') ||                                                     // creator
            (typeof attribute.mnm !== "undefined" && (!Number.isInteger(attribute.mnm) || attribute.mnm <= 0)) ||                             // maxNrOfMembers
            (typeof attribute.mid !== "undefined" && typeof attribute.mid !== 'string') ||                                                    // memberIDs
            (typeof attribute.csy !== "undefined" && (attribute.csy < 1 || attribute.csy > 3)) ||                                             // consistencyStrategy
            (typeof attribute.gn !== "undefined" && typeof attribute.gn !== 'string')                                                         // groupName 
            ){ 
            alert("Invalid Loading(GRP)");
            return false;
          }
          if (typeof attribute.mt !== "undefined" && !typeNum.includes(attribute.mt)) {                                                       // memberType
            alert("Invalid Syntax(AE)");
            return false;
          }
          if (Array.isArray(attribute.macp)) {                                                                                                // membersAccessControlPolicyIDs
            for (let i = 0; i < attribute.macp.length; i++) {
              if (typeof attribute.macp[i] !== 'string') {
                alert("Invalid Loading(GRP)");
                return false;
              }
            }
          }
        }
        else /* Invalid Resource Type */
          return false; 

        if(!this.checkData(task)) {
          return false;
        }
      }

      return true;
    },
  },

  
  watch: {
    cse1 : {
      deep: true,
      handler(){
        this.isDragging=false;
        sessionStorage.setItem("CSE1",JSON.stringify(this.cse1, null, 2));
      }
    }
  },

  checkData_list(dataList) {
  const allowedResourcesMap = {
    'AE': ['SUB', 'CNT', 'GRP', 'ACP'],
    'CNT': ['SUB', 'CNT'],
    'SUB': [],
    'GRP': ['SUB'],
    'ACP': ['SUB'],
  };

  const typeNum = [RT.MIXED, RT.ACP, RT.AE, RT.CNT, RT.CIN, RT.CSE, RT.GRP, RT.CSR, RT.SUB];                                              // TinyIoT Resource Type
  const resourceType = ['ACP', 'AE', 'CNT', 'CIN', 'CSE', 'GRP', 'CSR', 'SUB'];                                                           // Resource Type
  const serializations = ['application/json', 'application/xml', 'application/cbor'];                                                     // Serialization Type

  let isValid = true; // 추가: 데이터가 유효한지 여부를 저장하는 변수
  
  for (const item of dataList) {
    const attribute = item.data;
    const uri = item.uri;

    // Check resource type
    const resourceTypeName = uri.split('/')[1]; // Extract resource type from URI
    if (!resourceType.includes(resourceTypeName)) {
      console.error('Invalid resource type:', resourceTypeName);
      return false;
    }

    // Check mandatory attributes and their formats
    if (
      (typeof attribute.ty !== 'number') ||
      (typeof attribute.rn !== 'string' || !/^[a-zA-Z0-9\-._]*$/.test(attribute.rn)) ||
      (typeof attribute.lbl !== 'undefined' && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||
      (typeof attribute.acpi !== 'undefined' && typeof attribute.acpi !== 'string')
    ) {
      console.error('Invalid mandatory attribute:', attribute);
      return false;
    }

    // Additional checks based on resource type
    switch (resourceTypeName) {
      case 'CSE':
        if (
          (attribute.ty !== RT.CSE) ||
          (typeof attribute.cst !== 'undefined' && (attribute.cst < 1 || attribute.cst > 3)) ||
          (typeof attribute.csi !== 'undefined' && typeof attribute.csi !== 'string') ||
          (typeof attribute.poa !== 'undefined' && typeof attribute.poa !== 'string')
        ) {
          console.error('Invalid CSE attribute:', attribute);
          return false;
        }

        if (Array.isArray(attribute.srt)) {
          for (const srt of attribute.srt) {
            if (!resourceType.includes(srt)) {
              console.error('Invalid supportedResourceType:', srt);
              return false;
            }
          }
        }

        if (Array.isArray(attribute.csz)) {
          for (const csz of attribute.csz) {
            if (!serializations.includes(csz)) {
              console.error('Invalid supportedSerialization:', csz);
              return false;
            }
          }
        }
        break;

      // Add cases for other resource types if needed

      default:
        console.error('Unknown resource type:', resourceTypeName);
        return false;
    }

    // Check child resources
    if (Array.isArray(attribute.tasks)) {
      for (const task of attribute.tasks) {
        if (!allowedResourcesMap[resourceTypeName].includes(task.name)) {
          console.error('Invalid child resource:', task.name);
          return false;
        }
      }
    }
  }

  //return true;
  return isValid;
}
}

</script>
<style scoped>
#app{
  overflow: hidden;
}

.configure {
  background-color: #fff;
  display: flex;
  flex-direction: row;
  /* justify-content: space-between; */
  align-items: flex-start;
  margin-left: 10px;
  margin-right: 10px;
  min-width: 1200px;
  overflow: hidden;

}
.configure .box {
  border: 1px solid black;
  padding: 5px;
  margin-left: 10px;
  margin-right: 10px;
  background-color: #192749;
  border-radius: 5px;
  display: flex;
  align-items: center;
  flex-direction: row;
  min-height: 20px;
  box-shadow : 5px 5px 5px 5px #D5D5D5;
}

.configure .box .key {
  width: 200px;
  text-align: center;
}

.configure .box input {
  flex-grow: 1;
  border-radius: 5px;
  padding: 5px;
  width: 100%;
}

.body {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin: 10px;
  height: 100%;
  min-width: 1200px;
  overflow: hidden;
}

.canvas {
  border: 1px solid black;
  width: 78%;
  height: 80vh;
  padding: 10px;
  margin: 10px;
  background-color: #f3f3f3;
  border-radius: 5px;
  display: flex;  
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow : 5px 5px 5px 5px #D5D5D5;
}

.scroll-container {
  overflow: auto;
  height: 100%;
}

.rightTab {
  border: 1px solid black;
  width: 20%;
  height: 80vh;
  padding: 10px;
  margin: 10px;
  overflow: auto;
  background-color: #f3f3f3;
  border-radius: 5px;
  box-sizing: border-box;
  position: relative;
  box-shadow : 5px 5px 5px 5px #D5D5D5;

}

.nav {
  margin-bottom: 15px;
  min-width: 1200px;
  overflow: hidden;
  margin-right: 0px;
}


.dragArea {
  border: 1.1px solid #4374D9;
  height: 100%;
  overflow-y: auto;
  transform-origin : center center;
  margin-bottom: 6px;
}


.right_dragArea{
  border: 1.1px solid #4374D9;
  height: 40%;
}

.t_dragArea {
  border: 1.1px solid #4374D9;
  height: 100%;
}

.resourceTree {
  flex-grow: 1;
}

.trashcan {
  height: 10%;
  margin-bottom: 20px;
}

.trashcan .dragArea {
  height: 100%;
}
.trashcan-image{
  position: relative;
  left: 44%;
  bottom: 80%;
  width: 40px;
  height: 40px;
}

.serverName {
  background-color: #ccc;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 5px;
  padding: 5px;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.0;
  text-align: center;
  width: 120px;
}

.buttonBox {
  position: relative;
  bottom: 10px;
  right: 10px;
  width: 100%;
  text-align: center;
  padding: 10px;
  box-shadow : 5px 5px 5px 5px #D5D5D5;
}

.modal {
  position: fixed;
  display: block;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;

}

.modal .overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.3);
}

.modal .modalBody {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: 70vw;
  height: auto;
  background-color: #fff;
  border-radius: 5px;
  border: 1px solid #ccc;
  padding: 15px;

}

.button {
  margin: 0px;
  padding: 10px;
}

.selectedBox {
  border: 1px solid black;
  border-radius: 5px;
  margin: 5px;
  padding: 5px;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.0;
  text-align: center;
  width: 120px;
}


</style>