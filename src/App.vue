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
      style="border: 1px solid #0d1829;
      background: linear-gradient(145deg, #1e3a5f, #152238);
      color: white;
      box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.3), -4px -4px 12px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border-radius: 15px">CSE Load</div>
      <div class="btn button" @click="loadResources"
      style="border: 1px solid #0d1829;
      margin-left: 10px;
      background: linear-gradient(145deg, #1e3a5f, #152238);
      color: white;
      box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.3), -4px -4px 12px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border-radius: 15px"> Resource load</div>
      <div
        class="btn button"
        @click="connectWebsocket"
        :style="{
          border: '1px solid ' + (realtimeSyncEnabled ? '#1e5a2e' : '#0d1829'),
          marginLeft: '10px',
          background: realtimeSyncEnabled ? 'linear-gradient(145deg, #2ecc71, #239a55)' : 'linear-gradient(145deg, #1e3a5f, #152238)',
          color: 'white',
          boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.3), -4px -4px 12px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          position: 'relative'
        }"
      >
        <span v-if="realtimeSyncEnabled" style="margin-right: 5px;">🔴</span>
        {{ realtimeSyncEnabled ? 'Live Sync ON' : 'Live Sync OFF' }}
      </div>

      <!-- 번쩍이는 효과 토글 -->
      <div style="display: inline-flex; align-items: center; margin-left: 10px; padding: 5px 10px; border-radius: 12px; background: rgba(30, 58, 95, 0.3);">
        <span style="color: white; margin-right: 10px; font-size: 14px; font-weight: 500;">Flash Effect</span>
        <label class="toggle-switch-large">
          <input type="checkbox" v-model="flashingEffectEnabled" @change="onFlashEffectToggle" />
          <span class="toggle-slider-large"></span>
        </label>
      </div>
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
          :childRT="[2, 9, 1, 3, 4, 23]"
          :min-height="200"
          item-key="id"
          @clicked="(element) => {
            this.setAttributes(element);
          }"
          @move="(evt) => { this.isDragging = true; }"
          @add="handleAdd"
          @drag-start="handleDragStart"
          @toggle-expand="handleToggleExpand"
          @zoom-view="openZoomView"
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

      <div class="deleteZone">
        <draggable
          :group="{
            name: 'resourceDelete',
            pull: false,
            put: ['resourceTree']
          }"
          :list="deleteBuffer"
          class="delete_dragArea"
          item-key="id"
          @change="handleDeleteZoneChange"
        >
          <template #item="{ element }">
            <div class="delete-item">{{ getElementLabel(element) }}</div>
          </template>
        </draggable>
        <div class="delete-label">Resource Delete</div>
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

  <!-- 확대 뷰 모달 -->
  <div v-if="showZoomView" class="zoom-view-overlay" @click="closeZoomView">
    <div class="zoom-view-container" @click.stop>
      <div class="zoom-view-header">
        <h2>{{ zoomedAE?.attrs?.rn || 'AE' }} - Expanded View</h2>
        <button class="close-btn" @click="closeZoomView">✕</button>
      </div>
      <div class="zoom-view-content">
        <nestedDraggable
          :tasks="zoomedTree"
          style="padding-left: 0px;"
          :group="{
            name: 'zoomTree',
            pull: false,
            put: false
          }"
          :childRT="[2, 9, 1, 3, 4, 23]"
          :min-height="200"
          item-key="id"
          @clicked="(element) => {
            this.setAttributes(element);
          }"
          @toggle-expand="handleToggleExpand"
          class="dragArea resourceTree zoom-tree"
        ></nestedDraggable>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import nestedDraggable from "@/components/infra/nested.vue";
