<template>
  <header>
    <navBar class="nav">
      <!-- 설정(톱니바퀴) 아이콘 — 타이틀 바 -->
      <div class="settings-wrapper">
        <button
          class="settings-gear"
          @click="showSettings = !showSettings"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>

        <!-- 설정 드롭다운 패널 -->
        <div v-if="showSettings" class="settings-panel">
          <div class="settings-panel-title">Settings</div>

          <div class="settings-row">
            <span class="settings-label">CSE Platform</span>
            <select v-model="csePreset" @change="onCsePresetChange" class="settings-select">
              <option value="none">None</option>
              <option value="tinyiot">TinyIoT</option>
            </select>
          </div>

          <div class="settings-row">
            <span class="settings-label">Flash Effect</span>
            <label class="toggle-switch-large">
              <input type="checkbox" v-model="flashingEffectEnabled" @change="onFlashEffectToggle" />
              <span class="toggle-slider-large"></span>
            </label>
          </div>

          <!-- Protocol 섹션 -->
          <div class="settings-divider">Protocol</div>
          <div class="settings-row">
            <span class="settings-label">Mode</span>
            <select v-model="protocolMode" @change="onProtocolChange" class="settings-select">
              <option value="http">HTTP</option>
              <option value="mqtt">MQTT</option>
            </select>
          </div>
          <div class="settings-row" v-if="protocolMode === 'mqtt'">
            <span class="settings-label">MQTT WS Port</span>
            <input type="text" v-model="mqttWsPort" @input="onProtocolChange" class="header-input" style="width: 80px;" />
          </div>

          <!-- HTTP Headers 섹션 (리소스별) -->
          <div class="settings-divider">HTTP Headers</div>

          <div class="header-table-wrap">
            <table class="header-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Origin</th>
                  <th>RVI</th>
                  <th>RI</th>
                  <th>Accept</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rt in headerResourceTypes" :key="rt.ty">
                  <td class="header-td-name">{{ rt.name }}</td>
                  <td><input type="text" v-model="resourceHeaders[rt.ty].origin" @input="onHeaderChange" class="header-input header-input-origin" /></td>
                  <td>
                    <select v-model="resourceHeaders[rt.ty].rvi" @change="onHeaderChange" class="header-select">
                      <option value="2a">2a</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </td>
                  <td><input type="text" v-model="resourceHeaders[rt.ty].ri" @input="onHeaderChange" class="header-input header-input-ri" /></td>
                  <td><input type="text" v-model="resourceHeaders[rt.ty].accept" @input="onHeaderChange" class="header-input header-input-accept" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </navBar>
  </header>
  <div class="configure">
    <div class="box" style = "borderRadius: 10px">
      <div class="key" style="color: white;">Originator</div>
      <input type="text" v-model="originator" />
    </div>
    <div class="box" style = "borderRadius: 10px">
      <div class="key" style="color: white">IP Address</div>
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
      border-radius: 15px"> Resource Load</div>
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

    </div>
  </div>
  <div class="body">
    <div class="canvas">
      <button class="canvas-expand-btn" @click="canvasExpanded = true" title="전체 보기">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </button>
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
      <div class="palette-label">Resources</div>
      <div class="right_dragArea resources list-items" style="padding-bottom: 10px;">
        <div class="resource-section-label">Application</div>
        <nestedDraggable
          style="padding-left: 0px;"
          :tasks="resApplication"
          :group="{name:'resources', pull: 'clone', put: false}"
          item-key="id"
        ></nestedDraggable>
        <div class="resource-section-label has-divider">Data</div>
        <nestedDraggable
          style="padding-left: 0px;"
          :tasks="resData"
          :group="{name:'resources', pull: 'clone', put: false}"
          item-key="id"
        ></nestedDraggable>
        <div class="resource-section-label has-divider">Management</div>
        <nestedDraggable
          style="padding-left: 0px;"
          :tasks="resManagement"
          :group="{name:'resources', pull: 'clone', put: false}"
          item-key="id"
        ></nestedDraggable>
      </div>

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
        <div class="delete-label">Delete Resource</div>
      </div>

      <div class="action-buttons">
        <div class="btn button action-btn" @click="createResourceTree">
          Create ResourceTree
        </div>
        <div class="btn button action-btn" @click="saveResourceTree">
          Export to TextFile
        </div>
        <div class="btn button action-btn" @click="loadFile">
          Importing TextFile
        </div>
      </div>
    </div>

    <div v-if="attrSetting" class="modal">
      <div class="overlay"> 
      </div>
      <div class="modalBody">
        <setAttrs
        :element="selectedElement"
        :cse-preset="csePreset"
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
            const val = value.value;
            if(val === '' || (Array.isArray(val) && val.length === 0)) {
              delete this.selectedElement.attrs[key];
              return;
            }

            if(val === 0 && value.type !== 'Number'){
              return;
            }
            if(value.dataType === 'Number' || value.type === 'Number'){
              const parsed = parseFloat(val);
              if(!isNaN(parsed)){
                this.selectedElement.attrs[key] = parsed;
              } else {
                this.selectedElement.attrs[key] = val;
              }
            }
            else{
              this.selectedElement.attrs[key] = val;
            }
          });
          // 속성이 변경되었으므로 modified 플래그 설정 (UPDATE 대상 표시)
          if (this.selectedElement.createdOnServer) {
            this.selectedElement.modified = true;
          }
          // 줌뷰 열려있으면 변경된 속성 동기화
          if (this.showZoomView && this.zoomedClone) {
            const zNode = this.findNodeById(this.zoomedClone, this.selectedElement.id);
            if (zNode) {
              zNode.attrs = JSON.parse(JSON.stringify(this.selectedElement.attrs));
            }
          }
          callback();
      }"
        @update-rn="handleUpdateRn"
        @zoom-view="(el) => { this.attrSetting = false; if(this.selectedElement) this.selectedElement.selected=false; this.selectedElement = undefined; openZoomView(el); }"
        />
      </div>
    </div>
      
  </div>
  <rawDisplayer class="col-4" :value="cse1" title="List 1" style="margin-left: 20px;" />

  <!-- 캔버스 전체보기 모달 -->
  <div v-if="canvasExpanded" class="fullview-overlay" @click="canvasExpanded = false">
    <div class="fullview-modal" @click.stop>
      <button class="fullview-close" @click="canvasExpanded = false">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="fullview-body">
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
          class="dragArea resourceTree zoom-tree"
        ></nestedDraggable>
      </div>
    </div>
  </div>

  <!-- 확대 뷰 모달 -->
  <div v-if="showZoomView" class="fullview-overlay" @click="closeZoomView">
    <div class="fullview-modal" @click.stop>
      <button class="fullview-close" @click="closeZoomView">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="fullview-body">
        <nestedDraggable
          :tasks="zoomedTree"
          style="padding-left: 0px;"
          :group="{
            name: 'zoomTree',
            pull: false,
            put: false
          }"
          :childRT="[2, 9, 1, 3, 4, 23, 28, 58]"
          :min-height="200"
          item-key="id"
          @clicked="(element) => {
            this.setAttributes(element);
          }"
          @toggle-expand="handleToggleExpand"
          @load-all-instances="loadAllInstances"
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
import { create_resource, retrieve_resource, delete_resource, cse_retrieve } from "@/components/protocol-dispatcher.js";
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
          { name: "FCNT", ty: RT.FCNT },
          { name: "FCIN", ty: RT.FCIN },
          { name: "GRP", ty: RT.GRP },
          { name: "SUB", ty: RT.SUB },
      ],
      resApplication: [
          { name: "AE", ty: RT.AE },
      ],
      resData: [
          { name: "CNT", ty: RT.CNT },
          { name: "CIN", ty: RT.CIN },
          { name: "FCNT", ty: RT.FCNT },
          { name: "FCIN", ty: RT.FCIN },
          { name: "TS", ty: RT.TS },
          { name: "TSI", ty: RT.TSI },
      ],
      resManagement: [
          { name: "ACP", ty: RT.ACP },
          { name: "GRP", ty: RT.GRP },
          { name: "SUB", ty: RT.SUB },
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
      csePreset: 'none',           // CSE 프리셋 ('none' | 'tinyiot')
      showSettings: false,         // 설정 패널 표시 여부
      protocolMode: 'http',        // 'http' | 'mqtt'
      mqttWsPort: '9001',          // MQTT WebSocket 포트
      // 리소스 타입별 HTTP 헤더 (명세서 기준 기본값)
      resourceHeaders: {
        1:  { origin: 'CAdmin', rvi: '3',  ri: 'create_acp',  accept: 'application/json' },
        2:  { origin: 'CAdmin', rvi: '2a', ri: 'create_ae',   accept: 'application/vnd.onem2m-res+json;ty=2' },
        3:  { origin: 'CAdmin', rvi: '3',  ri: 'create_cnt',  accept: 'application/json' },
        4:  { origin: 'CAdmin', rvi: '2a', ri: 'create_cin',  accept: 'application/json' },
        9:  { origin: 'CAdmin', rvi: '3',  ri: 'create_grp',  accept: 'application/json' },
        23: { origin: 'CAdmin', rvi: '3',  ri: 'create_sub',  accept: 'application/json' },
        28: { origin: 'CAdmin', rvi: '4',  ri: 'create_fcnt', accept: 'application/json' },
        58: { origin: 'CAdmin', rvi: '4',  ri: 'create_fcin', accept: 'application/json' },
        29: { origin: 'CAdmin', rvi: '2a', ri: 'create_ts',   accept: 'application/json' },
        30: { origin: 'CAdmin', rvi: '2a', ri: 'create_tsi',  accept: 'application/json' },
      },
      headerResourceTypes: [
        { ty: 1, name: 'ACP' },
        { ty: 2, name: 'AE' },
        { ty: 3, name: 'CNT' },
        { ty: 4, name: 'CIN' },
        { ty: 9, name: 'GRP' },
        { ty: 23, name: 'SUB' },
        { ty: 28, name: 'FCNT' },
        { ty: 58, name: 'FCIN' },
        { ty: 29, name: 'TS' },
        { ty: 30, name: 'TSI' },
      ],
      mqttTopic: '/oneM2M/req/tinyiot/designTool',  // oneM2M 표준 형식 (맨 앞 /  필수!)
      // 확대 뷰 관련
      showZoomView: false,
      zoomedAE: null,
      zoomedClone: null,
      canvasExpanded: false
    }
  },

  computed: {
    // 확대 뷰용 트리 - 딥 클론 기반 (메인 트리에 영향 없음)
    zoomedTree() {
      if (!this.zoomedClone || !this.cse1 || this.cse1.length === 0) {
        return [];
      }

      const cseData = this.cse1[0];
      if (!cseData) return [];

      return [{ ...cseData, tasks: [this.zoomedClone] }];
    }
  },

  created(){
    const cse = JSON.parse(sessionStorage.getItem("CSE1"));
    //get_jsonfile(cse);
    if (cse!=undefined) this.cse1 = cse;
    this.targetIP = sessionStorage.getItem('targetIP');

    // localStorage에서 설정값 복원
    const savedPreset = localStorage.getItem('csePreset');
    if (savedPreset) this.csePreset = savedPreset;
    const savedFlash = localStorage.getItem('flashingEffectEnabled');
    if (savedFlash !== null) this.flashingEffectEnabled = savedFlash === 'true';

    // 리소스별 HTTP 헤더 설정값 복원
    const savedHeaders = localStorage.getItem('resourceHeaders');
    if (savedHeaders) {
      try {
        const parsed = JSON.parse(savedHeaders);
        for (const ty in parsed) {
          if (this.resourceHeaders[ty]) {
            this.resourceHeaders[ty] = { ...this.resourceHeaders[ty], ...parsed[ty] };
          }
        }
      } catch (e) { /* 이전 형식 무시 */ }
    }
    // 항상 최신 기본값을 localStorage에 저장 (http-request.js에서 읽을 수 있도록)
    localStorage.setItem('resourceHeaders', JSON.stringify(this.resourceHeaders));
    // Protocol 설정 복원
    this.protocolMode = localStorage.getItem('protocolMode') || 'http';
    this.mqttWsPort = localStorage.getItem('mqttWsPort') || '9001';
    // originator는 setAttrs.vue에서 localStorage에 저장됨 — 복원하여 동기화
    const savedOriginator = localStorage.getItem('originator');
    if (savedOriginator) this.originator = savedOriginator;
  },

  mounted() {
    // 설정 패널 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (this.showSettings) {
        const wrapper = this.$el.querySelector('.settings-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          this.showSettings = false;
        }
      }
    });
  },

  methods: {

    onCsePresetChange() {
      localStorage.setItem('csePreset', this.csePreset);
    },

    onFlashEffectToggle() {
      localStorage.setItem('flashingEffectEnabled', String(this.flashingEffectEnabled));
    },

    onHeaderChange() {
      localStorage.setItem('resourceHeaders', JSON.stringify(this.resourceHeaders));
    },

    onProtocolChange() {
      localStorage.setItem('protocolMode', this.protocolMode);
      localStorage.setItem('mqttWsPort', this.mqttWsPort);
    },

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
    async openZoomView(element) {
      console.log("[openZoomView] Opening zoom view for:", element.attrs?.rn, "ty:", element.ty);
      this.zoomedAE = element;

      // 딥 클론 생성 → 인스턴스는 클론에만 로드 (메인 트리 영향 없음)
      const clone = JSON.parse(JSON.stringify(element));
      // 클론에서 메인 트리의 trimmed CIN/FCIN 제거 (중복 방지)
      this.stripCloneInstances(clone);
      this.zoomedClone = clone;
      this.showZoomView = true;

      // reactive proxy(this.zoomedClone)에 인스턴스 로드 → Vue가 변경 감지
      await this.loadInstancesForTree(this.zoomedClone, 5);
    },

    closeZoomView() {
      this.showZoomView = false;
      this.zoomedAE = null;
      this.zoomedClone = null;
    },

    // 트리에서 id로 노드 찾기 (줌뷰 동기화용)
    findNodeById(node, id) {
      if (node.id === id) return node;
      if (node.tasks) {
        for (const child of node.tasks) {
          const found = this.findNodeById(child, id);
          if (found) return found;
        }
      }
      return null;
    },

    // 트리에서 ri(Resource ID)로 노드 찾기 (리로드 후 줌뷰 갱신용)
    findNodeByRi(tree, ri) {
      for (const node of tree) {
        if (node.attrs?.ri === ri) return node;
        if (node.tasks) {
          const found = this.findNodeByRi(node.tasks, ri);
          if (found) return found;
        }
      }
      return null;
    },

    // 클론에서 CIN/FCIN 노드 제거 (줌뷰 로드 전 정리)
    stripCloneInstances(node) {
      if (node.tasks) {
        node.tasks = node.tasks.filter(t => t.ty !== 4 && t.ty !== 58 && t.ty !== 30);
        node.tasks.forEach(child => this.stripCloneInstances(child));
      }
      if (node.ty === 3 || node.ty === 28 || node.ty === 29) {
        node.instancesLoaded = false;
      }
    },

    // 노드와 그 하위의 모든 CNT/FCNT에서 CIN/FCIN 인스턴스 로드
    async loadInstancesForTree(node, limit) {
      const target = this.parseTargetUrl(this.targetIP);
      if (!target) return;

      // CNT(ty=3) → CIN(ty=4) 로드
      if (node.ty === 3 && node.fullPath && !node.instancesLoaded) {
        try {
          const path = node.fullPath;
          const disc = await retrieve_resource(
            this.originator, target.host, target.port, path, `fu=1&ty=4&lim=${limit}`
          );
          let uris = disc['m2m:uril'] || [];
          if (typeof uris === 'string') {
            uris = uris.trim().split(/\s+/).filter(u => u.length > 0);
          }

          const cinNodes = [];
          for (const uri of uris) {
            const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
            try {
              const cinData = await retrieve_resource(
                this.originator, target.host, target.port, cleanUri, ''
              );
              if (cinData['m2m:cin']) {
                cinNodes.push(this.convertNode(cinData['m2m:cin'], 'CIN', 0, false));
              }
            } catch (err) {
              console.warn(`[loadInstances] Failed to load CIN: ${cleanUri}`);
            }
          }
          // ct(생성시간) 내림차순 정렬 — 최신이 맨 위
          cinNodes.sort((a, b) => (b.attrs?.ct || '').localeCompare(a.attrs?.ct || ''));
          node.tasks.push(...cinNodes);
          node.instancesLoaded = true;
          node.instancesLoadedAll = (uris.length < limit);
          console.log(`[loadInstances] Loaded ${uris.length} CINs for ${node.attrs?.rn}`);
        } catch (error) {
          console.warn(`[loadInstances] No CINs for ${node.attrs?.rn}`);
        }
      }

      // FCNT(ty=28) → FCIN(ty=58) 로드
      if (node.ty === 28 && node.fullPath && !node.instancesLoaded) {
        try {
          const path = node.fullPath;
          const disc = await retrieve_resource(
            this.originator, target.host, target.port, path, `fu=1&ty=58&lim=${limit}`
          );
          let uris = disc['m2m:uril'] || [];
          if (typeof uris === 'string') {
            uris = uris.trim().split(/\s+/).filter(u => u.length > 0);
          }
          if (!Array.isArray(uris)) {
            uris = [uris];
          }

          const fcinNodes = [];
          for (const uri of uris) {
            const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
            try {
              const fcinData = await retrieve_resource(
                this.originator, target.host, target.port, cleanUri, ''
              );
              // m2m:fcin 또는 다른 키(cod: 등)로 올 수 있으므로 유연하게 처리
              let fcinNode = fcinData['m2m:fcin'];
              if (!fcinNode) {
                for (const key of Object.keys(fcinData)) {
                  if (typeof fcinData[key] === 'object' && fcinData[key] !== null && fcinData[key].ty === 58) {
                    fcinNode = fcinData[key];
                    break;
                  }
                }
              }
              if (fcinNode) {
                fcinNodes.push(this.convertNode(fcinNode, 'FCIN', 0, false));
              }
            } catch (err) {
              console.warn(`[loadInstances] Failed to load FCIN: ${cleanUri}`);
            }
          }
          // ct(생성시간) 내림차순 정렬 — 최신이 맨 위
          fcinNodes.sort((a, b) => (b.attrs?.ct || '').localeCompare(a.attrs?.ct || ''));
          node.tasks.push(...fcinNodes);
          node.instancesLoaded = true;
          node.instancesLoadedAll = (uris.length < limit);
        } catch (error) {
          console.warn(`[loadInstances] No FCINs for ${node.attrs?.rn}`);
        }
      }

      // TS(ty=29) → TSI(ty=30) 로드
      if (node.ty === 29 && node.fullPath && !node.instancesLoaded) {
        try {
          const path = node.fullPath;
          const disc = await retrieve_resource(
            this.originator, target.host, target.port, path, `fu=1&ty=30&lim=${limit}`
          );
          let uris = disc['m2m:uril'] || [];
          if (typeof uris === 'string') {
            uris = uris.trim().split(/\s+/).filter(u => u.length > 0);
          }
          if (!Array.isArray(uris)) {
            uris = [uris];
          }

          const tsiNodes = [];
          for (const uri of uris) {
            const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
            try {
              const tsiData = await retrieve_resource(
                this.originator, target.host, target.port, cleanUri, ''
              );
              if (tsiData['m2m:tsi']) {
                tsiNodes.push(this.convertNode(tsiData['m2m:tsi'], 'TSI', 0, false));
              }
            } catch (err) {
              console.warn(`[loadInstances] Failed to load TSI: ${cleanUri}`);
            }
          }
          // ct(생성시간) 내림차순 정렬 — 최신이 맨 위
          tsiNodes.sort((a, b) => (b.attrs?.ct || '').localeCompare(a.attrs?.ct || ''));
          node.tasks.push(...tsiNodes);
          node.instancesLoaded = true;
          node.instancesLoadedAll = (uris.length < limit);
          console.log(`[loadInstances] Loaded ${uris.length} TSIs for ${node.attrs?.rn}`);
        } catch (error) {
          console.warn(`[loadInstances] No TSIs for ${node.attrs?.rn}`);
        }
      }

      // 자식 재귀
      if (node.tasks) {
        for (const child of node.tasks) {
          await this.loadInstancesForTree(child, limit);
        }
      }
    },

    // 전체 인스턴스 로드 (▼ All 버튼)
    async loadAllInstances(element) {
      console.log("[loadAllInstances] Loading all instances for:", element.attrs?.rn);
      // 기존 CIN/FCIN 제거 후 전체 재로드
      element.tasks = element.tasks.filter(t => t.ty !== 4 && t.ty !== 58 && t.ty !== 30);
      element.instancesLoaded = false;
      await this.loadInstancesForTree(element, 1000);
      element.instancesLoadedAll = true;
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
        console.log('[UPDATE-RN] Resource name updated');
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

      // CREATE 성공 후: 원본 트리에 createdOnServer 플래그 반영
      const markCreated = (node) => {
        if (node && typeof node === 'object') {
          if (!node.createdOnServer && node.ty !== 5) {
            node.createdOnServer = true;
          }
          if (Array.isArray(node.tasks)) node.tasks.forEach(markCreated);
        }
      };
      if (this.cse1) this.cse1.forEach(markCreated);

      // UPDATE 성공 후: modified FCNT의 FCIN 새로고침 + modified 플래그 해제
      const modifiedFcnts = [];
      const collectAndClear = (node) => {
        if (node && typeof node === 'object') {
          if (node.modified && node.ty === 28) modifiedFcnts.push(node);
          if (node.modified) node.modified = false;
          if (Array.isArray(node.tasks)) node.tasks.forEach(collectAndClear);
        }
      };
      if (this.cse1) this.cse1.forEach(collectAndClear);

      // modified FCNT의 FCIN(최신 1개)을 다시 로드
      if (modifiedFcnts.length > 0) {
        const target = this.parseTargetUrl(this.targetIP);
        if (target) {
          for (const fcntNode of modifiedFcnts) {
            try {
              const path = fcntNode.fullPath;
              if (!path) {
                console.warn('[UPDATE] No fullPath for FCNT:', fcntNode.attrs?.rn);
                continue;
              }
              // 기존 FCIN 제거
              fcntNode.tasks = fcntNode.tasks.filter(t => t.ty !== 58);
              // 최신 FCIN 로드 — /la (latest) 가상 리소스 사용
              const laPath = path + '/la';
              console.log('[UPDATE] Retrieving latest FCIN:', laPath);
              const fcinData = await retrieve_resource(
                this.originator, target.host, target.port, laPath, ''
              );
              let fcinNode = fcinData['m2m:fcin'];
              if (!fcinNode) {
                for (const key of Object.keys(fcinData)) {
                  if (typeof fcinData[key] === 'object' && fcinData[key] !== null && fcinData[key].ty === 58) {
                    fcinNode = fcinData[key]; break;
                  }
                }
              }
              if (fcinNode) {
                fcntNode.tasks.push(this.convertNode(fcinNode, 'FCIN', 0, false));
                console.log('[UPDATE] Reloaded latest FCIN for', fcntNode.attrs?.rn);
              } else {
                console.warn('[UPDATE] No FCIN found in /la response for', fcntNode.attrs?.rn);
              }
              // FCNT 자체를 다시 조회하여 cni(childCount) 갱신
              try {
                const fcntData = await retrieve_resource(
                  this.originator, target.host, target.port, path, ''
                );
                let fcntServer = fcntData['m2m:fcnt'];
                if (!fcntServer) {
                  for (const key of Object.keys(fcntData)) {
                    if (typeof fcntData[key] === 'object' && fcntData[key] !== null && fcntData[key].ty === 28) {
                      fcntServer = fcntData[key]; break;
                    }
                  }
                }
                if (fcntServer && fcntServer.cni !== undefined) {
                  fcntNode.childCount = fcntServer.cni;
                  console.log('[UPDATE] Updated cni for', fcntNode.attrs?.rn, '→', fcntServer.cni);
                }
              } catch (cniErr) {
                console.warn('[UPDATE] Failed to refresh cni for', fcntNode.attrs?.rn, cniErr);
              }
            } catch (err) {
              console.warn('[UPDATE] Failed to reload FCIN for', fcntNode.attrs?.rn, err);
            }
          }
          this.syncSessionStorage();
        }
      }

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
    console.log("[loadResources] Loading resources from CSE using rcn=4...");
    sessionStorage.setItem('targetIP', this.targetIP);

    if (this.targetIP === "") {
      alert("Please input CSE IP Address");
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

      // 1. 단일 rcn=4 요청으로 전체 트리 가져오기
      console.log("[loadResources] Retrieving full tree with rcn=4...");
      const data = await retrieve_resource(this.originator, target.host, target.port, target.basePath, 'rcn=4&lim=10000');

      // 2. CIN/FCIN 최신 1개만 남기기 (메인 트리 미리보기용)
      this.trimInstances(data);

      // 3. 변환 + 렌더링
      console.log("[loadResources] Converting tree structure...");
      const convertedData = this.convertListToFileFormatFull(data);
      console.log("[loadResources] Converted data:", convertedData);

      // CSE에 플래그 설정
      if (convertedData[0]) {
        convertedData[0].childrenLoaded = true;
        convertedData[0].allResourcesLoaded = true;

        // CSE 직속 CNT/FCNT에 플래그 (돋보기 표시용)
        if (convertedData[0].tasks) {
          convertedData[0].tasks.forEach(child => {
            if (child.ty === 3 || child.ty === 28 || child.ty === 29) {
              child.cseDirectChild = true;
            }
          });
        }
        convertedData[0].allCollapsed = false;
        convertedData[0].expanded = true;
      }

      sessionStorage.setItem('CSE1', JSON.stringify(convertedData, null, 2));
      this.loadFromSessionStorage();

      // fullPath 업데이트
      this.updateFullPaths();
      this.syncSessionStorage();

      // 줌뷰 열려있으면 새 트리에서 같은 노드 찾아서 갱신
      if (this.showZoomView && this.zoomedAE) {
        const ri = this.zoomedAE.attrs?.ri;
        if (ri) {
          const found = this.findNodeByRi(this.cse1, ri);
          if (found) {
            await this.openZoomView(found);
          } else {
            this.closeZoomView();
          }
        }
      }

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

      console.log(`[loadResources] Loaded ${totalResources} resources in ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
      console.error("[loadResources] Failed to load resources:", error);
      alert("Failed to load resources. See console for details.");
    }
  },

  // CIN/FCIN을 최신 1개만 남기고 나머지 제거 (메인 트리 미리보기용)
  trimInstances(obj) {
    if (!obj || typeof obj !== 'object') return;
    // 단일 객체를 배열로 정규화
    if (obj['m2m:cin'] && !Array.isArray(obj['m2m:cin']) && typeof obj['m2m:cin'] === 'object') {
      obj['m2m:cin'] = [obj['m2m:cin']];
    }
    if (obj['m2m:fcin'] && !Array.isArray(obj['m2m:fcin']) && typeof obj['m2m:fcin'] === 'object') {
      obj['m2m:fcin'] = [obj['m2m:fcin']];
    }
    if (obj['m2m:tsi'] && !Array.isArray(obj['m2m:tsi']) && typeof obj['m2m:tsi'] === 'object') {
      obj['m2m:tsi'] = [obj['m2m:tsi']];
    }
    if (Array.isArray(obj['m2m:cin']) && obj['m2m:cin'].length > 0) {
      obj['m2m:cin'] = obj['m2m:cin'].slice(-1);
    }
    if (Array.isArray(obj['m2m:fcin']) && obj['m2m:fcin'].length > 0) {
      obj['m2m:fcin'] = obj['m2m:fcin'].slice(-1);
    }
    if (Array.isArray(obj['m2m:tsi']) && obj['m2m:tsi'].length > 0) {
      obj['m2m:tsi'] = obj['m2m:tsi'].slice(-1);
    }
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach(item => this.trimInstances(item));
      } else if (typeof obj[key] === 'object') {
        this.trimInstances(obj[key]);
      }
    }
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

        // FCNT/FCIN의 경우 SDT 커스텀 속성 보존 (스키마에 없는 나머지 속성 전부 복사)
        if (node.ty === 28 || node.ty === 58) {
            const skipKeys = ['ri', 'ct', 'lt', 'pi', 'et', 'st', 'ty', 'cni', 'cbs'];
            // 최상위 속성을 먼저 저장 (PUT으로 업데이트된 최신값)
            Object.keys(node).forEach((key) => {
                if (!key.startsWith('m2m:') && !key.startsWith('cod:') && key !== 'custom_attrs'
                    && baseAttrs[key] === undefined && !skipKeys.includes(key)) {
                    baseAttrs[key] = node[key];
                }
            });
            // custom_attrs는 최상위에 없는 속성만 fallback으로 추가
            if (node['custom_attrs'] && typeof node['custom_attrs'] === 'object' && !Array.isArray(node['custom_attrs'])) {
                Object.entries(node['custom_attrs']).forEach(([cKey, cVal]) => {
                    if (baseAttrs[cKey] === undefined) {
                        baseAttrs[cKey] = cVal;
                    }
                });
            }
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

        // FCNT의 경우 cni로 FCIN 개수 저장
        if (node.ty === 28 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 58; // FCIN
        }

        // TS의 경우 cni로 TSI 개수 저장
        if (node.ty === 29 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 30; // TSI
        }

        // 자식노드에 재귀적 요청
        let hasCINChildren = false;
        for (const key in node) {
            if (node.hasOwnProperty(key) && key.startsWith('m2m:')) {
                let children = node[key];
                // 단일 객체일 경우 배열로 감싸기 (서버가 1개일 때 객체로 반환)
                if (!Array.isArray(children)) {
                    if (typeof children === 'object' && children !== null) {
                        children = [children];
                    } else {
                        continue;
                    }
                }

                // CIN 제외 옵션이 켜져 있고 CIN 자식이면 스킵
                if (excludeCIN && key === 'm2m:cin') {
                    hasCINChildren = true;
                    console.log(`[convertNode] Skipping CIN children for ${nodeName} (${children.length} CINs)`);
                    continue;
                }

                const childNodeName = key.replace('m2m:', '').toUpperCase();
                // depth를 1 증가시켜서 재귀 호출 (excludeCIN 전달)
                result.tasks.push(...children.map(child => this.convertNode(child, childNodeName, depth + 1, excludeCIN)));
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
        alert("Please input CSE IP Address");
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
        cse_retrieve(this.originator, ip, port, path, setCSEData);
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
      console.log('[DELETE] handleDeleteZoneChange called');

      if (!evt || !evt.added || !evt.added.element) {
        return;
      }

      const element = evt.added.element;
      const bufferIndex = evt.added.newIndex;
      const resourceName = element.attrs?.rn || element.name || 'Unknown';
      const hasChildren = element.tasks && element.tasks.length > 0;

      console.log('[DELETE] target:', resourceName, 'ty:', element.ty, 'children:', hasChildren ? element.tasks.length : 0);

      // 버퍼에서 즉시 제거
      if (typeof bufferIndex === 'number' && bufferIndex > -1) {
        this.deleteBuffer.splice(bufferIndex, 1);
      } else {
        this.deleteBuffer.length = 0;
      }

      // CSE(ty=5) 드롭 → 하위 리소스 전체 삭제
      if (element.ty === 5) {
        if (!hasChildren) {
          alert(`"${resourceName}" 하위에 삭제할 리소스가 없습니다.`);
          this.restoreTreeSnapshot();
          this.deleteBuffer.length = 0;
          this.isDragging = false;
          return;
        }
        const confirmed = confirm(
          `"${resourceName}"과 하위 리소스를 삭제하시겠습니까?\n\n※ CSE 자체는 삭제되지 않습니다.`
        );
        if (!confirmed) {
          this.restoreTreeSnapshot();
          this.deleteBuffer.length = 0;
          this.isDragging = false;
          return;
        }
        try {
          const children = [...(element.tasks || [])];
          let failCount = 0;
          for (const child of children) {
            try {
              await this.deleteResourceFromServer(child);
              console.log('[DELETE] child deleted:', child.attrs?.rn || child.name);
            } catch (err) {
              failCount++;
              console.error('[DELETE] child delete failed:', child.attrs?.rn, err);
            }
          }
          element.tasks = [];
          // CSE를 트리에 다시 넣기
          if (!this.cse1.find(n => n.id === element.id)) {
            this.cse1.push(element);
          }
          if (failCount > 0) {
            alert(`"${resourceName}" 하위 리소스 삭제 완료 (${failCount}개 실패)`);
          } else {
            alert(`"${resourceName}" 하위 리소스가 모두 삭제되었습니다.`);
          }
          this.updateFullPaths();
          this.syncSessionStorage();
        } catch (error) {
          console.error('[DELETE] CSE children delete failed:', error);
          alert('리소스 삭제에 실패했습니다.');
        } finally {
          this.deleteBuffer.length = 0;
          this.draggedElementInfo = null;
          this.draggedElementPath = '';
          this.isDragging = false;
          this.treeSnapshotBeforeDrag = null;
        }
        return;
      }

      // 일반 리소스 → 확인 팝업 (하위 리소스 유무에 따라 메시지 구분)
      const confirmMsg = hasChildren
        ? `"${resourceName}"과 하위 리소스를 삭제하시겠습니까?`
        : `"${resourceName}" 리소스를 삭제하시겠습니까?`;
      if (!confirm(confirmMsg)) {
        this.restoreTreeSnapshot();
        this.deleteBuffer.length = 0;
        this.isDragging = false;
        return;
      }

      try {
        await this.deleteResourceFromServer(element);
        const successMsg = hasChildren
          ? `"${resourceName}"과 하위 리소스가 삭제되었습니다.`
          : `"${resourceName}" 리소스가 삭제되었습니다.`;
        alert(successMsg);

        this.updateFullPaths();
        this.syncSessionStorage();

        if (this.selectedElement && this.selectedElement.id === element.id) {
          this.selectedElement = {};
          this.attrSetting = false;
        }
      } catch (error) {
        console.error('[DELETE] failed:', resourceName, error);
        alert(error?.message || '리소스 삭제에 실패했습니다.');
        this.restoreTreeSnapshot();
      } finally {
        this.deleteBuffer.length = 0;
        this.draggedElementInfo = null;
        this.draggedElementPath = '';
        this.isDragging = false;
        this.treeSnapshotBeforeDrag = null;
      }
    },

    async deleteResourceFromServer(element) {
      if (!element) {
        throw new Error('삭제할 리소스를 찾을 수 없습니다.');
      }

      const rn = element?.attrs?.rn || element.name;
      const hasRI = !!element?.attrs?.ri;
      const hasRN = !!element?.attrs?.rn;
      const hasFullPath = !!element.fullPath;
      const isFromServer = element.createdOnServer;

      console.log('[DELETE] start:', rn, { ri: element?.attrs?.ri, fullPath: element.fullPath, createdOnServer: isFromServer });

      // 서버에 생성된 적 없고 경로 정보도 없으면 스킵
      if (!isFromServer && !hasRI && !hasRN && !hasFullPath) {
        console.warn('[DELETE] skip - no resource info (template resource)');
        return;
      }

      if (!isFromServer && (hasRI || hasRN || hasFullPath)) {
        console.warn('[DELETE] not marked as createdOnServer, attempting anyway');
      }

      if (!this.targetIP || this.targetIP === '') {
        throw new Error('CSE IP 주소를 먼저 입력하세요.');
      }

      const target = this.parseTargetUrl(this.targetIP);
      if (!target) {
        throw new Error('CSE 주소 형식이 올바르지 않습니다.');
      }

      if (target.protocol !== 'http') {
        throw new Error('현재는 HTTP만 지원합니다.');
      }

      // Build resource path (priority: fullPath > rn > ri)
      let resourcePath = '';
      if (element.fullPath || this.draggedElementPath) {
        resourcePath = element.fullPath || this.draggedElementPath;
      } else if (element?.attrs?.rn) {
        resourcePath = element.attrs.rn;
      } else if (element?.attrs?.ri) {
        resourcePath = element.attrs.ri;
      }

      if (!resourcePath) {
        throw new Error('리소스 경로를 계산할 수 없습니다. RN 또는 RI를 확인하세요.');
      }

      // Combine basePath with resourcePath
      const basePath = target.basePath || '';
      let finalPath;
      if (resourcePath.startsWith(basePath + '/') || resourcePath === basePath) {
        finalPath = resourcePath;
      } else if (basePath && resourcePath.startsWith(basePath)) {
        finalPath = resourcePath;
      } else {
        finalPath = basePath ? `${basePath}/${resourcePath}` : resourcePath;
      }

      console.log('[DELETE] request:', finalPath);

      try {
        await delete_resource(
          this.originator,
          target.protocol,
          target.host,
          target.port,
          finalPath
        );

        console.log('[DELETE] success:', rn);
        element.createdOnServer = false;
        this.treeSnapshotBeforeDrag = null;

      } catch (error) {
        console.error('[DELETE] failed:', rn, error?.response?.status || error.message);

        if (error?.response?.status === 404) {
          if (confirm('서버에서 리소스를 찾을 수 없습니다.\n로컬 트리에서만 삭제하시겠습니까?')) {
            console.log('[DELETE] removed from local tree only:', rn);
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
          console.log('[REALTIME] Real-time sync enabled');
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
        console.log('[REALTIME] Real-time sync disabled');
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
          console.log('[MQTT] Connected to broker');

          // 토픽 구독
          this.mqttClient.subscribe(this.mqttTopic, (err) => {
            if (err) {
              console.error('[MQTT] Subscription failed:', err);
              reject(new Error('MQTT 구독 실패'));
            } else {
              console.log('[MQTT] Subscribed to topic:', this.mqttTopic);
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

      const expectedMqttNu = `mqtt://${target.host}:1883/designTool`;

      // 1. 기존 designToolSub 중 내 호스트에 맞는 것 찾기 (삭제 안 함)
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

          // 모든 designToolSub 필터링
          const designToolSubs = uriList.filter(uri => {
            const parts = uri.split('/');
            return parts[parts.length - 1].startsWith('designToolSub');
          });

          // 내 호스트에 맞는 sub 찾기
          for (const subUri of designToolSubs) {
            try {
              const subUrl = `http://${target.host}:${target.port}/${subUri}`;
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

                if (nu.includes(expectedMqttNu)) {
                  // 내 호스트에 맞는 MQTT SUB → 재사용
                  const parts = subUri.split('/');
                  const subName = parts[parts.length - 1];
                  if (!resourcePath) {
                    this.subscriptionResourceName = subName;
                    this.subscriptionCreated = true;
                  }
                  console.log('[SUBSCRIPTION] Reusing existing MQTT subscription:', subName, 'at', targetPath);
                  return { success: true, subscriptionName: subName, reused: true };
                }
                // 다른 호스트의 sub은 건드리지 않고 스킵
              }
            } catch (error) {
              console.log('[SUBSCRIPTION] Error checking sub:', subUri, error);
            }
          }
        }
      } catch (error) {
        console.log('[SUBSCRIPTION] No existing subscription found, will create new one');
      }

      // 2. 일치하는 게 없으면 새로 생성 (기존 sub 삭제 안 함)
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
        console.log('[SUBSCRIPTION] Subscription created:', subscriptionName, 'at', targetPath);
        return { success: true, subscriptionName, reused: false, result };
      } catch (error) {
        console.error('[SUBSCRIPTION] Failed to create:', error);
        throw error;
      }
    },

    async createSubscriptionsForAllCNTs() {
      console.log('[SUBSCRIPTION] Starting to create subscriptions for all CNTs...');

      if (!this.cse1 || !Array.isArray(this.cse1) || this.cse1.length === 0 || !this.cse1[0] || !this.cse1[0].tasks) {
        console.log('[SUBSCRIPTION] No resources loaded yet');
        return { total: 0, created: 0, reused: 0, errors: 0 };
      }

      const stats = { total: 0, created: 0, reused: 0, errors: 0 };

      // 재귀적으로 모든 CNT/TS 찾기
      const findAllCNTs = (node, parentPath = '') => {
        const cnts = [];

        if (node.ty === 3 || node.ty === 29) {
          // CNT 또는 TS 타입인 경우
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

      console.log('[SUBSCRIPTION] Subscription creation completed:', stats);
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
          console.log('[TRANSFORM] TinyIoT bug detected: DELETE(' + net + ') -> CREATE(1)');
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
            'GRP': 9, 'SUB': 23, 'FCNT': 28, 'FCIN': 58, 'TS': 29, 'TSI': 30
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
        // 디자인 툴에서 자체 생성한 리소스면 노티 무시
        const notifRI = resourceData?.ri;
        if (notifRI && existing.attrs?.ri === notifRI) {
          console.log('[NOTIFICATION] Self-created resource, skipping:', resourceName);
          return;
        }
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

      // TSI 제한 로직: 부모가 TS이고 새로운 리소스가 TSI인 경우
      if (resourceType === 30 && parent.ty === 29) {
        const currentTSIs = parent.tasks.filter(task => task.ty === 30);
        console.log(`[NOTIFICATION] TS ${parent.name} currently has ${currentTSIs.length} TSI(s)`);

        if (currentTSIs.length >= 5) {
          const tsisToRemove = currentTSIs.length - 4;
          console.log(`[NOTIFICATION] Removing ${tsisToRemove} oldest TSI(s) to maintain limit of 5`);

          const sortedTSIs = currentTSIs.sort((a, b) => {
            const ctA = a.attrs?.ct || '0';
            const ctB = b.attrs?.ct || '0';
            return ctA.localeCompare(ctB);
          });

          for (let i = 0; i < tsisToRemove; i++) {
            const tsiToRemove = sortedTSIs[i];
            const index = parent.tasks.findIndex(t => t.id === tsiToRemove.id);
            if (index !== -1) {
              console.log(`[NOTIFICATION] Removing old TSI: ${tsiToRemove.name} (ct: ${tsiToRemove.attrs?.ct})`);
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

      console.log('[NOTIFICATION] Resource added to tree:', resourceName);
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
          console.log('[NOTIFICATION] Resource will be deleted after flashing:', resourceName);
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
            console.log('[NOTIFICATION] Resource removed from tree:', resourceName);
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
        const message = `이 컨테이너에 ${element.childCount}개의 CIN 리소스가 있습니다.\n\n전체를 로드하시겠습니까?\n(취소를 누르면 로드하지 않습니다)`;

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
            const cinUriList = await retrieve_resource(
              this.originator,
              target.host,
              target.port,
              resourcePath,
              'fu=1&ty=4&lim=5'  // CIN 타입, 최신 5개
            );
            let cinUris = cinUriList['m2m:uril'] || [];
            if (typeof cinUris === 'string') {
              cinUris = cinUris.trim().split(/\s+/).filter(u => u.length > 0);
            }
            console.log(`[LOAD CHILDREN] Found ${cinUris.length} CIN(s):`, cinUris);
            childUris.push(...cinUris);
          } catch (error) {
            console.log('[LOAD CHILDREN] No CIN found or error:', error.message);
          }

          // 2. SUB 로드 (ty=23, 전체)
          try {
            const subUriList = await retrieve_resource(
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
        } else if (element.ty === 29) {
          // TS: TSI(최신 5개) + SUB(전체) 분리 로드
          console.log(`[LOAD CHILDREN] Loading TSI and SUB separately for TS...`);

          // 1. TSI 로드 (ty=30, 최신 5개만)
          try {
            const tsiUriList = await retrieve_resource(
              this.originator,
              target.host,
              target.port,
              resourcePath,
              'fu=1&ty=30&lim=5'  // TSI 타입, 최신 5개
            );
            let tsiUris = tsiUriList['m2m:uril'] || [];
            if (typeof tsiUris === 'string') {
              tsiUris = tsiUris.trim().split(/\s+/).filter(u => u.length > 0);
            }
            console.log(`[LOAD CHILDREN] Found ${tsiUris.length} TSI(s):`, tsiUris);
            childUris.push(...tsiUris);
          } catch (error) {
            console.log('[LOAD CHILDREN] No TSI found or error:', error.message);
          }

          // 2. SUB 로드 (ty=23, 전체)
          try {
            const subUriList = await retrieve_resource(
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

          const uriList = await retrieve_resource(
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
            const resData = await retrieve_resource(
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

              // hasChildren은 CNT(ty=3), FCNT(ty=28), TS(ty=29)이면서 cbs > 0인 경우만 true
              hasChildren = false;
              if (resourceNode.ty === 3 || resourceNode.ty === 28 || resourceNode.ty === 29) {
                if (typeof cbs === 'number' && cbs > 0) {
                  hasChildren = true;
                  console.log(`  → ty=${resourceNode.ty} with cbs=${cbs}, hasChildren=true`);
                } else if (cbs !== undefined && cbs !== null && cbs !== '' && !isNaN(Number(cbs))) {
                  const cbsNum = Number(cbs);
                  hasChildren = cbsNum > 0;
                  console.log(`  → ty=${resourceNode.ty} with cbs=${cbsNum} (converted), hasChildren=${hasChildren}`);
                } else {
                  console.log(`  → ty=${resourceNode.ty} with no cbs, hasChildren=false`);
                }
              } else {
                // 나머지 리소스는 hasChildren = false (토글 없이 항상 표시)
                console.log(`  → Not CNT/FCNT/TS, hasChildren=false`);
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

        // CIN/FCIN/TSI는 ct(생성시간) 내림차순 정렬 — 최신이 맨 위
        allChildren.sort((a, b) => {
          const isInstA = (a.ty === 4 || a.ty === 58 || a.ty === 30);
          const isInstB = (b.ty === 4 || b.ty === 58 || b.ty === 30);
          if (isInstA && isInstB) {
            return (b.attrs?.ct || '').localeCompare(a.attrs?.ct || '');
          }
          // 인스턴스가 아닌 리소스(SUB 등)는 앞에 유지
          if (!isInstA && isInstB) return -1;
          if (isInstA && !isInstB) return 1;
          return 0;
        });
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
        23: 'SUB',
        28: 'FCNT',
        29: 'TS',
        30: 'TSI',
        58: 'FCIN'
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
        23: 'm2m:sub', // SUB
        28: 'm2m:fcnt', // FCNT
        29: 'm2m:ts',  // TS
        30: 'm2m:tsi', // TSI
        58: 'm2m:fcin'  // FCIN
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

        // FCNT/FCIN의 경우 SDT 커스텀 속성 보존 (스키마에 없는 나머지 속성 전부 복사)
        if (node.ty === 28 || node.ty === 58) {
            const skipKeys = ['ri', 'ct', 'lt', 'pi', 'et', 'st', 'ty', 'cni', 'cbs'];
            // 최상위 속성을 먼저 저장 (PUT으로 업데이트된 최신값)
            Object.keys(node).forEach((key) => {
                if (!key.startsWith('m2m:') && !key.startsWith('cod:') && key !== 'custom_attrs'
                    && baseAttrs[key] === undefined && !skipKeys.includes(key)) {
                    baseAttrs[key] = node[key];
                }
            });
            // custom_attrs는 최상위에 없는 속성만 fallback으로 추가
            if (node['custom_attrs'] && typeof node['custom_attrs'] === 'object' && !Array.isArray(node['custom_attrs'])) {
                Object.entries(node['custom_attrs']).forEach(([cKey, cVal]) => {
                    if (baseAttrs[cKey] === undefined) {
                        baseAttrs[cKey] = cVal;
                    }
                });
            }
        }

        // hasChildren: CNT(ty=3) 또는 FCNT(ty=28)이면서 인스턴스가 있는 경우 true
        let hasChildren = false;
        if (node.ty === 3) {
            // CNT의 경우: cni(CIN count) 또는 cbs를 확인
            if (node.cni !== undefined && node.cni > 0) {
                hasChildren = true;
            } else if (node.cbs !== undefined && node.cbs > 0) {
                hasChildren = true;
            }
        } else if (node.ty === 28) {
            // FCNT의 경우: cni(FCIN count) 또는 cbs를 확인
            if (node.cni !== undefined && node.cni > 0) {
                hasChildren = true;
            } else if (node.cbs !== undefined && node.cbs > 0) {
                hasChildren = true;
            }
        } else if (node.ty === 29) {
            // TS의 경우: cni(TSI count) 또는 cbs를 확인
            if (node.cni !== undefined && node.cni > 0) {
                hasChildren = true;
            } else if (node.cbs !== undefined && node.cbs > 0) {
                hasChildren = true;
            }
        }

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

        // FCNT의 경우 cni로 FCIN 개수 저장 (표시용)
        if (node.ty === 28 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 58; // FCIN
        }

        // TS의 경우 cni로 TSI 개수 저장 (표시용)
        if (node.ty === 29 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 30; // TSI
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
    },
    originator(newVal) {
      localStorage.setItem('originator', newVal);
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
  align-items: flex-start;
  margin: 0 10px;
  padding: 10px 0;
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
  background: #e8ecf1;
  border-radius: 12px;
  padding: 6px;
}

.canvas {
  border: none;
  width: 78%;
  height: 80vh;
  padding: 14px;
  margin: 6px;
  background: linear-gradient(170deg, #ffffff 0%, #f4f6f9 35%, #eaecf2 70%, #e0e4ec 100%);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  box-shadow:
    10px 10px 24px rgba(0, 0, 0, 0.14),
    -6px -6px 18px rgba(255, 255, 255, 0.9),
    inset 0 2px 4px rgba(255, 255, 255, 0.8),
    inset 0 -2px 4px rgba(0, 0, 0, 0.03);
}

.canvas-expand-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #e8ecf1, #d1d5db);
  color: #4a5568;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    3px 3px 6px rgba(0, 0, 0, 0.12),
    -2px -2px 5px rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.canvas-expand-btn:hover {
  background: linear-gradient(145deg, #dde1e7, #c5c9d0);
  color: #2d3748;
  box-shadow:
    4px 4px 8px rgba(0, 0, 0, 0.16),
    -2px -2px 6px rgba(255, 255, 255, 0.9);
}

.canvas-expand-btn:active {
  box-shadow:
    inset 2px 2px 4px rgba(0, 0, 0, 0.12),
    inset -1px -1px 3px rgba(255, 255, 255, 0.6);
}

.scroll-container {
  overflow: auto;
  height: 100%;
}

.rightTab {
  border: none;
  width: 20%;
  height: 80vh;
  padding: 12px;
  margin: 6px;
  overflow: auto;
  background: linear-gradient(170deg, #ffffff 0%, #f4f6f9 35%, #eaecf2 70%, #e0e4ec 100%);
  border-radius: 18px;
  box-sizing: border-box;
  position: relative;
  box-shadow:
    10px 10px 24px rgba(0, 0, 0, 0.14),
    -6px -6px 18px rgba(255, 255, 255, 0.9),
    inset 0 2px 4px rgba(255, 255, 255, 0.8),
    inset 0 -2px 4px rgba(0, 0, 0, 0.03);
}

.nav {
  display: block;
  margin-bottom: 0;
  min-width: 1200px;
  overflow: visible;
  position: relative;
  z-index: 100;
}


.dragArea {
  border: none;
  height: 100%;
  overflow-y: auto;
  transform-origin : center center;
  margin-bottom: 6px;
}


.palette-label {
  font-size: 12px;
  font-weight: 600;
  color: #5a6a7e;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-align: center;
  margin-bottom: 8px;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}
.right_dragArea{
  border: none;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  background: linear-gradient(160deg, #eef1f6, #e2e6ed);
  border-radius: 10px;
  box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -2px -2px 6px rgba(255, 255, 255, 0.7);
  padding: 8px 4px;
}
.right_dragArea > .dragArea {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  flex-basis: 100%;
}
.right_dragArea .resourceBox {
  width: 50%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
}

.resource-section-label {
  width: 100%;
  font-size: 10px;
  font-weight: 600;
  color: #8494a7;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  padding: 2px 10px;
  margin-top: 2px;
}

.resource-section-label.has-divider {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(100, 116, 139, 0.25);
}

.t_dragArea {
  border: none;
  height: 100%;
  background: linear-gradient(160deg, #eef1f6, #e2e6ed);
  border-radius: 10px;
  box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.08), inset -2px -2px 6px rgba(255, 255, 255, 0.7);
}

.resourceTree {
  flex-grow: 1;
}

.trashcan {
  height: 10%;
  margin-top: 20px;
  margin-bottom: 20px;
}

.trashcan .dragArea {
  height: 100%;
}
.trashcan-image{
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  bottom: 75%;
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
  z-index: 1100;
  width: 100vw;
  height: 100vh;

}

.modal .overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1100;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.3);
}

.modal .modalBody {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1101;
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

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.action-btn {
  border: 1px solid #d0d0d0;
  background: linear-gradient(145deg, #ffffff, #e8ecf1);
  color: #2c3e50;
  padding: 10px 14px;
  border-radius: 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow:
    4px 4px 10px rgba(0, 0, 0, 0.12),
    -3px -3px 8px rgba(255, 255, 255, 0.85),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}
.action-btn:hover {
  background: linear-gradient(145deg, #f0f4ff, #dce3f0);
  border-color: #4374D9;
  color: #1a3a6f;
  box-shadow:
    5px 5px 12px rgba(0, 0, 0, 0.15),
    -3px -3px 10px rgba(255, 255, 255, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transform: translateY(-1px);
}
.action-btn:active {
  transform: translateY(0);
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.12),
    inset -2px -2px 5px rgba(255, 255, 255, 0.6);
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

/* 캔버스 전체보기 모달 */
.fullview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fullview-fade-in 0.25s ease;
}

@keyframes fullview-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fullview-modal {
  width: 92%;
  height: 90%;
  background: linear-gradient(170deg, #ffffff 0%, #f4f6f9 35%, #eaecf2 70%, #e0e4ec 100%);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  animation: fullview-scale-in 0.25s ease;
}

@keyframes fullview-scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.fullview-close {
  position: absolute;
  top: 12px;
  right: 22px;
  z-index: 10;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #e8ecf1, #d1d5db);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    3px 3px 6px rgba(0, 0, 0, 0.1),
    -2px -2px 5px rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.fullview-close:hover {
  background: linear-gradient(145deg, #fecaca, #fca5a5);
  color: #dc2626;
  box-shadow:
    3px 3px 8px rgba(220, 38, 38, 0.15),
    -2px -2px 5px rgba(255, 255, 255, 0.9);
}

.fullview-tag {
  position: absolute;
  top: 14px;
  left: 18px;
  z-index: 10;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  background: linear-gradient(145deg, #e8ecf1, #d1d5db);
  padding: 4px 14px;
  border-radius: 20px;
  box-shadow:
    2px 2px 5px rgba(0, 0, 0, 0.08),
    -1px -1px 3px rgba(255, 255, 255, 0.7);
}

.fullview-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
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

/* 설정 패널 스타일 */
.settings-wrapper {
  position: relative;
}

.settings-gear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  padding: 0;
}

.settings-gear:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.15);
}

.settings-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #d8dce4;
  border: 1px solid #c5cad3;
  border-radius: 12px;
  padding: 14px 18px;
  min-width: 580px;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.settings-panel-title {
  color: #3a4555;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #c5cad3;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.settings-row:last-child {
  margin-bottom: 0;
}

.settings-label {
  color: #3a4555;
  font-size: 14px;
  font-weight: 500;
}

.settings-select {
  background: #eaedf2;
  color: #2e3847;
  border: 1px solid #b8bec8;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
}

.settings-select option {
  background: #eaedf2;
  color: #2e3847;
}

.settings-divider {
  color: #5a6a7e;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 12px 0 10px;
  padding: 6px 0;
  border-top: 1px solid #c5cad3;
  border-bottom: 1px solid #c5cad3;
  text-align: center;
}

.settings-input {
  background: #eaedf2;
  color: #2e3847;
  border: 1px solid #b8bec8;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  width: 130px;
  outline: none;
}

.settings-input:focus {
  border-color: #8a9bb0;
  box-shadow: 0 0 4px rgba(90, 120, 160, 0.25);
}

.settings-hint {
  color: #7a8594;
  font-size: 10px;
  margin: -6px 0 8px;
}

/* 리소스별 헤더 풀 테이블 */
.header-table-wrap {
  overflow-x: auto;
  margin-bottom: 4px;
}

.header-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.header-table thead th {
  color: #5a6a7e;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 3px;
  text-align: left;
  border-bottom: 1px solid #c5cad3;
  white-space: nowrap;
}

.header-table tbody tr {
  border-bottom: 1px solid #ccd1d9;
}

.header-table tbody tr:last-child {
  border-bottom: none;
}

.header-td-name {
  color: #3a4555;
  font-weight: 500;
  font-size: 12px;
  padding: 3px 4px 3px 0;
  white-space: nowrap;
}

.header-input {
  background: #eaedf2;
  color: #2e3847;
  border: 1px solid #b8bec8;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 11px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.header-input:focus {
  border-color: #8a9bb0;
  box-shadow: 0 0 4px rgba(90, 120, 160, 0.25);
}

.header-input-origin { min-width: 60px; }
.header-input-ri { min-width: 70px; }
.header-input-accept { min-width: 100px; }

.header-select {
  background: #eaedf2;
  color: #2e3847;
  border: 1px solid #b8bec8;
  border-radius: 4px;
  padding: 3px 2px;
  font-size: 11px;
  cursor: pointer;
  width: 100%;
}

.header-select option {
  background: #eaedf2;
  color: #2e3847;
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