import setAttrs from "@/components/setAttrs.vue";
import navBar from "@/components/navBar.vue";
import { resourceType as RT, resourceAttributes } from "./components/attributes";
import get_jsonfile from "@/components/json-parser.js";
import mq_re from "@/components/mq-re.vue";
import http_cse_retrieve from "@/components/retrieve_cse.js"
import http_resource_retrieve from "@/components/retrieve_r.s.js";
import loadResourceDetails from "@/components/retrieve_r.s.js";
import http_resource_delete from "@/components/http-delete.js";
import mqtt from 'mqtt';


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
          { name: "ACP", ty: RT.ACP },
          { name: "AE", ty: RT.AE },
          { name: "CNT", ty: RT.CNT },
          { name: "CIN", ty: RT.CIN },
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
      originator: "CAdmin",
      deleteBuffer: [],
      treeSnapshotBeforeDrag: null,
      draggedElementInfo: null,
      draggedElementPath: '',
      // MQTT 관련
      mqttClient: null,
      realtimeSyncEnabled: false,
      subscriptionCreated: false,
      subscriptionResourceName: null,
      flashingResources: new Set(),
      flashingEffectEnabled: true,  // 번쩍이는 효과 토글 (기본값: 켜짐)
      mqttTopic: '/oneM2M/req/TinyIoT/designTool',  // oneM2M 표준 형식 (맨 앞 /  필수!)
      // 확대 뷰 관련
      showZoomView: false,
      zoomedAE: null
    }
  },

  computed: {
    // 확대 뷰용 트리 - 실시간 동기화를 위해 computed로 구현
    zoomedTree() {
      if (!this.zoomedAE || !this.cse1 || this.cse1.length === 0) {
        return [];
      }

      // 원본 CSE 데이터에서 선택한 AE만 필터링 (참조 유지)
      const cseData = this.cse1[0];
      if (!cseData || !cseData.tasks) {
        return [];
      }

      // 선택한 AE 찾기 (원본 참조 유지)
      const selectedAE = cseData.tasks.find(ae => ae.id === this.zoomedAE.id);
      if (!selectedAE) {
        return [];
      }

      // CSE 복사본 생성 (shallow copy)
      const cseClone = {
        ...cseData,
        tasks: [selectedAE] // 선택한 AE만 포함 (원본 참조)
      };

      return [cseClone];
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

    // 확대 뷰 관련 함수
    openZoomView(aeElement) {
      console.log("[openZoomView] Opening zoom view for AE:", aeElement.attrs?.rn);
      // zoomedTree는 computed property로 자동 생성됨 (실시간 동기화 지원)
      this.zoomedAE = aeElement;
      this.showZoomView = true;
    },

    closeZoomView() {
      this.showZoomView = false;
      this.zoomedAE = null;
    },

    handleUpdateRn(data) {
      const { id, rn } = data;
      console.log('[UPDATE-RN] Updating resource name:', { id, rn });

      // Find element by id recursively
      const findById = (tasks) => {
        for (const task of tasks) {
          if (task.id === id) {
            return task;
          }
          if (task.tasks && task.tasks.length > 0) {
            const found = findById(task.tasks);
            if (found) return found;
          }
        }
        return null;
      };

      const element = findById(this.cse1);
      if (element && element.attrs) {
        element.attrs.rn = rn;
        this.updateFullPaths();
        this.syncSessionStorage();
        console.log('[UPDATE-RN] ✅ Resource name updated');
      } else {
        console.error('[UPDATE-RN] Element not found:', id);
      }
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
    console.log("[loadResources] Loading ALL resources (except CIN) from CSE using Discovery...");
    sessionStorage.setItem('targetIP', this.targetIP);

    if (this.targetIP === "") {
      alert("Please input CSE IP address");
      return;
    }

    const target = this.parseTargetUrl(this.targetIP);
    if (!target) {
      alert("Invalid URL format");
      return;
    }

    console.log("[loadResources] Parsed URL:", target);

    if (target.protocol !== "http") {
      if (target.protocol === 'https') {
        alert("HTTPS is not supported yet");
      } else {
        alert("Please input correct protocol (http)");
      }
      return;
    }

    try {
      const startTime = performance.now();

      // Step 1: Discovery로 모든 AE URI 찾기
      console.log("[loadResources] Step 1: Discovering all AEs (ty=2)...");
      const aeDiscoveryData = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'fu=1&ty=2&lim=1000');
      const aeUris = aeDiscoveryData['m2m:uril'] || [];
      console.log(`[loadResources] Found ${aeUris.length} AEs via Discovery`);

      // Step 2: CSE Base를 rcn=4로 retrieve (ACP 정보를 위해)
      console.log("[loadResources] Step 2: Retrieving CSE Base with rcn=4...");
      const cseData = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'rcn=4');
      const cseInfo = cseData['m2m:cb'];
      console.log(`[loadResources] CSE loaded (ACPs: ${cseInfo['m2m:acp']?.length || 0})`);

      // Step 3: 각 AE를 Discovery로 CNT만 가져오기 (CIN 제외)
      console.log("[loadResources] Step 3: Retrieving each AE (CNT only, CIN excluded)...");
      const fullAeList = [];

      for (let i = 0; i < aeUris.length; i++) {
        const aeUri = aeUris[i].startsWith('/') ? aeUris[i].substring(1) : aeUris[i];

        try {
          console.log(`[loadResources] Retrieving AE ${i+1}/${aeUris.length}: ${aeUri}`);

          // AE 기본 정보만 가져오기
          const aeData = await http_resource_retrieve(this.originator, target.host, target.port, aeUri, '');
          const ae = aeData['m2m:ae'];

          // Discovery로 모든 CNT URI 가져오기
          try {
            const cntDiscoveryData = await http_resource_retrieve(this.originator, target.host, target.port, aeUri, 'fu=1&ty=3&lim=1000');
            const cntUris = cntDiscoveryData['m2m:uril'] || [];
            console.log(`  Found ${cntUris.length} CNTs`);

            if (cntUris.length > 0) {
              // 각 CNT를 개별 조회하여 실제 속성으로 트리 생성
              ae['m2m:cnt'] = await this.buildCntTreeWithRealAttributes(cntUris, aeUri, target.host, target.port);
            }
          } catch (error) {
            console.warn(`  No CNTs found`);
          }

          // ACP도 Discovery로 가져오기
          try {
            const acpDiscoveryData = await http_resource_retrieve(this.originator, target.host, target.port, aeUri, 'fu=1&ty=1&lim=100');
            const acpUris = acpDiscoveryData['m2m:uril'] || [];
            if (acpUris.length > 0) {
              console.log(`  Found ${acpUris.length} ACPs`);
              ae['m2m:acp'] = [];
              for (const acpUri of acpUris) {
                const cleanAcpUri = acpUri.startsWith('/') ? acpUri.substring(1) : acpUri;
                try {
                  const acpData = await http_resource_retrieve(this.originator, target.host, target.port, cleanAcpUri, '');
                  ae['m2m:acp'].push(acpData['m2m:acp']);
                } catch (err) {
                  console.warn(`  Failed to retrieve ACP ${cleanAcpUri}`);
                }
              }
            }
          } catch (error) {
            // ACP가 없는 경우
          }

          fullAeList.push(ae);
        } catch (error) {
          console.warn(`[loadResources] Failed to retrieve AE ${aeUri}:`, error.message);
        }
      }

      // Step 4: CSE 직속 CNT 로드 (AE가 아닌 CNT - modelRepo 등)
      console.log("[loadResources] Step 4: Discovering CSE's direct CNTs (ty=3, drt=1)...");
      const cseCntList = [];
      try {
        const cseCntDiscovery = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'fu=1&ty=3&drt=1');
        const allCntUris = cseCntDiscovery['m2m:uril'] || [];

        // Filter to only truly direct CNTs (CSE/CNT, not CSE/AE/CNT or deeper)
        const basePathParts = target.basePath.split('/').filter(p => p);
        const cseCntUris = allCntUris.filter(uri => {
          const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
          const parts = cleanUri.split('/').filter(p => p);
          // Direct CNT should be exactly 1 level deeper than CSE base path
          return parts.length === basePathParts.length + 1;
        });

        console.log(`  Found ${cseCntUris.length} direct CNTs under CSE (filtered from ${allCntUris.length} total)`);

        for (const cntUri of cseCntUris) {
          const cleanCntUri = cntUri.startsWith('/') ? cntUri.substring(1) : cntUri;

          try {
            // CNT 기본 정보 가져오기
            const cntData = await http_resource_retrieve(this.originator, target.host, target.port, cleanCntUri, '');
            const cnt = cntData['m2m:cnt'];

            // 이 CNT 하위의 모든 CNT도 가져오기 (재귀적으로)
            try {
              const subCntDiscovery = await http_resource_retrieve(this.originator, target.host, target.port, cleanCntUri, 'fu=1&ty=3&lim=1000');
              const subCntUris = subCntDiscovery['m2m:uril'] || [];

              if (subCntUris.length > 0) {
                console.log(`    CNT ${cnt.rn} has ${subCntUris.length} sub-CNTs`);
                cnt['m2m:cnt'] = await this.buildCntTreeWithRealAttributes(subCntUris, cleanCntUri, target.host, target.port);
              }
            } catch (error) {
              // No sub-CNTs
            }

            cseCntList.push(cnt);
          } catch (error) {
            console.warn(`  Failed to retrieve CNT ${cleanCntUri}:`, error.message);
          }
        }
      } catch (error) {
        console.log("  No direct CNTs found under CSE");
      }

      // Step 5: CSE 직속 SUB 로드 (최신 1개만)
      console.log("[loadResources] Step 5: Discovering CSE's direct SUBs (ty=23, drt=1, lim=1)...");
      const cseSubList = [];
      try {
        const cseSubDiscovery = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'fu=1&ty=23&drt=1&lim=1');
        const allSubUris = cseSubDiscovery['m2m:uril'] || [];

        // Filter to only truly direct SUBs (CSE/SUB, not CSE/AE/CNT/SUB or deeper)
        const basePathParts = target.basePath.split('/').filter(p => p);
        const cseSubUris = allSubUris.filter(uri => {
          const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
          const parts = cleanUri.split('/').filter(p => p);
          // Direct SUB should be exactly 1 level deeper than CSE base path
          return parts.length === basePathParts.length + 1;
        });

        console.log(`  Found ${cseSubUris.length} direct SUBs under CSE (filtered from ${allSubUris.length} total, limited to 1)`);

        for (const subUri of cseSubUris) {
          const cleanSubUri = subUri.startsWith('/') ? subUri.substring(1) : subUri;

          try {
            const subData = await http_resource_retrieve(this.originator, target.host, target.port, cleanSubUri, '');
            cseSubList.push(subData['m2m:sub']);
          } catch (error) {
            console.warn(`  Failed to retrieve SUB ${cleanSubUri}:`, error.message);
          }
        }
      } catch (error) {
        console.log("  No direct SUBs found under CSE");
      }

      // Step 6: CSE에 모든 자식 리소스 추가 (AE, CNT, SUB)
      cseInfo['m2m:ae'] = fullAeList;
      if (cseCntList.length > 0) {
        cseInfo['m2m:cnt'] = cseCntList;
      }
      if (cseSubList.length > 0) {
        cseInfo['m2m:sub'] = cseSubList;
      }
      console.log(`[loadResources] Step 6: Combined ${fullAeList.length} AEs, ${cseCntList.length} CNTs, ${cseSubList.length} SUBs into CSE tree`);

      // Step 7: 전체 트리 구조 변환
      console.log("[loadResources] Step 7: Converting tree structure...");
      const fullData = { 'm2m:cb': cseInfo };

      const convertedData = this.convertListToFileFormatFull(fullData);
      console.log("[loadResources] Converted data:", convertedData);

      // CSE에 플래그 설정
      if (convertedData[0]) {
        convertedData[0].childrenLoaded = true;
        convertedData[0].allResourcesLoaded = true;
        convertedData[0].allCollapsed = false;
        convertedData[0].expanded = true;
      }

      sessionStorage.setItem('CSE1', JSON.stringify(convertedData, null, 2));
      this.loadFromSessionStorage();

      // fullPath 업데이트 (중요!)
      this.updateFullPaths();
      this.syncSessionStorage();

      const endTime = performance.now();

      // 전체 리소스 수 계산
      let totalResources = 0;
      function countAll(node) {
        if (node.tasks) {
          totalResources += node.tasks.length;
          node.tasks.forEach(child => countAll(child));
        }
      }
      if (convertedData[0]) {
        totalResources = 1; // CSE itself
        countAll(convertedData[0]);
      }

      console.log(`[loadResources] ✅ Loaded ${totalResources} resources in ${(endTime - startTime).toFixed(2)}ms`);

      // Step 8: 모든 CNT에 Subscription 자동 생성
      console.log("[loadResources] Step 8: Creating subscriptions for all CNTs...");
      try {
        const stats = await this.createSubscriptionsForAllCNTs();
        console.log(`[loadResources] ✅ Subscription setup completed: ${stats.created} created, ${stats.reused} reused, ${stats.errors} errors out of ${stats.total} CNTs`);

        // 리소스 다시 로드하여 새로 생성된 Subscription을 트리에 반영
        if (stats.created > 0) {
          console.log("[loadResources] Reloading resources to show new subscriptions...");
          // 현재 origintor와 targetIP는 이미 설정되어 있으므로 단순 재로드
          const reloadData = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'rcn=4');
          const reloadCseInfo = reloadData['m2m:cb'];

          // AE 목록은 이미 로드되어 있으므로 각 AE를 업데이트
          for (const ae of fullAeList) {
            const aeUri = `${target.basePath}/${ae.rn}`;

            // AE 직속 SUB 로드
            try {
              const aeSubDiscovery = await http_resource_retrieve(this.originator, target.host, target.port, aeUri, 'fu=1&ty=23');
              const aeSubUris = aeSubDiscovery['m2m:uril'] || [];
              if (aeSubUris.length > 0) {
                ae['m2m:sub'] = [];
                for (const subUri of aeSubUris) {
                  const cleanSubUri = subUri.startsWith('/') ? subUri.substring(1) : subUri;
                  try {
                    const subData = await http_resource_retrieve(this.originator, target.host, target.port, cleanSubUri, '');
                    ae['m2m:sub'].push(subData['m2m:sub']);
                  } catch (err) {
                    console.warn(`Failed to retrieve SUB ${cleanSubUri}`);
                  }
                }
              }
            } catch (error) {
              // No SUBs found
            }
          }

          // 전체 트리 재생성
          reloadCseInfo['m2m:ae'] = fullAeList;
          if (cseCntList.length > 0) {
            reloadCseInfo['m2m:cnt'] = cseCntList;
          }
          if (cseSubList.length > 0) {
            reloadCseInfo['m2m:sub'] = cseSubList;
          }

          const reloadFullData = { 'm2m:cb': reloadCseInfo };
          const reloadConvertedData = this.convertListToFileFormatFull(reloadFullData);

          if (reloadConvertedData[0]) {
            reloadConvertedData[0].childrenLoaded = true;
            reloadConvertedData[0].allResourcesLoaded = true;
            reloadConvertedData[0].allCollapsed = false;
            reloadConvertedData[0].expanded = true;
          }

          sessionStorage.setItem('CSE1', JSON.stringify(reloadConvertedData, null, 2));
          this.loadFromSessionStorage();
          this.updateFullPaths();
          this.syncSessionStorage();
        }
      } catch (error) {
        console.warn("[loadResources] ⚠️ Failed to create subscriptions:", error);
        // Subscription 생성 실패는 치명적이지 않으므로 경고만 표시
      }

    } catch (error) {
      console.error("[loadResources] ❌ Failed to load resources:", error);
      alert("Failed to load resources. See console for details.");
    }
  },

  // Discovery로 찾은 CNT들을 개별 조회하여 실제 속성으로 트리 생성
  async buildCntTreeWithRealAttributes(cntUris, aeUri, host, port) {
    const cleanAeUri = aeUri.startsWith('/') ? aeUri.substring(1) : aeUri;
    const aePathParts = cleanAeUri.split('/');

    // 1. 중간 부모 CNT 경로 추출
    const allCntPaths = new Set();
    const parentPaths = new Set(); // 부모 CNT 경로만 별도로 저장

    for (const uri of cntUris) {
      const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
      allCntPaths.add(cleanUri);

      // 중간 부모 경로도 추가
      const parts = cleanUri.split('/');
      for (let i = aePathParts.length + 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('/');
        allCntPaths.add(parentPath);
        parentPaths.add(parentPath);
      }
    }

    console.log(`    Discovery found: ${cntUris.length} CNT URIs`);
    console.log(`    Total CNT paths (including parents): ${allCntPaths.size}`);

    // 2. 각 부모 CNT에 대해 직속 자식 확인 (Discovery가 누락시킨 CNT 발견)
    console.log(`    Checking ${parentPaths.size} parent CNTs for missing children...`);
    for (const parentPath of parentPaths) {
      // Discovery로 직속 자식 찾기 (drt=1)
      try {
        const childDiscovery = await http_resource_retrieve(this.originator, host, port, parentPath, 'fu=1&ty=3&drt=1');
        const childUris = childDiscovery['m2m:uril'] || [];

        for (const childUri of childUris) {
          const cleanChildUri = childUri.startsWith('/') ? childUri.substring(1) : childUri;
          if (!allCntPaths.has(cleanChildUri)) {
            console.log(`      Found missing CNT via Discovery: ${cleanChildUri}`);
            allCntPaths.add(cleanChildUri);
          }
        }
      } catch (error) {
        // Discovery 실패는 무시
      }

      // rcn=4로도 확인 (Discovery가 일부만 반환할 수 있음)
      try {
        const parentData = await http_resource_retrieve(this.originator, host, port, parentPath, 'rcn=4');
        const parentCnt = parentData['m2m:cnt'];

        if (parentCnt['m2m:cnt'] && Array.isArray(parentCnt['m2m:cnt'])) {
          // rcn=4로 찾은 직속 자식 CNT들을 allCntPaths에 추가
          for (const childCnt of parentCnt['m2m:cnt']) {
            const childPath = `${parentPath}/${childCnt.rn}`;
            if (!allCntPaths.has(childPath)) {
              console.log(`      Found missing CNT via rcn=4: ${childPath}`);
              allCntPaths.add(childPath);
            }
          }
        }
      } catch (error) {
        // rcn=4 실패는 무시 (CIN이 너무 많은 경우 등)
      }
    }

    console.log(`    Total CNT paths after rcn=4 check: ${allCntPaths.size}`);

    // 3. 모든 CNT의 실제 속성 가져오기 - 병렬 처리
    const cntDataMap = new Map();
    const cntPathsArray = Array.from(allCntPaths);

    // 배치 단위로 병렬 처리 (10개씩)
    const batchSize = 10;
    for (let i = 0; i < cntPathsArray.length; i += batchSize) {
      const batch = cntPathsArray.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (path) => {
          const cntData = await http_resource_retrieve(this.originator, host, port, path, '');
          return { path, cnt: cntData['m2m:cnt'] };
        })
      );

      // 성공한 결과만 Map에 추가
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          cntDataMap.set(result.value.path, result.value.cnt);
        } else if (result.status === 'rejected') {
          console.warn(`    Failed to retrieve CNT`);
        }
      }
    }

    console.log(`    Retrieved ${cntDataMap.size}/${allCntPaths.size} CNTs with real attributes`);

    // 4. 트리 구조 생성
    const rootCnts = [];
    const pathToChildren = new Map();

    // 부모-자식 관계 파악
    for (const [path, cnt] of cntDataMap.entries()) {
      const parts = path.split('/');
      const parentPath = parts.slice(0, -1).join('/');

      if (!pathToChildren.has(parentPath)) {
        pathToChildren.set(parentPath, []);
      }
      pathToChildren.get(parentPath).push({ path, cnt });
    }

    // 재귀적으로 트리 구성 (CIN 5개 + SUB 전체 자동 로드)
    const buildTree = async (parentPath) => {
      const children = pathToChildren.get(parentPath) || [];
      const result = [];

      for (const { path, cnt } of children) {
        // 1. 자식 CNT 재귀 로드
        const childCnts = await buildTree(path);
        if (childCnts.length > 0) {
          cnt['m2m:cnt'] = childCnts;
        }

        // 2. CIN 로드 (최신 5개, 손상된 것 제외) - 병렬 처리
        try {
          // 손상된 리소스를 고려하여 더 많이 가져옴
          const cinDiscovery = await http_resource_retrieve(this.originator, host, port, path, 'fu=1&ty=4&lim=20');
          const cinUris = cinDiscovery['m2m:uril'] || [];

          if (cinUris.length > 0) {
            cnt['m2m:cin'] = [];
            const targetCount = 5; // 목표 CIN 개수

            // 병렬 요청 (배치 크기: 10개씩)
            const batchSize = 10;
            for (let i = 0; i < cinUris.length && cnt['m2m:cin'].length < targetCount; i += batchSize) {
              const batch = cinUris.slice(i, i + batchSize);

              // 배치 내 모든 요청을 병렬로 실행
              const results = await Promise.allSettled(
                batch.map(async (cinUri) => {
                  const cleanCinUri = cinUri.startsWith('/') ? cinUri.substring(1) : cinUri;
                  const cinData = await http_resource_retrieve(this.originator, host, port, cleanCinUri, '');
                  return cinData['m2m:cin'];
                })
              );

              // 성공한 결과만 추가
              for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                  cnt['m2m:cin'].push(result.value);
                  if (cnt['m2m:cin'].length >= targetCount) {
                    break;
                  }
                } else if (result.status === 'rejected') {
                  // 실패는 조용히 무시 (이미 손상된 리소스 예상)
                }
              }
            }
            console.log(`      Loaded ${cnt['m2m:cin'].length} CINs for ${path}`);
          }
        } catch (error) {
          // No CIN found, ignore
        }

        // 3. SUB 로드 (최신 1개만)
        try {
          const subDiscovery = await http_resource_retrieve(this.originator, host, port, path, 'fu=1&ty=23&lim=1');
          const subUris = subDiscovery['m2m:uril'] || [];

          if (subUris.length > 0) {
            cnt['m2m:sub'] = [];

            // 최신 1개 SUB만 로드
            const results = await Promise.allSettled(
              subUris.map(async (subUri) => {
                const cleanSubUri = subUri.startsWith('/') ? subUri.substring(1) : subUri;
                const subData = await http_resource_retrieve(this.originator, host, port, cleanSubUri, '');
                return subData['m2m:sub'];
              })
            );

            // 성공한 결과만 추가
            cnt['m2m:sub'] = results
              .filter(r => r.status === 'fulfilled' && r.value)
              .map(r => r.value);

            console.log(`      Loaded ${cnt['m2m:sub'].length} SUBs for ${path}`);
          }
        } catch (error) {
          // No SUB found, ignore
        }

        result.push(cnt);
      }

      return result;
    };

    return await buildTree(cleanAeUri);
  },

  // URI 목록에서 CNT 트리 구조 생성 (virtual 속성 사용)
  buildCntTreeFromUris(cntUris, aeUri) {
    const cleanAeUri = aeUri.startsWith('/') ? aeUri.substring(1) : aeUri;
    const aePathParts = cleanAeUri.split('/');

    // CNT들을 경로별로 그룹화
    const cntMap = new Map();

    for (const uri of cntUris) {
      const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
      const parts = cleanUri.split('/');

      // AE 경로 이후의 부분만 추출
      const cntPath = parts.slice(aePathParts.length);
      if (cntPath.length === 0) continue;

      // 각 레벨의 CNT 경로 저장
      let currentPath = '';
      for (let i = 0; i < cntPath.length; i++) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${cntPath[i]}` : cntPath[i];

        if (!cntMap.has(currentPath)) {
          cntMap.set(currentPath, {
            rn: cntPath[i],
            ri: `virtual-${currentPath.replace(/\//g, '-')}`,
            ty: 3,
            ct: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
            lt: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
            mni: 1000,
            parentPath: parentPath,
            children: []
          });
        }
      }
    }

    // 트리 구조 생성
    const rootCnts = [];
    const pathToNode = new Map();

    // 모든 CNT를 순회하며 부모-자식 관계 설정
    for (const [path, cnt] of cntMap.entries()) {
      if (cnt.parentPath === '') {
        // 루트 레벨 CNT
        rootCnts.push(cnt);
        pathToNode.set(path, cnt);
      } else {
        // 부모 CNT 찾기
        const parentCnt = cntMap.get(cnt.parentPath);
        if (parentCnt) {
          parentCnt.children.push(cnt);
          pathToNode.set(path, cnt);
        }
      }
    }

    // children 배열을 m2m:cnt로 변환
    function convertChildren(cnt) {
      if (cnt.children && cnt.children.length > 0) {
        cnt['m2m:cnt'] = cnt.children.map(child => convertChildren(child));
        delete cnt.children;
      } else {
        delete cnt.children;
      }
      return cnt;
    }

    return rootCnts.map(cnt => convertChildren(cnt));
  },

  convertNode(node, nodeName, depth = 0, excludeCIN = false) {
        const baseAttrs = {};
        const defaultKeys = [
            'rn',
            'ri',
            'ct',
            'lt',
            'ty',
            'cst',
            'csi',
            'srt',
            'srv',
            'rr',
            'poa',
            'cbs'  // child resource count
        ];

        defaultKeys.forEach((key) => {
            if (node[key] !== undefined) {
                baseAttrs[key] = node[key];
            }
        });

        const typeSchema = resourceAttributes[node.ty];
        if (typeSchema) {
            Object.keys(typeSchema).forEach((key) => {
                if (node[key] !== undefined) {
                    baseAttrs[key] = node[key];
                }
            });
        }

        // 토글 제거: 모든 리소스의 hasChildren = false (토글 버튼 숨김)
        // CIN과 SUB는 자동 로드되어 항상 표시됨
        const hasChildren = false;

        const result = {
            name: nodeName,
            ty: node.ty,
            id: node.ri || '',
            tasks: [],
            attrs: baseAttrs,
            selected: false,
            createdOnServer: true,  // 서버에서 로드한 리소스이므로 이미 서버에 존재

            // Lazy loading 상태
            expanded: true,          // 기본은 펼쳐진 상태 (자동 펼침)
            hasChildren: hasChildren,  // 항상 false (토글 숨김)
            childrenLoaded: true,    // 자식이 이미 로드되어 있음
            childCount: 0,           // 자식 개수
            childType: null          // 자식 타입
        };

        // CNT의 경우 cni (currentNumberOfInstances) 속성 저장 (통계 목적)
        if (node.ty === 3 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 4; // CIN
        }

        // 자식노드에 재귀적 요청
        let hasCINChildren = false;
        for (const key in node) {
            if (node.hasOwnProperty(key) && key.startsWith('m2m:') && Array.isArray(node[key])) {
                // CIN 제외 옵션이 켜져 있고 CIN 자식이면 스킵
                if (excludeCIN && key === 'm2m:cin') {
                    hasCINChildren = true;
                    console.log(`[convertNode] Skipping CIN children for ${nodeName} (${node[key].length} CINs)`);
                    continue;
                }

                const childNodeName = key.replace('m2m:', '').toUpperCase();
                // depth를 1 증가시켜서 재귀 호출 (excludeCIN 전달)
                result.tasks.push(...node[key].map(child => this.convertNode(child, childNodeName, depth + 1, excludeCIN)));
            }
        }

        // 모든 리소스는 이미 펼쳐진 상태 (토글 없음)
        // 자식이 있든 없든 항상 expanded = true, childrenLoaded = true

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

    // Full conversion - rcn=4로 받은 전체 트리를 재귀적으로 파싱 (CIN 제외)
    convertListToFileFormatFull(data) {
        const rootNode = data['m2m:cb'];
        if (!rootNode) {
            console.error("rootNode is undefined. Data:", data);
            return [];
        }

        const rootAttrs = {};
        const defaultKeys = [
            'rn',
            'ri',
            'ct',
            'lt',
            'ty',
            'cst',
            'csi',
            'srt',
            'srv',
            'rr',
            'poa',
            'cbs'
        ];

        defaultKeys.forEach((key) => {
            if (rootNode[key] !== undefined) {
                rootAttrs[key] = rootNode[key];
            }
        });

        const typeSchema = resourceAttributes[rootNode.ty];
        if (typeSchema) {
            Object.keys(typeSchema).forEach((key) => {
                if (rootNode[key] !== undefined) {
                    rootAttrs[key] = rootNode[key];
                }
            });
        }

        const convertedData = {
            name: "CSE1",
            ty: rootNode.ty,
            tasks: [],
            attrs: rootAttrs,
            selected: false,
            createdOnServer: true,
            expanded: true,
            hasChildren: true,
            childrenLoaded: true,
            allResourcesLoaded: true,
            savedExpandState: null,
            allCollapsed: false
        };

        // CSE의 모든 자식을 재귀적으로 파싱 (CIN, SUB 포함)
        // depth = 0 for CSE's children, so they become depth = 1
        // 1. ACP 먼저 추가
        if (rootNode['m2m:acp'] && Array.isArray(rootNode['m2m:acp'])) {
            convertedData.tasks.push(...rootNode['m2m:acp'].map(child => this.convertNode(child, 'ACP', 1, false)));
        }

        // 2. AE 추가
        if (rootNode['m2m:ae'] && Array.isArray(rootNode['m2m:ae'])) {
            convertedData.tasks.push(...rootNode['m2m:ae'].map(child => this.convertNode(child, 'AE', 1, false)));
        }

        // 3. 다른 리소스 타입도 추가 (GRP, SUB, CNT 등)
        for (const key in rootNode) {
            if (rootNode.hasOwnProperty(key) && key.startsWith('m2m:') && Array.isArray(rootNode[key])) {
                // ACP, AE는 이미 처리했으므로 스킵
                if (key === 'm2m:acp' || key === 'm2m:ae') {
                    continue;
                }
                const childNodeName = key.replace('m2m:', '').toUpperCase();
                // convertNode with excludeCIN = false, CIN과 SUB 포함
                convertedData.tasks.push(...rootNode[key].map(child => this.convertNode(child, childNodeName, 1, false)));
            }
        }

        console.log('[convertListToFileFormatFull] Converted CSE with', convertedData.tasks.length, 'children recursively (including CIN and SUB)');
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
          // Skip checkData for now - too strict validation causes issues
          // if (!this.checkData(parsedData[0])) {
          //   window.location.reload();
          //   return;
          // }
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
      if(data.ty === RT.CSE) { /* CSE */
        // CSE 최소 검증: ty만 확인
        if(attributeCSE && attributeCSE.ty !== undefined && attributeCSE.ty !== RT.CSE) {
          console.error("[checkData] CSE ty mismatch:", attributeCSE.ty, "expected:", RT.CSE);
          alert("Invalid Loading(CSE)");
          return false;
        }
        // 나머지 CSE 속성은 관대하게 처리
      }

      for (const task of data.tasks) { // Recursively check the tasks of this task by calling this function again
        if (Array.isArray(task.tasks)) { /* childResource */
          if (task.tasks.some(subTask => !allowedResourcesMap[task.name].includes(subTask.name))) {
            alert("Invalid ChildResource: ", task.name); 
            return false;
          }
        }
        const attribute = task.attrs;

        if(task.ty === RT.ACP){ /* ACP */
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
        else if(task.ty === RT.AE){ /* AE */
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
        else if(task.ty === RT.CNT){ /* CNT */
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
        else if(task.ty === RT.CIN){ /* CIN */
          if(
            (attribute.ty !== RT.CIN) ||                                                                                                      // Mandatory Attribute
            (typeof attribute.con !== "undefined" && typeof attribute.con !== 'string') ||                                                    // content
            (typeof attribute.cnf !== "undefined" && typeof attribute.cnf !== 'string') ||                                                    // contentInfo
            (typeof attribute.cs !== "undefined" && (!Number.isInteger(attribute.cs) || attribute.cs < 0)) ||                                // contentSize
            (typeof attribute.or !== "undefined" && typeof attribute.or !== 'string')                                                         // ontologyRef
          ){
            alert("Invalid Loading(CIN)");
            return false;
          }
        }
        else if(task.ty === RT.SUB){ /* SUB */
          if(
            (typeof attribute.nu == "undefined" || attribute.ty !== RT.SUB) ||                                                                // Mandatory Attribute
            (typeof attribute.lbl !== "undefined" && !/^[a-zA-Z0-9:]*$/.test(attribute.lbl)) ||                                               // labels
            (typeof attribute.acpi !== "undefined" && typeof attribute.acpi !== 'string') ||                                                  // accessControlPolicyIDs
            (typeof attribute.cr !== "undefined" && typeof attribute.cr !== 'boolean') ||                                                     // creator
            (typeof attribute.nu !== "undefined" && !Array.isArray(attribute.nu) && typeof attribute.nu !== 'string') ||                      // notificationURI (can be array or string)
            (typeof attribute.su !== "undefined" && typeof attribute.su !== 'string') ||                                                      // subscriberURI
            (typeof attribute.nec !== "undefined" && (attribute.nec < 1 || attribute.nec > 4)) ||                                             // notificationEventCat (1-4)
            (typeof attribute.ln !== "undefined" && typeof attribute.ln !== 'boolean') ||                                                     // latestNotify
            (typeof attribute.nct !== "undefined" && (attribute.nct < 1 || attribute.nct > 5))                                                // notificationContentType
            ){
            alert("Invalid Loading(SUB)");
            return false;
          }
        }
        else if(task.ty === RT.GRP){ /* GRP */
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
        else {
          // Unknown resource type - skip validation
          console.warn(`[checkData] Unknown resource type ${task.ty}, skipping validation for ${task.name || 'unnamed resource'}`);
        } 

        if(!this.checkData(task)) {
          return false;
        }
      }

      return true;
    },

    handleAdd(evt) {
      // Called when a resource is added to the tree via drag-and-drop
      console.log('[handleAdd] Resource added:', evt);
      this.updateFullPaths();
      this.syncSessionStorage();
    },

    handleDragStart(evt) {
      const fromElement = evt?.from;
      const isResourceTree = !!(
        fromElement &&
        (
          fromElement.classList?.contains('resourceTree') ||
          (typeof fromElement.closest === 'function' && fromElement.closest('.resourceTree'))
        )
      );

      if (isResourceTree) {
        this.updateFullPaths();
        try {
          this.treeSnapshotBeforeDrag = JSON.stringify(this.cse1);
        } catch (error) {
          console.error('Failed to snapshot resource tree:', error);
          this.treeSnapshotBeforeDrag = null;
        }

        if (evt?.item && evt.item.__draggable_context?.element) {
          this.draggedElementInfo = evt.item.__draggable_context.element;
          this.draggedElementPath = this.draggedElementInfo?.fullPath || '';
        } else {
          this.draggedElementInfo = null;
          this.draggedElementPath = '';
        }
      } else {
        this.treeSnapshotBeforeDrag = null;
        this.draggedElementInfo = null;
        this.draggedElementPath = '';
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
},

    updateFullPaths() {
      const traverse = (nodes, parentSegments) => {
        if (!Array.isArray(nodes)) {
          return;
        }

        nodes.forEach((node) => {
          if (!node) {
            return;
          }

          const segments = [...parentSegments];
          const attrs = node.attrs || {};
          const segmentName = attrs.rn && attrs.rn !== '' ? attrs.rn : (node.name || '');
          if (segmentName) {
            segments.push(segmentName);
          }

          node.fullPath = segments.join('/');

          if (Array.isArray(node.tasks) && node.tasks.length > 0) {
            traverse(node.tasks, segments);
          }
        });
      };

      traverse(this.cse1, []);
    },

    syncSessionStorage() {
      try {
        sessionStorage.setItem('CSE1', JSON.stringify(this.cse1));
      } catch (error) {
        console.error('Failed to sync session storage:', error);
      }
    },

    parseTargetUrl(url) {
      try {
        const parsed = new URL(url);
        const protocol = parsed.protocol.replace(':', '');
        const host = parsed.hostname;
        const port = parsed.port || (protocol === 'https' ? '443' : '80');
        const pathname = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');

        return {
          protocol,
          host,
          port,
          basePath: pathname
        };
      } catch (error) {
        console.error('Invalid target URL:', error);
        return null;
      }
    },

    async handleDeleteZoneChange(evt) {
      console.log('🗑️ [handleDeleteZoneChange] Called with event:', evt);

      if (!evt || !evt.added || !evt.added.element) {
        console.log('🗑️ [handleDeleteZoneChange] No element to delete, returning early');
        return;
      }

      const element = evt.added.element;
      const bufferIndex = evt.added.newIndex;

      console.log('🗑️ [handleDeleteZoneChange] Element to delete:', {
        name: element.name,
        rn: element?.attrs?.rn,
        ri: element?.attrs?.ri,
        createdOnServer: element.createdOnServer,
        fullPath: element.fullPath
      });

      if (typeof bufferIndex === 'number' && bufferIndex > -1) {
        this.deleteBuffer.splice(bufferIndex, 1);
      } else {
        this.deleteBuffer.length = 0;
      }

      try {
        console.log('🗑️ [handleDeleteZoneChange] Calling deleteResourceFromServer...');
        await this.deleteResourceFromServer(element);
        console.log('🗑️ [handleDeleteZoneChange] Delete successful, updating UI...');

        this.updateFullPaths();
        this.syncSessionStorage();

        if (this.selectedElement && this.selectedElement.id === element.id) {
          this.selectedElement = {};
          this.attrSetting = false;
        }
      } catch (error) {
        console.error('🗑️ [handleDeleteZoneChange] ❌ Resource delete failed:', error);
        alert(error?.message || '리소스 삭제에 실패했습니다.');
        this.restoreTreeSnapshot();
      } finally {
        console.log('🗑️ [handleDeleteZoneChange] Cleanup...');
        this.deleteBuffer.length = 0;
        this.draggedElementInfo = null;
        this.draggedElementPath = '';
        this.isDragging = false;
        this.treeSnapshotBeforeDrag = null;
      }
    },

    async deleteResourceFromServer(element) {
      // Validate element
      if (!element) {
        throw new Error('삭제할 리소스를 찾을 수 없습니다.');
      }

      console.log('[DELETE] Starting deletion process for:', {
        name: element.name,
        rn: element?.attrs?.rn,
        ri: element?.attrs?.ri,
        createdOnServer: element.createdOnServer,
        fullPath: element.fullPath
      });

      // Check if we have enough information to attempt deletion
      const hasRI = !!element?.attrs?.ri;
      const hasRN = !!element?.attrs?.rn;
      const hasFullPath = !!element.fullPath;
      const isFromServer = element.createdOnServer;

      // Skip deletion ONLY if:
      // 1. It's not from server AND
      // 2. Has no RI AND
      // 3. Has no RN AND
      // 4. Has no fullPath
      if (!isFromServer && !hasRI && !hasRN && !hasFullPath) {
        console.warn('[DELETE] ⚠️ Skipping server delete - no resource information available');
        console.warn('[DELETE] This appears to be a template resource that was never created.');
        return;
      }

      // If we have some information, try to delete
      if (!isFromServer && (hasRI || hasRN || hasFullPath)) {
        console.warn('[DELETE] ⚠️ Resource not marked as createdOnServer, but has resource info');
        console.warn('[DELETE] Will attempt deletion anyway...');
      }

      // Validate target IP
      if (!this.targetIP || this.targetIP === '') {
        throw new Error('CSE IP 주소를 먼저 입력하세요.');
      }

      // Parse target URL
      const target = this.parseTargetUrl(this.targetIP);
      if (!target) {
        throw new Error('CSE 주소 형식이 올바르지 않습니다.');
      }

      if (target.protocol !== 'http') {
        throw new Error('현재는 HTTP만 지원합니다.');
      }

      // Build resource path from available information
      let resourcePath = '';
      let pathSource = '';

      // Priority 1: Use fullPath (most accurate hierarchical path)
      if (element.fullPath || this.draggedElementPath) {
        const fullPath = element.fullPath || this.draggedElementPath;
        // fullPath already contains the complete hierarchy
        // Example: "TinyIoT/TinyFarm-TEST/Sensors/CO2/snclkcnknknkn"
        resourcePath = fullPath;
        pathSource = 'fullPath';
        console.log('[DELETE] ✅ Using fullPath:', resourcePath);
      }
      // Priority 2: Use rn (resource name) - works for direct children
      else if (element?.attrs?.rn) {
        resourcePath = element.attrs.rn;
        pathSource = 'RN';
        console.log('[DELETE] ⚠️ Using RN (no fullPath available):', resourcePath);
      }
      // Priority 3: Use ri as last resort (but often doesn't work with TinyIoT)
      else if (element?.attrs?.ri) {
        resourcePath = element.attrs.ri;
        pathSource = 'RI';
        console.log('[DELETE] ⚠️ Using RI (last resort):', resourcePath);
      }

      if (!resourcePath) {
        throw new Error('리소스 경로를 계산할 수 없습니다. RN 또는 RI를 확인하세요.');
      }

      // Combine basePath with resourcePath
      const basePath = target.basePath || '';
      let finalPath;

      // If resourcePath already includes basePath, use as-is
      if (resourcePath.startsWith(basePath + '/') || resourcePath === basePath) {
        finalPath = resourcePath;
        console.log('[DELETE] ✅ Path already complete (contains basePath)');
      }
      // If resourcePath starts with basePath (but no slash), still use as-is
      else if (basePath && resourcePath.startsWith(basePath)) {
        finalPath = resourcePath;
        console.log('[DELETE] ✅ Path already complete (starts with basePath)');
      }
      // Otherwise, combine basePath + resourcePath
      else {
        finalPath = basePath ? `${basePath}/${resourcePath}` : resourcePath;
        console.log('[DELETE] ⚙️ Combined basePath + resourcePath');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[DELETE] 🔍 Path construction:');
      console.log('  📌 Source:', pathSource);
      console.log('  📌 Target IP:', this.targetIP);
      console.log('  📌 Parsed basePath:', basePath);
      console.log('  📌 Resource path:', resourcePath);
      console.log('  📌 Final path:', finalPath);
      console.log('  📌 Full URL:', `${target.protocol}://${target.host}:${target.port}/${finalPath}`);
      console.log('  📌 Element info:', {
        rn: element?.attrs?.rn,
        ri: element?.attrs?.ri,
        fullPath: element.fullPath,
        createdOnServer: element.createdOnServer
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      try {
        console.log('[DELETE] 🚀 Sending DELETE request to:', finalPath);
        await http_resource_delete(
          this.originator,
          target.protocol,
          target.host,
          target.port,
          finalPath
        );

        console.log('[DELETE] Success!');
        alert('리소스가 성공적으로 삭제되었습니다.');

        // Mark as not created on server
        element.createdOnServer = false;
        this.treeSnapshotBeforeDrag = null;

      } catch (error) {
        console.error('[DELETE] Failed:', error);

        // Check if it's a 404 (resource not found)
        if (error?.response?.status === 404) {
          const confirmDelete = confirm(
            '서버에서 리소스를 찾을 수 없습니다.\n' +
            '로컬 트리에서만 삭제하시겠습니까?'
          );
          if (confirmDelete) {
            console.log('[DELETE] Resource not found on server, removing from local tree only');
            element.createdOnServer = false;
            return;
          }
        }

        throw error;
      }
    },

    getElementLabel(element) {
      if (!element) {
        return '';
      }

      if (element.attrs && element.attrs.rn) {
        return element.attrs.rn;
      }

      return element.name || '';
    },

    restoreTreeSnapshot() {
      if (!this.treeSnapshotBeforeDrag) {
        return;
      }
      try {
        const restored = JSON.parse(this.treeSnapshotBeforeDrag);
        if (Array.isArray(restored)) {
          this.cse1 = restored;
          this.updateFullPaths();
          this.syncSessionStorage();
        }
      } catch (error) {
        console.error('Failed to restore tree snapshot:', error);
      } finally {
        this.treeSnapshotBeforeDrag = null;
        this.draggedElementInfo = null;
        this.isDragging = false;
      }
    },

    // ===== WebSocket & Real-time Sync Methods =====

    async connectWebsocket() {
      if (!this.realtimeSyncEnabled) {
        // 실시간 동기화 시작
        console.log('[REALTIME] Starting real-time sync...');

        if (!this.targetIP) {
          alert('먼저 CSE를 로드해주세요.');
          return;
        }

        try {
          // 1. MQTT 연결
          await this.connectMQTT();

          // 2. CSE root Subscription 생성 (기존 SUB 재사용 또는 새로 생성)
          await this.createSubscription();

          // 3. 모든 CNT에 Subscription 생성
          console.log('[REALTIME] Creating subscriptions for all CNTs...');
          const stats = await this.createSubscriptionsForAllCNTs();
          console.log(`[REALTIME] Subscription stats: ${stats.created} created, ${stats.reused} reused, ${stats.errors} errors out of ${stats.total} CNTs`);

          this.realtimeSyncEnabled = true;
          console.log('[REALTIME] ✅ Real-time sync enabled');
        } catch (error) {
          console.error('[REALTIME] Failed to enable real-time sync:', error);
          const errorMsg = error?.message || error?.toString() || '알 수 없는 오류';
          alert('실시간 동기화 시작 실패: ' + errorMsg);
          this.disconnectMQTT();
        }
      } else {
        // 실시간 동기화 중지
        console.log('[REALTIME] Stopping real-time sync...');
        this.disconnectMQTT();
        // NOTE: Subscription은 삭제하지 않고 재사용을 위해 유지
        this.realtimeSyncEnabled = false;
        console.log('[REALTIME] ✅ Real-time sync disabled');
      }
    },

    connectMQTT() {
      return new Promise((resolve, reject) => {
        // targetIP에서 호스트 추출
        const target = this.parseTargetUrl(this.targetIP);
        if (!target) {
          reject(new Error('Invalid targetIP'));
          return;
        }

        const mqttBrokerUrl = `ws://${target.host}:9001`;  // WebSocket 포트 9001

        console.log('[MQTT] Connecting to MQTT broker...');
        console.log('[MQTT] Broker:', mqttBrokerUrl);
        console.log('[MQTT] Topic:', this.mqttTopic);

        this.mqttClient = mqtt.connect(mqttBrokerUrl, {
          // 로컬 mosquitto는 인증 불필요
        });

        this.mqttClient.on('connect', () => {
          console.log('[MQTT] ✅ Connected to broker');

          // 토픽 구독
          this.mqttClient.subscribe(this.mqttTopic, (err) => {
            if (err) {
              console.error('[MQTT] Subscription failed:', err);
              reject(new Error('MQTT 구독 실패'));
            } else {
              console.log('[MQTT] ✅ Subscribed to topic:', this.mqttTopic);
              resolve();
            }
          });
        });

        this.mqttClient.on('message', (topic, message) => {
          try {
            console.log('[MQTT] Message received on topic:', topic);
            console.log('[MQTT] Raw message:', message.toString());

            const rawData = JSON.parse(message.toString());
            console.log('[MQTT] Parsed data:', rawData);

            // Transform oneM2M format to App.vue format
            const transformedData = this.transformOneM2MNotification(rawData);
            if (transformedData) {
              this.handleNotification(transformedData);
            } else {
              console.error('[MQTT] Failed to transform notification');
            }
          } catch (error) {
            console.error('[MQTT] Failed to parse message:', error);
            console.error('[MQTT] Error details:', error.stack);
          }
        });

        this.mqttClient.on('error', (error) => {
          console.error('[MQTT] Connection error:', error);
          reject(new Error('MQTT 연결 실패: ' + error.message));
        });

        this.mqttClient.on('close', () => {
          console.log('[MQTT] Connection closed');
          this.realtimeSyncEnabled = false;
        });

        // 10초 타임아웃
        setTimeout(() => {
          if (!this.mqttClient || !this.mqttClient.connected) {
            reject(new Error('MQTT connection timeout'));
          }
        }, 10000);
      });
    },

    disconnectMQTT() {
      if (this.mqttClient) {
        this.mqttClient.end();
        this.mqttClient = null;
        console.log('[MQTT] Disconnected from broker');
      }
    },

    async createSubscription(resourcePath = null) {
      console.log('[SUBSCRIPTION] targetIP:', this.targetIP);
      console.log('[SUBSCRIPTION] resourcePath:', resourcePath);

      if (!this.targetIP) {
        throw new Error('CSE를 먼저 로드해주세요');
      }

      const target = this.parseTargetUrl(this.targetIP);
      if (!target) {
        throw new Error(`잘못된 URL 형식입니다: ${this.targetIP}`);
      }

      // resourcePath가 제공되면 해당 경로 사용, 없으면 CSE root (basePath) 사용
      const targetPath = resourcePath || target.basePath;
      console.log('[SUBSCRIPTION] Creating or finding subscription on:', targetPath);

      // 1. 먼저 기존 Subscription 찾기 (designToolSub으로 시작하는 것)
      try {
        const url = `http://${target.host}:${target.port}/${targetPath}?fu=1&ty=23`;
        console.log('[SUBSCRIPTION] Checking existing subscriptions:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-M2M-Origin': this.originator,
            'X-M2M-RVI': '2a',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const uriList = result?.['m2m:uril'] || [];
          console.log('[SUBSCRIPTION] Found subscriptions:', uriList);

          // designToolSub으로 시작하는 것 찾기
          const existingSub = uriList.find(uri => {
            const parts = uri.split('/');
            const lastName = parts[parts.length - 1];
            return lastName.startsWith('designToolSub');
          });

          if (existingSub) {
            // 기존 SUB의 nu 확인 (MQTT인지 체크)
            try {
              const subUrl = `http://${target.host}:${target.port}/${existingSub}`;
              const subResponse = await fetch(subUrl, {
                method: 'GET',
                headers: {
                  'X-M2M-Origin': this.originator,
                  'X-M2M-RVI': '2a',
                  'Accept': 'application/json'
                }
              });

              if (subResponse.ok) {
                const subData = await subResponse.json();
                const nu = subData?.['m2m:sub']?.nu || [];

                // 올바른 MQTT broker URL 생성 (현재 targetIP 기준)
                const expectedMqttNu = `mqtt://${target.host}:1883/designTool`;

                // nu 배열에 올바른 MQTT URL이 있는지 확인
                const hasCorrectMqtt = nu.includes(expectedMqttNu);

                if (hasCorrectMqtt) {
                  // 올바른 MQTT SUB이면 재사용
                  const parts = existingSub.split('/');
                  const subName = parts[parts.length - 1];
                  if (!resourcePath) {
                    // CSE root subscription만 subscriptionResourceName에 저장
                    this.subscriptionResourceName = subName;
                    this.subscriptionCreated = true;
                  }
                  console.log('[SUBSCRIPTION] ✅ Reusing existing MQTT subscription:', subName, 'at', targetPath);
                  return { success: true, subscriptionName: subName, reused: true };
                } else {
                  // 잘못된 SUB이면 삭제 (HTTP이거나 잘못된 MQTT broker URL)
                  const oldType = nu.some(url => url.startsWith('mqtt://')) ? 'old MQTT broker' : 'HTTP';
                  console.log(`[SUBSCRIPTION] ⚠️ Found ${oldType} subscription, deleting:`, existingSub);
                  console.log(`[SUBSCRIPTION] Expected: ${expectedMqttNu}, Got: ${nu[0]}`);
                  await fetch(subUrl, {
                    method: 'DELETE',
                    headers: {
                      'X-M2M-Origin': this.originator,
                      'X-M2M-RVI': '2a'
                    }
                  });
                  console.log('[SUBSCRIPTION] ✅ Old subscription deleted');
                }
              }
            } catch (error) {
              console.log('[SUBSCRIPTION] Error checking existing sub:', error);
            }
          }
        }
      } catch (error) {
        console.log('[SUBSCRIPTION] No existing subscription found, will create new one');
      }

      // 2. 기존 SUB가 없으면 새로 생성
      const subscriptionName = 'designToolSub_' + Date.now();

      // targetIP에서 호스트 추출하여 MQTT nu 생성
      const mqttNu = `mqtt://${target.host}:1883/designTool`;

      const subscriptionData = {
        'm2m:sub': {
          rn: subscriptionName,
          nu: [mqttNu], // 동적으로 생성된 MQTT broker 주소
          enc: {
            net: [1, 2, 3, 4] // UPDATE, DELETE_RESOURCE, CREATE_CHILD, DELETE_CHILD
          }
        }
      };

      try {
        const url = `http://${target.host}:${target.port}/${targetPath}`;
        console.log('[SUBSCRIPTION] POST to:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'X-M2M-Origin': this.originator,
            'Content-Type': 'application/json;ty=23',
            'X-M2M-RVI': '2a'
          },
          body: JSON.stringify(subscriptionData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('[SUBSCRIPTION] Response:', result);

        if (!resourcePath) {
          // CSE root subscription만 subscriptionResourceName에 저장
          this.subscriptionCreated = true;
          this.subscriptionResourceName = subscriptionName;
        }
        console.log('[SUBSCRIPTION] ✅ Subscription created:', subscriptionName, 'at', targetPath);
        return { success: true, subscriptionName, reused: false, result };
      } catch (error) {
        console.error('[SUBSCRIPTION] Failed to create:', error);
        throw error;
      }
    },

    async createSubscriptionsForAllCNTs() {
      console.log('[SUBSCRIPTION] 🚀 Starting to create subscriptions for all CNTs...');

      if (!this.cse1 || !Array.isArray(this.cse1) || this.cse1.length === 0 || !this.cse1[0] || !this.cse1[0].tasks) {
        console.log('[SUBSCRIPTION] No resources loaded yet');
        return { total: 0, created: 0, reused: 0, errors: 0 };
      }

      const stats = { total: 0, created: 0, reused: 0, errors: 0 };

      // 재귀적으로 모든 CNT 찾기
      const findAllCNTs = (node, parentPath = '') => {
        const cnts = [];

        if (node.ty === 3) {
          // CNT 타입인 경우
          const fullPath = parentPath ? `${parentPath}/${node.attrs.rn}` : node.attrs.rn;
          cnts.push({ name: node.attrs.rn, path: fullPath });
        }

        // 자식 노드 탐색
        if (node.tasks && Array.isArray(node.tasks)) {
          const currentPath = node.attrs?.rn
            ? (parentPath ? `${parentPath}/${node.attrs.rn}` : node.attrs.rn)
            : parentPath;

          for (const child of node.tasks) {
            cnts.push(...findAllCNTs(child, currentPath));
          }
        }

        return cnts;
      };

      // CSE의 모든 자식에서 CNT 찾기
      let allCNTs = [];
      const cseRoot = this.cse1[0]; // cse1은 배열이므로 첫 번째 요소가 CSE
      if (cseRoot && cseRoot.tasks) {
        for (const task of cseRoot.tasks) {
          allCNTs.push(...findAllCNTs(task, cseRoot.attrs.rn));
        }
      }

      console.log(`[SUBSCRIPTION] Found ${allCNTs.length} CNT(s):`, allCNTs.map(c => c.path));
      stats.total = allCNTs.length;

      // 각 CNT에 Subscription 생성
      for (const cnt of allCNTs) {
        try {
          console.log(`[SUBSCRIPTION] Creating subscription for CNT: ${cnt.path}`);
          const result = await this.createSubscription(cnt.path);

          if (result.reused) {
            stats.reused++;
          } else {
            stats.created++;
          }
        } catch (error) {
          console.error(`[SUBSCRIPTION] Failed to create subscription for ${cnt.path}:`, error);
          stats.errors++;
        }
      }

      console.log('[SUBSCRIPTION] ✅ Subscription creation completed:', stats);
      return stats;
    },

    transformOneM2MNotification(notificationData) {
      console.log('[TRANSFORM] Processing oneM2M notification:', notificationData);

      // Check if this is already transformed data
      if (notificationData.type === 'resource_change') {
        console.log('[TRANSFORM] Already in App.vue format');
        return notificationData;
      }

      // Extract m2m:sgn structure
      const sgn = notificationData['m2m:sgn'];
      if (!sgn) {
        console.error('[TRANSFORM] No m2m:sgn found in notification');
        return null;
      }

      const nev = sgn.nev || {};
      let net = nev.net || 0;
      const rep = nev.rep || {};
      const sur = sgn.sur || '';

      // TinyIoT bug workaround: DELETE event with resource data is actually CREATE
      if ((net === 3 || net === 4) && rep) {
        // Check if rep has resource data
        const resourceKey = Object.keys(rep).find(key => key.startsWith('m2m:'));
        if (resourceKey) {
          console.log('[TRANSFORM] ⚠️ TinyIoT bug detected: DELETE(' + net + ') -> CREATE(1)');
          net = 1; // CREATE_OF_DIRECT_CHILD_RESOURCE
        }
      }

      // Calculate actual resource URI from subscription URI
      let resourceUri = sur;
      if (rep) {
        // Find resource name (rn) in rep
        let resourceName = null;
        for (const key of Object.keys(rep)) {
          if (key.startsWith('m2m:')) {
            resourceName = rep[key].rn || '';
            break;
          }
        }

        if (resourceName) {
          // Convert subscription URI to resource URI
          // Example: TinyIoT/TinyFarm/designToolSub_TinyFarm -> TinyIoT/TinyFarm/resourceName
          const uriParts = sur.split('/');
          if (uriParts.length > 0 && uriParts[uriParts.length - 1].startsWith('designToolSub')) {
            uriParts.pop(); // Remove subscription name
          }
          uriParts.push(resourceName); // Add actual resource name
          resourceUri = uriParts.join('/');
          console.log('[TRANSFORM] URI converted:', sur, '->', resourceUri);
        }
      }

      // Transform to App.vue format
      const transformed = {
        type: 'resource_change',
        eventType: net, // 1=CREATE, 2=UPDATE, 3=DELETE
        resourceUri: resourceUri,
        resource: rep
      };

      console.log('[TRANSFORM] Transformed:', transformed);
      return transformed;
    },

    handleNotification(data) {
      if (data.type !== 'resource_change') {
        return;
      }

      const { eventType, resourceUri, resource } = data;
      console.log('[NOTIFICATION]', { eventType, resourceUri, resource });

      // eventType: 1=CREATE, 2=UPDATE, 3=DELETE
      if (eventType === 1) {
        // CREATE
        this.handleResourceCreated(resourceUri, resource);
      } else if (eventType === 3) {
        // DELETE
        this.handleResourceDeleted(resourceUri);
      } else if (eventType === 2) {
        // UPDATE
        this.handleResourceUpdated(resourceUri, resource);
      }
    },

    async handleResourceCreated(uri, resource) {
      console.log('[NOTIFICATION] Resource created:', uri, resource);

      // URI에서 리소스 정보 파싱
      // 예: TinyIoT/TestAE/newContainer
      const pathParts = uri.split('/').filter(p => p.length > 0);

      if (pathParts.length < 2) {
        console.error('[NOTIFICATION] Invalid URI:', uri);
        return;
      }

      // CSE 이름 제거
      pathParts.shift(); // Remove "TinyIoT"

      // 리소스 타입 찾기 (resource 객체에서)
      let resourceType = null;
      let resourceData = null;

      // oneM2M 리소스 키 찾기 (m2m:ae, m2m:cnt, m2m:cin 등)
      for (const key of Object.keys(resource)) {
        if (key.startsWith('m2m:')) {
          resourceData = resource[key];
          const typeStr = key.split(':')[1].toUpperCase();
          // 타입 매핑
          const typeMap = {
            'AE': 2, 'CNT': 3, 'CIN': 4, 'ACP': 1,
            'GRP': 9, 'SUB': 23, 'FCNT': 7
          };
          resourceType = typeMap[typeStr];
          break;
        }
      }

      if (!resourceType || !resourceData) {
        console.error('[NOTIFICATION] Could not determine resource type:', resource);
        return;
      }

      // 부모 찾기
      let parent = this.cse1[0]; // CSE
      for (let i = 0; i < pathParts.length - 1; i++) {
        const partName = pathParts[i];
        const found = this.findResourceByName(parent.tasks, partName);
        if (!found) {
          console.error('[NOTIFICATION] Parent not found:', partName);
          return;
        }
        parent = found;
      }

      // 이미 존재하는지 확인
      const resourceName = pathParts[pathParts.length - 1];
      const existing = this.findResourceByName(parent.tasks, resourceName);
      if (existing) {
        console.log('[NOTIFICATION] Resource already exists, adding flash effect');
        this.addFlashingEffect(uri);
        return;
      }

      // 새 리소스 객체 생성
      const newResource = this.convertNodeShallow(resourceData, resourceType);

      // CIN 제한 로직: 부모가 CNT이고 새로운 리소스가 CIN인 경우
      if (resourceType === 4 && parent.ty === 3) {
        // 현재 CIN 개수 확인
        const currentCINs = parent.tasks.filter(task => task.ty === 4);
        console.log(`[NOTIFICATION] CNT ${parent.name} currently has ${currentCINs.length} CIN(s)`);

        // CIN이 5개 이상이면 가장 오래된 것부터 삭제
        if (currentCINs.length >= 5) {
          const cinsToRemove = currentCINs.length - 4; // 새로운 CIN을 추가할 공간 확보 (4개만 남김)
          console.log(`[NOTIFICATION] Removing ${cinsToRemove} oldest CIN(s) to maintain limit of 5`);

          // ct (creationTime) 기준으로 정렬 (오래된 것부터)
          const sortedCINs = currentCINs.sort((a, b) => {
            const ctA = a.attrs?.ct || '0';
            const ctB = b.attrs?.ct || '0';
            return ctA.localeCompare(ctB);
          });

          // 가장 오래된 CIN들 제거
          for (let i = 0; i < cinsToRemove; i++) {
            const cinToRemove = sortedCINs[i];
            const index = parent.tasks.findIndex(t => t.id === cinToRemove.id);
            if (index !== -1) {
              console.log(`[NOTIFICATION] Removing old CIN: ${cinToRemove.name} (ct: ${cinToRemove.attrs?.ct})`);
              parent.tasks.splice(index, 1);
            }
          }
        }
      }

      // 부모에 추가
      parent.tasks.push(newResource);

      // 번쩍이는 효과
      this.addFlashingEffect(uri);

      // UI 업데이트
      this.updateFullPaths();
      this.syncSessionStorage();

      console.log('[NOTIFICATION] ✅ Resource added to tree:', resourceName);
    },

    handleResourceDeleted(uri) {
      console.log('[NOTIFICATION] Resource deleted:', uri);

      // URI에서 리소스 정보 파싱
      const pathParts = uri.split('/').filter(p => p.length > 0);

      if (pathParts.length < 2) {
        console.error('[NOTIFICATION] Invalid URI:', uri);
        return;
      }

      // CSE 이름 제거
      pathParts.shift();

      // 부모 찾기
      let parent = this.cse1[0];
      for (let i = 0; i < pathParts.length - 1; i++) {
        const partName = pathParts[i];
        const found = this.findResourceByName(parent.tasks, partName);
        if (!found) {
          console.error('[NOTIFICATION] Parent not found:', partName);
          return;
        }
        parent = found;
      }

      // 리소스 찾기
      const resourceName = pathParts[pathParts.length - 1];
      const index = parent.tasks.findIndex(r =>
        (r.attrs && r.attrs.rn === resourceName) || r.name === resourceName
      );

      if (index !== -1) {
        const resourceToDelete = parent.tasks[index];

        // 번쩍이는 효과가 활성화되어 있으면 빨간불 효과 추가 후 3초 뒤 삭제
        if (this.flashingEffectEnabled) {
          resourceToDelete.flashing = true;
          console.log('[NOTIFICATION] ⚠️ Resource will be deleted after flashing:', resourceName);
        }

        // 효과 활성화 시 3초 후, 비활성화 시 즉시 제거
        const deleteDelay = this.flashingEffectEnabled ? 3000 : 0;
        setTimeout(() => {
          // 인덱스 다시 찾기 (3초 사이에 트리 구조가 바뀔 수 있음)
          const currentIndex = parent.tasks.findIndex(r =>
            (r.attrs && r.attrs.rn === resourceName) || r.name === resourceName
          );

          if (currentIndex !== -1) {
            parent.tasks.splice(currentIndex, 1);
            this.updateFullPaths();
            this.syncSessionStorage();
            console.log('[NOTIFICATION] ✅ Resource removed from tree:', resourceName);
          }
        }, deleteDelay);
      } else {
        console.error('[NOTIFICATION] Resource not found in tree:', resourceName);
      }
    },

    async handleResourceUpdated(uri, resource) {
      console.log('[NOTIFICATION] Resource updated:', uri, resource);

      // 업데이트는 삭제 후 재생성으로 처리
      await this.handleResourceDeleted(uri);
      await this.handleResourceCreated(uri, resource);

      // 번쩍이는 효과
      this.addFlashingEffect(uri);
    },

    async handleToggleExpand(element, side = 'default') {
      console.log('[TOGGLE] Element:', element.name, 'ty:', element.ty, 'expanded:', element.expanded);

      // 토글은 CNT(ty=3)만 처리
      if (element.ty !== 3) {
        console.log('[TOGGLE] Not a CNT, ignoring toggle');
        return;
      }

      // CNT 토글: CIN을 로드하거나 숨김
      if (!element.expanded) {
        // + 클릭 → 펼치기
        if (!element.childrenLoaded) {
          // 자식을 아직 로드하지 않았으면 서버에서 로드 (CIN은 최신 5개만)
          try {
            console.log('[TOGGLE] Loading children from server...');
            await this.loadChildren(element);
            element.childrenLoaded = true;

            // 자식이 없으면 hasChildren을 false로 설정
            if (!element.tasks || element.tasks.length === 0) {
              console.log('[TOGGLE] No children found, hiding toggle');
              element.hasChildren = false;
              return; // 펼칠 필요 없음
            }
          } catch (error) {
            console.error('[TOGGLE] Failed to load children:', error);
            alert(`자식 리소스 로드 실패: ${error.message}`);
            return;
          }
        } else {
          console.log('[TOGGLE] Children already loaded, just expanding');
        }
        element.expanded = true;
      } else {
        // − 클릭 → 접기
        element.expanded = false;
      }
    },

    // Save expand state of all resources
    saveExpandState(tasks) {
      if (!Array.isArray(tasks)) return {};

      const state = {};
      const traverse = (items, path = []) => {
        items.forEach((item, index) => {
          const currentPath = [...path, index];
          const key = currentPath.join('.');
          state[key] = {
            expanded: item.expanded || false,
            id: item.id || item.name
          };

          if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
            traverse(item.tasks, currentPath);
          }
        });
      };

      traverse(tasks);
      console.log('[SAVE STATE] Saved expand state:', state);
      return state;
    },

    // Collapse all resources recursively
    collapseAll(tasks, depth = 0) {
      if (!Array.isArray(tasks)) return 0;

      let totalCount = 0;
      const indent = '  '.repeat(depth);

      tasks.forEach(item => {
        console.log(`${indent}[COLLAPSE] Checking ${item.name || item.id}: expanded=${item.expanded}, hasChildren=${item.hasChildren}`);

        if (item.expanded) {
          console.log(`${indent}  → Collapsing ${item.name || item.id}`);
          item.expanded = false;
          totalCount++;
        }

        if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
          console.log(`${indent}  → Has ${item.tasks.length} children, recursing...`);
          totalCount += this.collapseAll(item.tasks, depth + 1);
        }
      });

      console.log(`${indent}[COLLAPSE] Collapsed ${totalCount} items at depth ${depth}`);
      return totalCount;
    },

    // Restore expand state
    restoreExpandState(tasks, savedState) {
      if (!Array.isArray(tasks) || !savedState) return;

      const traverse = (items, path = []) => {
        items.forEach((item, index) => {
          const currentPath = [...path, index];
          const key = currentPath.join('.');

          if (savedState[key]) {
            item.expanded = savedState[key].expanded;
          }

          if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
            traverse(item.tasks, currentPath);
          }
        });
      };

      traverse(tasks);
      console.log('[RESTORE STATE] Restored expand state');
    },

    // Confirm dialog for loading many CIN resources
    async confirmLoadManyCIN(element) {
      return new Promise((resolve) => {
        const message = `⚠️ 이 컨테이너에 ${element.childCount}개의 CIN 리소스가 있습니다.\n\n전체를 로드하시겠습니까?\n(취소를 누르면 로드하지 않습니다)`;

        if (confirm(message)) {
          // 전체 로드
          resolve(true);
        } else {
          // 취소
          resolve(false);
        }
      });
    },

    async loadChildren(element) {
      console.log('[LOAD CHILDREN] Loading children for:', element.name, 'path:', element.fullPath);

      if (!this.targetIP) {
        throw new Error('CSE IP 주소가 설정되지 않았습니다.');
      }

      const target = this.parseTargetUrl(this.targetIP);
      if (!target) {
        throw new Error('CSE 주소 형식이 올바르지 않습니다.');
      }

      let resourcePath = element.fullPath;
      if (!resourcePath) {
        // fullPath가 없으면 CSE base path + rn으로 구성
        if (element.attrs && element.attrs.rn) {
          resourcePath = target.basePath ? `${target.basePath}/${element.attrs.rn}` : element.attrs.rn;
        } else {
          throw new Error('리소스 경로를 찾을 수 없습니다.');
        }
      }

      console.log('[LOAD CHILDREN] Using path:', resourcePath);

      try {
        // CNT(ty=3)인 경우 CIN과 SUB를 분리해서 로드
        let childUris = [];

        if (element.ty === 3) {
          // CNT: CIN(최신 5개) + SUB(전체) 분리 로드
          console.log(`[LOAD CHILDREN] Loading CIN and SUB separately for CNT...`);

          // 1. CIN 로드 (ty=4, 최신 5개만)
          try {
            const cinUriList = await http_resource_retrieve(
              this.originator,
              target.host,
              target.port,
              resourcePath,
              'fu=1&ty=4&lim=5'  // CIN 타입, 최신 5개
            );
            const cinUris = cinUriList['m2m:uril'] || [];
            console.log(`[LOAD CHILDREN] Found ${cinUris.length} CIN(s):`, cinUris);
            childUris.push(...cinUris);
          } catch (error) {
            console.log('[LOAD CHILDREN] No CIN found or error:', error.message);
          }

          // 2. SUB 로드 (ty=23, 전체)
          try {
            const subUriList = await http_resource_retrieve(
              this.originator,
              target.host,
              target.port,
              resourcePath,
              'fu=1&ty=23'  // SUB 타입, 전체
            );
            const subUris = subUriList['m2m:uril'] || [];
            console.log(`[LOAD CHILDREN] Found ${subUris.length} SUB(s):`, subUris);
            childUris.push(...subUris);
          } catch (error) {
            console.log('[LOAD CHILDREN] No SUB found or error:', error.message);
          }
        } else {
          // CNT가 아닌 경우 기존 로직
          console.log(`[LOAD CHILDREN] Discovering direct children...`);

          const uriList = await http_resource_retrieve(
            this.originator,
            target.host,
            target.port,
            resourcePath,
            'fu=1'
          );
          childUris = uriList['m2m:uril'] || [];
        }

        console.log(`[LOAD CHILDREN] Total URIs: ${childUris.length}`, childUris);

        // 중간 경로 추출 (Discovery가 leaf만 반환하는 경우 대비)
        const cleanPath = resourcePath.startsWith('/') ? resourcePath.substring(1) : resourcePath;
        const directChildrenSet = new Set();

        for (const uri of childUris) {
          const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
          if (cleanUri.startsWith(cleanPath + '/')) {
            const remaining = cleanUri.substring(cleanPath.length + 1);
            const firstPart = remaining.split('/')[0];
            directChildrenSet.add(cleanPath + '/' + firstPart);
          }
        }

        const directChildren = Array.from(directChildrenSet);
        console.log(`[LOAD CHILDREN] Direct children: ${directChildren.length}`, directChildren);

        // 직속 자식만 사용 (이미 ty와 lim으로 필터링됨)
        childUris = directChildren;

        // 각 자식 리소스의 정보 가져오기
        const allChildren = [];
        for (const uri of childUris) {
          try {
            console.log(`[LOAD CHILDREN] Loading: ${uri}`);
            const resData = await http_resource_retrieve(
              this.originator,
              target.host,
              target.port,
              uri,
              ''
            );

            // oneM2M 응답에서 리소스 추출
            let resourceNode = null;
            for (const key of Object.keys(resData)) {
              if (key.startsWith('m2m:')) {
                resourceNode = resData[key];
                break;
              }
            }

            if (resourceNode) {
              const cbs = resourceNode.cbs;
              let hasChildren;

              console.log(`[LOAD CHILDREN] ${uri}: ty=${resourceNode.ty}, cbs=${cbs}`);

              // hasChildren은 오직 CNT(ty=3)이면서 cbs > 0인 경우만 true
              hasChildren = false;
              if (resourceNode.ty === 3) {
                if (typeof cbs === 'number' && cbs > 0) {
                  hasChildren = true;
                  console.log(`  → CNT with cbs=${cbs}, hasChildren=true`);
                } else if (cbs !== undefined && cbs !== null && cbs !== '' && !isNaN(Number(cbs))) {
                  const cbsNum = Number(cbs);
                  hasChildren = cbsNum > 0;
                  console.log(`  → CNT with cbs=${cbsNum} (converted), hasChildren=${hasChildren}`);
                } else {
                  console.log(`  → CNT with no cbs, hasChildren=false`);
                }
              } else {
                // 나머지 리소스는 hasChildren = false (토글 없이 항상 표시)
                console.log(`  → Not CNT, hasChildren=false`);
              }

              const childTypeName = this.getTypeNameFromTy(resourceNode.ty);
              const converted = this.convertNodeShallow(resourceNode, childTypeName);

              converted.hasChildren = hasChildren;
              converted.childrenLoaded = false;
              converted.attrs = converted.attrs || {};
              converted.attrs.cbs = cbs;

              allChildren.push(converted);
            }
          } catch (error) {
            console.error(`[LOAD CHILDREN] Failed to load ${uri}:`, error);
          }
        }

        console.log(`[LOAD CHILDREN] Total children loaded: ${allChildren.length}`);

        if (allChildren.length === 0) {
          console.log('[LOAD CHILDREN] No children found, hiding toggle');
          element.hasChildren = false;
          element.tasks = [];
        } else {
          element.tasks = allChildren;
        }

        element.childrenLoaded = true;
        this.updateFullPaths();
        this.syncSessionStorage();

      } catch (error) {
        console.error('[LOAD CHILDREN] Error:', error);
        throw error;
      }
    },

    // Get type name from ty number
    getTypeNameFromTy(ty) {
      const typeMap = {
        5: 'CB',
        1: 'ACP',
        2: 'AE',
        3: 'CNT',
        4: 'CIN',
        9: 'GRP',
        23: 'SUB'
      };
      return typeMap[ty] || 'UNKNOWN';
    },

    // Get resource key for oneM2M response
    getResourceKey(ty) {
      const typeMap = {
        5: 'm2m:cb',   // CSE
        1: 'm2m:acp',  // ACP
        2: 'm2m:ae',   // AE
        3: 'm2m:cnt',  // CNT
        4: 'm2m:cin',  // CIN
        9: 'm2m:grp',  // GRP
        23: 'm2m:sub'  // SUB
      };
      return typeMap[ty] || 'm2m:unknown';
    },

    findResourceByName(tasks, name) {
      if (!tasks) return null;
      return tasks.find(r =>
        (r.attrs && r.attrs.rn === name) || r.name === name
      );
    },

    convertNodeShallow(node, nodeName) {
        const baseAttrs = {};
        const defaultKeys = [
            'rn',
            'ri',
            'ct',
            'lt',
            'ty',
            'cst',
            'csi',
            'srt',
            'srv',
            'rr',
            'poa',
            'cbs'  // child resource count
        ];

        defaultKeys.forEach((key) => {
            if (node[key] !== undefined) {
                baseAttrs[key] = node[key];
            }
        });

        const typeSchema = resourceAttributes[node.ty];
        if (typeSchema) {
            Object.keys(typeSchema).forEach((key) => {
                if (node[key] !== undefined) {
                    baseAttrs[key] = node[key];
                }
            });
        }

        // hasChildren은 오직 CNT(ty=3)이면서 CIN이 있는 경우만 true
        // CNT는 cni(CIN count) 또는 cbs를 체크
        let hasChildren = false;
        if (node.ty === 3) {
            // CNT의 경우: cni(CIN count) 또는 cbs를 확인
            if (node.cni !== undefined && node.cni > 0) {
                hasChildren = true;
            } else if (node.cbs !== undefined && node.cbs > 0) {
                hasChildren = true;
            }
        }
        // 나머지 리소스들(CSE, AE, ACP, SUB 등)은 hasChildren = false (토글 없이 항상 표시)

        const result = {
            name: nodeName,
            ty: node.ty,
            id: node.ri || '',
            tasks: [],  // 빈 배열 - 자식은 + 버튼 클릭 시 로드
            attrs: baseAttrs,
            selected: false,
            createdOnServer: true,
            expanded: false,         // 접힌 상태
            hasChildren: hasChildren,
            childrenLoaded: false,   // 자식 아직 로드 안됨
            childCount: 0,
            childType: null
        };

        // CNT의 경우 cni로 CIN 개수 저장 (표시용)
        if (node.ty === 3 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 4; // CIN
        }

        return result;
    },

    buildTreeFromResources(cseInfo, resources, cseBasePath) {
      console.log(`[buildTreeFromResources] Building tree from ${resources.length} resources`);

      // CSE 노드 생성
      const cseNode = { ...cseInfo };

      // 리소스를 URI 기준으로 정렬 (부모가 자식보다 먼저 오도록)
      resources.sort((a, b) => {
        const aDepth = a.uri.split('/').length;
        const bDepth = b.uri.split('/').length;
        return aDepth - bDepth;
      });

      // 각 리소스를 트리에 추가
      for (const res of resources) {
        const uri = res.uri;
        const parts = uri.split('/');

        // CSE 경로 제거
        const cseIndex = parts.indexOf(cseBasePath);
        if (cseIndex >= 0) {
          parts.splice(0, cseIndex + 1);
        }

        if (parts.length === 0) {
          console.warn('[buildTreeFromResources] Empty path after removing CSE base');
          continue;
        }

        // 트리에서 부모 찾기
        let parent = cseNode;

        for (let i = 0; i < parts.length - 1; i++) {
          const partName = parts[i];
          const typeKey = this.findChildArrayKey(parent, partName);

          if (!typeKey || !parent[typeKey]) {
            console.warn(`[buildTreeFromResources] Parent not found for ${partName} in`, parent);
            break;
          }

          const found = parent[typeKey].find(child => child.rn === partName);
          if (!found) {
            console.warn(`[buildTreeFromResources] Child ${partName} not found in ${typeKey}`);
            break;
          }

          parent = found;
        }

        // 리소스를 부모에 추가
        const resourceName = parts[parts.length - 1];
        const typeKey = `m2m:${res.type.toLowerCase()}`;

        if (!parent[typeKey]) {
          parent[typeKey] = [];
        }

        parent[typeKey].push(res.data);
        console.log(`[buildTreeFromResources] Added ${res.type} '${resourceName}' to tree`);
      }

      return { 'm2m:cb': cseNode };
    },

    // 부모 객체에서 자식 이름에 해당하는 배열 키 찾기
    findChildArrayKey(parent, childName) {
      for (const key in parent) {
        if (key.startsWith('m2m:') && Array.isArray(parent[key])) {
          if (parent[key].some(child => child.rn === childName)) {
            return key;
          }
        }
      }
      return null;
    },

    addFlashingEffect(uri) {
      // 번쩍이는 효과가 비활성화되어 있으면 무시
      if (!this.flashingEffectEnabled) {
        console.log('[ANIMATION] Flashing effect is disabled, skipping:', uri);
        return;
      }

      console.log('[ANIMATION] Adding flashing effect to:', uri);

      // URI로 리소스 찾기
      const pathParts = uri.split('/').filter(p => p.length > 0);
      pathParts.shift(); // Remove CSE name

      let resource = this.cse1[0];
      for (const partName of pathParts) {
        const found = this.findResourceByName(resource.tasks, partName);
        if (!found) {
          console.error('[ANIMATION] Resource not found:', partName);
          return;
        }
        resource = found;
      }

      // flashing 플래그 추가
      resource.flashing = true;

      // 3초 후 제거
      setTimeout(() => {
        resource.flashing = false;
        this.syncSessionStorage(); // Vue reactivity trigger
      }, 3000);
    }
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

  beforeUnmount() {
    // MQTT 정리
    if (this.realtimeSyncEnabled) {
      this.disconnectMQTT();
    }
  }
}

</script>
<style scoped>
#app{
  overflow: hidden;
  padding-left: 15px;
  padding-right: 15px;
  box-sizing: border-box;
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
  border: 1px solid #0d1829;
  padding: 5px;
  margin-left: 10px;
  margin-right: 10px;
  background: linear-gradient(145deg, #1e3a5f, #152238);
  border-radius: 15px;
  display: flex;
  align-items: center;
  flex-direction: row;
  min-height: 20px;
  box-shadow:
    8px 8px 16px rgba(0, 0, 0, 0.3),
    -4px -4px 12px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.configure .box .key {
  width: 200px;
  text-align: center;
}

.configure .box input {
  flex-grow: 1;
  border-radius: 10px;
  padding: 8px 12px;
  width: 100%;
  border: 1px solid #ccc;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.configure .box input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1), 0 0 8px rgba(74, 144, 226, 0.3);
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow:
    10px 10px 20px rgba(0, 0, 0, 0.4),
    -5px -5px 15px rgba(255, 255, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

.button:active {
  transform: translateY(0);
  box-shadow:
    4px 4px 8px rgba(0, 0, 0, 0.3),
    -2px -2px 6px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
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

.deleteZone {
  position: relative;
  height: 10%;
  margin-bottom: 20px;
}

.delete_dragArea {
  border: 1.1px solid #4374D9;
  height: 100%;
  width: 100%;
  border-radius: 6px;
  background-color: rgba(67, 116, 217, 0.08);
}

.delete-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  color: #192749;
  pointer-events: none;
}

.delete-item {
  display: none;
}

/* 확대 뷰 모달 스타일 */
.zoom-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.zoom-view-container {
  width: 90%;
  height: 90%;
  background: #f5f5f5;
  border-radius: 15px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #4374D9;
}

.zoom-view-header {
  padding: 20px 30px;
  background: linear-gradient(145deg, #4374D9, #2a5bb8);
  border-bottom: 2px solid #1a4a8a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zoom-view-header h2 {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.close-btn {
  background: white;
  border: 2px solid #ff4444;
  color: #ff4444;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-weight: bold;
}

.close-btn:hover {
  background: #ff4444;
  color: white;
  transform: scale(1.1);
}

.zoom-view-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
}

.zoom-tree {
  font-size: 18px;
}

/* 토글 스위치 스타일 (기본) */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #2ecc71;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-slider:hover {
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
}

/* 큰 토글 스위치 스타일 */
.toggle-switch-large {
  position: relative;
  display: inline-block;
  width: 70px;
  height: 36px;
}

.toggle-switch-large input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider-large {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e74c3c;
  transition: 0.4s;
  border-radius: 36px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-slider-large:before {
  position: absolute;
  content: "";
  height: 28px;
  width: 28px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-switch-large input:checked + .toggle-slider-large {
  background-color: #2ecc71;
}

.toggle-switch-large input:checked + .toggle-slider-large:before {
  transform: translateX(34px);
}

.toggle-slider-large:hover {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 12px rgba(46, 204, 113, 0.6);
}

</style>