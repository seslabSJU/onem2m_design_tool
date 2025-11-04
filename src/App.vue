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
      <div
        class="btn button"
        @click="toggleRealtimeSync"
        :style="{
          border: '1px solid black',
          marginLeft: '10px',
          backgroundColor: realtimeSyncEnabled ? '#28a745' : '#192749',
          color: 'white',
          boxShadow: '5px 5px 5px 5px #D5D5D5',
          borderRadius: '10px',
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
        <nestedDraggable
          :tasks="cse1"
          style="padding-left: 0px;"
          :group="{
                    name: 'resourceTree',
                    pull: true,
                    put: true
                  }"
          :childRT="[2, 9, 1, 3, 23]"
          :min-height="200"
          item-key="id"
          @clicked="(element) => {
            this.setAttributes(element);
          }"
          @move="(evt) => { this.isDragging = true; }"
          @add="handleAdd"
          @drag-start="handleDragStart"
          @toggle-expand="handleToggleExpand"
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
        @drag-start="handleDragStart"
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
          allCollapsed: false,
          attrs:{

          }
        }
      ],

      resources: [
          { name: "AE", ty: RT.AE },
          { name: "CNT", ty: RT.CNT },
          { name: "CIN", ty: RT.CIN },
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
      originator: "CAdmin",
      deleteBuffer: [],
      treeSnapshotBeforeDrag: null,
      draggedElementInfo: null,
      draggedElementPath: '',
      // WebSocket 관련
      websocket: null,
      realtimeSyncEnabled: false,
      subscriptionCreated: false,
      subscriptionResourceName: null,
      flashingResources: new Set(),
      backendUrl: 'http://localhost:4001',
      websocketUrl: 'ws://localhost:4001'
    }
  },

  async created(){
    const stored = sessionStorage.getItem("CSE1");
    if (stored) {
      try {
        const cse = JSON.parse(stored);
        if (Array.isArray(cse)) {
          this.cse1 = cse;
          this.updateFullPaths();
        }
      } catch (error) {
        console.error('Failed to parse stored CSE data:', error);
      }
    }
    this.targetIP = sessionStorage.getItem('targetIP');

    // CSE가 이미 로드되어 있으면 자동으로 실시간 동기화 시작
    if (this.targetIP && this.cse1[0]?.attrs) {
      console.log('[AUTO] CSE already loaded, starting real-time sync...');
      // 약간의 딜레이 후 시작 (DOM이 완전히 로드된 후)
      setTimeout(async () => {
        try {
          await this.toggleRealtimeSync();
        } catch (error) {
          console.error('[AUTO] Failed to auto-start real-time sync on page load:', error);
        }
      }, 1000);
    }
  },

  methods: {

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

    normalizePath(value) {
      if (!value && value !== 0) {
        return '';
      }

      let normalized = String(value).trim();
      if (normalized === '') {
        return '';
      }

      normalized = normalized.replace(/\\/g, '/');
      normalized = normalized.replace(/\/{2,}/g, '/');

      if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }

      if (normalized.startsWith('/')) {
        normalized = normalized.replace(/^\/+/, '');
      }

      return normalized;
    },

    resolveResourcePath(resourcePath, basePath) {
      // Normalizes drag-and-drop path and the configured base path before sending a request.
      const toSegments = (value) => {
        const normalized = this.normalizePath(value);
        if (!normalized) {
          return [];
        }
        return normalized
          .split('/')
          .map(segment => segment.trim())
          .filter(segment => segment.length > 0);
      };

      const baseSegments = toSegments(basePath);
      const resourceSegments = toSegments(resourcePath);

      if (!baseSegments.length) {
        return resourceSegments.join('/');
      }

      if (resourceSegments.length) {
        const baseTail = baseSegments[baseSegments.length - 1];
        if (baseTail && resourceSegments[0]?.toLowerCase() === baseTail.toLowerCase()) {
          resourceSegments.shift();
        }

        const rootName = (this.cse1?.[0]?.attrs?.rn || this.cse1?.[0]?.name || '').trim();
        if (rootName && resourceSegments[0]?.toLowerCase() === rootName.toLowerCase()) {
          resourceSegments.shift();
        }
      }

      return [...baseSegments, ...resourceSegments].join('/');
    },

    resolveResourceRiPath(element, basePath) {
      const ri = element?.attrs?.ri || '';
      if (!ri) {
        return '';
      }

      const normalizedRi = this.normalizePath(ri);
      const normalizedBase = this.normalizePath(basePath);

      if (!normalizedBase) {
        return normalizedRi;
      }

      if (normalizedRi && normalizedRi.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
        return normalizedRi;
      }

      return `${normalizedBase}/${normalizedRi}`;
    },

    syncSessionStorage() {
      try {
        sessionStorage.setItem('CSE1', JSON.stringify(this.cse1));
      } catch (error) {
        console.error('Failed to sync session storage:', error);
      }
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

        // Send DELETE notification to other browsers (실시간 동기화)
        if (this.realtimeSyncEnabled && this.websocket) {
          try {
            const deleteNotification = {
              type: 'resource_change',
              eventType: 3, // DELETE
              resourceUri: finalPath,
              resource: {}
            };

            // Python notification server로 직접 전송
            await fetch('http://localhost:8081/manual-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(deleteNotification)
            });

            console.log('[DELETE] ✅ Sent real-time delete notification:', finalPath);
          } catch (error) {
            console.error('[DELETE] Failed to send notification:', error);
          }
        }

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

    // Handle toggle expand/collapse
    async handleToggleExpand(element, side = 'default') {
      console.log('[TOGGLE] Element:', element.name, 'side:', side, 'expanded:', element.expanded);

      // CSE 오른쪽 토글 - 첫 클릭: 전체 Discovery, 이후: 전체 펼치기/접기
      if (side === 'right' && element.ty === 5) {
        // 첫 클릭: 전체 리소스 Discovery
        if (!element.allResourcesLoaded) {
          console.log('[TOGGLE] Loading ALL resources from server with Discovery...');

          try {
            if (!this.targetIP) {
              alert('CSE IP 주소를 먼저 입력하세요.');
              return;
            }

            const target = this.parseTargetUrl(this.targetIP);
            if (!target) {
              alert('Invalid URL format');
              return;
            }

            // 모든 리소스 타입 Discovery (AE, ACP 제외 - 이미 로드됨)
            const resourceTypes = [
              { ty: 3, name: 'CNT' },
              { ty: 4, name: 'CIN' },
              { ty: 9, name: 'GRP' },
              { ty: 23, name: 'SUB' },
              { ty: 7, name: 'FCNT' },
            ];

            const additionalResources = [];

            for (const rt of resourceTypes) {
              try {
                console.log(`[TOGGLE] Discovering ALL ${rt.name} resources...`);
                const uriList = await http_resource_retrieve(
                  this.originator,
                  target.host,
                  target.port,
                  target.basePath,
                  `fu=1&ty=${rt.ty}`
                );

                const uris = uriList['m2m:uril'] || [];
                console.log(`[TOGGLE] Found ${uris.length} ${rt.name} resources`);

                // 각 리소스 정보 병렬로 가져오기
                const promises = uris.map(uri =>
                  http_resource_retrieve(
                    this.originator,
                    target.host,
                    target.port,
                    uri,
                    ''
                  ).then(resData => {
                    const resKey = `m2m:${rt.name.toLowerCase()}`;
                    const resNode = resData[resKey];
                    if (resNode) {
                      return { uri, node: resNode, type: rt.name };
                    }
                    return null;
                  }).catch(error => {
                    console.error(`[TOGGLE] Failed to load ${uri}:`, error);
                    return null;
                  })
                );

                const results = await Promise.all(promises);
                results.forEach(res => {
                  if (res) additionalResources.push(res);
                });
              } catch (error) {
                console.error(`[TOGGLE] Failed to discover ${rt.name}:`, error);
              }
            }

            console.log(`[TOGGLE] Total resources discovered: ${additionalResources.length}`);

            // URI 기반으로 트리 구조 생성
            this.buildTreeFromDiscovery(element, additionalResources);

            element.allResourcesLoaded = true;
            element.allCollapsed = false; // 펼쳐진 상태
            this.syncSessionStorage();
          } catch (error) {
            console.error('[TOGGLE] Failed to load all resources:', error);
            alert('전체 리소스 로드 실패. 콘솔을 확인하세요.');
          }
        } else {
          // 이후 클릭: 전체 펼치기/접기 토글
          if (!element.allCollapsed) {
            // 접기
            console.log('[TOGGLE] Collapsing all resources...');
            element.savedExpandState = this.saveExpandState(element.tasks);
            this.collapseAll(element.tasks);
            element.allCollapsed = true;
          } else {
            // 펴기
            console.log('[TOGGLE] Expanding all resources...');
            if (element.savedExpandState) {
              this.restoreExpandState(element.tasks, element.savedExpandState);
            }
            element.allCollapsed = false;
          }
          this.syncSessionStorage();
        }
        return;
      }

      // 일반 리소스 토글
      if (!element.expanded) {
        // + 클릭 → 펼치기
        if (!element.childrenLoaded) {
          // 자식을 아직 로드하지 않았으면 서버에서 로드
          try {
            // CIN이 많은 경우 사용자에게 확인
            if (element.childType === 4 && element.childCount > 100) {
              const proceed = await this.confirmLoadManyCIN(element);
              if (!proceed) {
                return; // 사용자가 취소
              }
            }

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
          // 일부만 로드할지 물어보기
          const limitStr = prompt('로드할 개수를 입력하세요 (최신순, 0=취소)', '100');
          const limit = parseInt(limitStr);

          if (limit > 0) {
            element.loadLimit = limit;
            resolve(true);
          } else {
            resolve(false); // 취소
          }
        }
      });
    },

    // Load children resources using rcn=4 (direct children only)
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
      if (!resourcePath && element.attrs && element.attrs.rn) {
        resourcePath = element.attrs.rn;
      }

      console.log('[LOAD CHILDREN] Using path:', resourcePath);

      try {
        // rcn=4로 직속 자식만 가져오기
        console.log(`[LOAD CHILDREN] Fetching children with rcn=4...`);

        const response = await http_resource_retrieve(
          this.originator,
          target.host,
          target.port,
          resourcePath,
          'rcn=4'
        );

        console.log('[LOAD CHILDREN] Response:', response);

        // 응답에서 자식 리소스 추출
        const allChildren = [];
        const resourceKey = this.getResourceKey(element.ty);
        const parentResource = response[resourceKey];

        if (parentResource) {
          // m2m: 접두사로 시작하는 자식 배열 찾기
          for (const key in parentResource) {
            if (key.startsWith('m2m:') && Array.isArray(parentResource[key])) {
              const childTypeName = key.replace('m2m:', '').toUpperCase();
              console.log(`[LOAD CHILDREN] Found ${parentResource[key].length} ${childTypeName} children`);

              for (const childNode of parentResource[key]) {
                // convertNodeShallow가 타입 기반으로 hasChildren 설정
                const converted = this.convertNodeShallow(childNode, childTypeName);
                allChildren.push(converted);
              }
            }
          }
        }

        console.log(`[LOAD CHILDREN] Total children loaded: ${allChildren.length}`);

        if (allChildren.length === 0) {
          console.log('[LOAD CHILDREN] No children found, hiding toggle');
          element.hasChildren = false;
          element.tasks = [];

          // sessionStorage 업데이트 후 다시 로드
          this.updateFullPaths();
          this.syncSessionStorage();
          this.loadFromSessionStorage();
        } else {
          element.tasks = allChildren;

          this.updateFullPaths();
          this.syncSessionStorage();
        }

      } catch (error) {
        console.error('[LOAD CHILDREN] Error:', error);
        throw error;
      }
    },

    // Check if a resource has children
    async checkChildrenExistence(node, target, uri = null) {
      // 자식을 가질 수 없는 타입
      if (node.ty === 4 || node.ty === 1 || node.ty === 23) {
        node._hasChildren = false;
        return;
      }

      // 모든 타입: rcn=4로 자식이 있는지 확인
      try {
        // uri가 주어지면 사용, 아니면 node에서 추출
        const resourcePath = uri || (node.fullPath || node.ri || node.rn || '');
        if (!resourcePath) {
          console.log('[checkChildrenExistence] No path for:', node);
          node._hasChildren = false;
          return;
        }

        console.log(`[checkChildrenExistence] Checking ${resourcePath}...`);

        const response = await http_resource_retrieve(
          this.originator,
          target.host,
          target.port,
          resourcePath,
          'rcn=4'
        );

        const resourceKey = this.getResourceKey(node.ty);
        const resource = response[resourceKey];

        let hasChildren = false;
        if (resource) {
          for (const key in resource) {
            if (key.startsWith('m2m:') && Array.isArray(resource[key]) && resource[key].length > 0) {
              hasChildren = true;
              console.log(`[checkChildrenExistence] ${resourcePath} has ${resource[key].length} ${key} children`);
              break;
            }
          }
        }

        node._hasChildren = hasChildren;
        console.log(`[checkChildrenExistence] ${resourcePath} hasChildren: ${hasChildren}`);
      } catch (error) {
        console.error('[checkChildrenExistence] Error:', error);
        node._hasChildren = false;
      }
    },

    // Get resource key for oneM2M response (m2m:ae, m2m:cnt, etc.)
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

    // Build tree structure from Discovery results
    buildTreeFromDiscovery(cseElement, resources) {
      console.log('[BUILD TREE] Building tree from', resources.length, 'resources');

      // URI를 부모-자식 관계로 구성
      // 예: TinyIoT/ae1/cnt1/cin1 → [TinyIoT, ae1, cnt1, cin1]
      for (const res of resources) {
        const pathParts = res.uri.split('/').filter(p => p.length > 0);
        console.log('[BUILD TREE] Processing:', res.uri, 'parts:', pathParts);

        // CSE 이름 제거 (첫 번째 부분)
        pathParts.shift(); // Remove "TinyIoT"

        if (pathParts.length === 0) {
          console.log('[BUILD TREE] Skipping root level resource');
          continue;
        }

        // 트리에서 부모 찾기
        let parent = cseElement;
        let currentPath = '';

        for (let i = 0; i < pathParts.length - 1; i++) {
          const partName = pathParts[i];
          currentPath += (currentPath ? '/' : '') + partName;

          // tasks에서 해당 이름의 자식 찾기
          let found = parent.tasks.find(t => t.attrs && t.attrs.rn === partName);

          if (!found) {
            console.log('[BUILD TREE] Parent not found:', partName, 'in', parent.name);
            break;
          }

          parent = found;
        }

        // 마지막 부분이 현재 리소스
        const resourceName = pathParts[pathParts.length - 1];

        // 이미 존재하는지 확인
        const existing = parent.tasks.find(t => t.attrs && t.attrs.rn === resourceName);
        if (existing) {
          console.log('[BUILD TREE] Already exists:', resourceName);
          continue;
        }

        // 새 리소스 추가
        const converted = this.convertNodeShallow(res.node, res.type);
        parent.tasks.push(converted);
        console.log('[BUILD TREE] Added', res.type, resourceName, 'to', parent.name);
      }

      console.log('[BUILD TREE] Tree building complete');
      this.updateFullPaths();
    },

    // Get possible child resource types for a parent type
    getChildResourceTypes(parentType) {
      const typeMap = {
        5: [ // CSE
          { ty: 1, name: 'ACP' },
          { ty: 2, name: 'AE' },
          { ty: 3, name: 'CNT' },
          { ty: 9, name: 'GRP' },
          { ty: 23, name: 'SUB' }
        ],
        2: [ // AE
          { ty: 1, name: 'ACP' },
          { ty: 3, name: 'CNT' },
          { ty: 9, name: 'GRP' },
          { ty: 23, name: 'SUB' }
        ],
        3: [ // CNT
          { ty: 3, name: 'CNT' },
          { ty: 4, name: 'CIN' },
          { ty: 23, name: 'SUB' }
        ],
        9: [ // GRP
          { ty: 23, name: 'SUB' }
        ]
      };

      return typeMap[parentType] || [];
    },

    // Convert server response to children array
    convertResponseToChildren(response, parentElement) {
      const children = [];

      // Response format: { "m2m:cb": { "m2m:ae": [...], "m2m:acp": [...] } }
      // or { "m2m:ae": { "m2m:cnt": [...] } }
      // or { "m2m:cnt": { "m2m:cin": [...] } }

      const parseChildren = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
          return;
        }

        for (const key in obj) {
          if (key.startsWith('m2m:') && Array.isArray(obj[key])) {
            const childType = key.replace('m2m:', '').toUpperCase();
            obj[key].forEach(child => {
              children.push(this.convertNode(child, childType));
            });
          } else if (typeof obj[key] === 'object') {
            parseChildren(obj[key]);
          }
        }
      };

      parseChildren(response);

      return children;
    },

    // createResourceTree랑 짝꿍
    async create_oneM2M_resource() {
      // 원본 cse1 객체를 직접 전달 (JSON 복사하지 않음 - createdOnServer 플래그 유지)
      const target_IP = this.targetIP;

      try {
      // get_jsonfile 함수를 비동기로 호출하고 결과를 기다림
      const response = await get_jsonfile(this.cse1, target_IP);
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


// 서버에 있는 리소스 가져오는 코드 - Discovery 사용
async loadResources() {
    console.log("[loadResources] Starting resource discovery...");
    sessionStorage.setItem('targetIP', this.targetIP);

    if (this.targetIP === "") {
      alert("Please input CSE IP address");
      return;
    }

    // URL 파싱
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

      // Step 1: CSE 기본 정보 가져오기
      console.log("[loadResources] Step 1: Loading CSE info...");
      const cseData = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, '');
      console.log("[loadResources] CSE data:", cseData);

      // Step 2: Discovery로 모든 AE URI 가져오기
      console.log("[loadResources] Step 2: Discovering all AE resources...");
      const aeUriList = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'fu=1&ty=2');
      const aeUris = aeUriList['m2m:uril'] || [];
      console.log(`[loadResources] Found ${aeUris.length} AE resources:`, aeUris);

      // Step 3: Discovery로 모든 ACP URI 가져오기
      console.log("[loadResources] Step 3: Discovering all ACP resources...");
      const acpUriList = await http_resource_retrieve(this.originator, target.host, target.port, target.basePath, 'fu=1&ty=1');
      const acpUris = acpUriList['m2m:uril'] || [];
      console.log(`[loadResources] Found ${acpUris.length} ACP resources:`, acpUris);

      // Step 4: 각 리소스의 정보 가져오기 (속성만, rcn 없이)
      console.log("[loadResources] Step 4: Retrieving resource details...");

      const aeResources = [];
      for (const uri of aeUris) {
        try {
          // URI는 이미 "TinyIoT/resourceName" 형태이므로 그대로 사용
          console.log(`[loadResources] Loading AE: ${uri}`);
          const aeData = await http_resource_retrieve(this.originator, target.host, target.port, uri, '');
          // 응답이 m2m:ae 형태로 오므로 내부 객체 추출
          const aeNode = aeData['m2m:ae'];
          if (aeNode) {
            // AE는 자식을 가질 수 있는 타입이므로 hasChildren=true
            aeNode._hasChildren = true;
            aeResources.push(aeNode);
          }
        } catch (error) {
          console.error(`[loadResources] Failed to load AE ${uri}:`, error);
        }
      }

      const acpResources = [];
      for (const uri of acpUris) {
        try {
          // URI는 이미 "TinyIoT/resourceName" 형태이므로 그대로 사용
          console.log(`[loadResources] Loading ACP: ${uri}`);
          const acpData = await http_resource_retrieve(this.originator, target.host, target.port, uri, '');
          // 응답이 m2m:acp 형태로 오므로 내부 객체 추출
          const acpNode = acpData['m2m:acp'];
          if (acpNode) {
            // ACP는 자식을 가질 수 없음
            acpNode._hasChildren = false;
            acpResources.push(acpNode);
          }
        } catch (error) {
          console.error(`[loadResources] Failed to load ACP ${uri}:`, error);
        }
      }

      // Step 5: 데이터 구조 만들기
      console.log("[loadResources] Step 5: Building resource tree...");
      const cseInfo = cseData['m2m:cb'];
      cseInfo['m2m:ae'] = aeResources;
      cseInfo['m2m:acp'] = acpResources;

      const fullData = { 'm2m:cb': cseInfo };
      console.log("[loadResources] Full data structure:", fullData);

      const convertedData = this.convertListToFileFormat(fullData);
      console.log("[loadResources] Converted data:", convertedData);

      sessionStorage.setItem('CSE1', JSON.stringify(convertedData, null, 2));
      this.loadFromSessionStorage();

      const endTime = performance.now();
      console.log(`[loadResources] ✅ Loaded ${aeResources.length} AE + ${acpResources.length} ACP in ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
      console.error("[loadResources] ❌ Failed to load resources:", error);
      alert("Failed to load resources. See console for details.");
    }
  },


    convertNode(node, nodeName, depth = 0) {
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
            'poa'
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

        // Determine if this resource can have children
        const canHaveChildren = (ty) => {
            return ty === 5  // CSE → AE, ACP, etc.
                || ty === 2  // AE → CNT, SUB, GRP
                || ty === 3  // CNT → CIN, CNT
                || ty === 9; // GRP → SUB
            // CIN(4), ACP(1), SUB(23) cannot have children
        };

        const result = {
            name: nodeName,
            ty: node.ty,
            id: node.ri || '',
            tasks: [],
            attrs: baseAttrs,
            selected: false,
            createdOnServer: true,  // 서버에서 로드한 리소스이므로 이미 서버에 존재

            // Lazy loading 상태
            expanded: false,         // 기본은 접힌 상태
            hasChildren: canHaveChildren(node.ty),  // 자식 가능 여부
            childrenLoaded: false,   // 자식 로드 완료 여부
            childCount: 0,           // 자식 개수
            childType: null          // 자식 타입
        };

        // CNT의 경우 cni (currentNumberOfInstances) 속성으로 CIN 개수 확인
        if (node.ty === 3 && node.cni !== undefined) {
            result.childCount = node.cni;
            result.childType = 4; // CIN
        }

        // 자식노드에 재귀적 요청
        for (const key in node) {
            if (node.hasOwnProperty(key) && key.startsWith('m2m:') && Array.isArray(node[key])) {
                const childNodeName = key.replace('m2m:', '').toUpperCase();
                // depth를 1 증가시켜서 재귀 호출
                result.tasks.push(...node[key].map(child => this.convertNode(child, childNodeName, depth + 1)));
            }
        }

        // 자식이 서버 응답에 포함되어 있으면 이미 로드된 것으로 표시
        if (result.tasks.length > 0) {
            result.childrenLoaded = true;
            // depth 1 (CSE의 직속 자식)만 펼쳐진 상태로
            result.expanded = (depth === 1);
        }

        return result;
    },

    convertListToFileFormat(data) {
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
            'poa'
        ];

        defaultKeys.forEach((key) => {
            if (rootNode[key] !== undefined) {
                rootAttrs[key] = rootNode[key];
            }
        });

        const rootSchema = resourceAttributes[rootNode.ty];
        if (rootSchema) {
            Object.keys(rootSchema).forEach((key) => {
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
            expanded: true,         // CSE 자체는 항상 펼쳐짐
            hasChildren: true,
            childrenLoaded: true,
            allResourcesLoaded: false, // 전체 리소스 Discovery 완료 여부
            savedExpandState: null, // 접기 전 상태 저장
            allCollapsed: false     // 전체 접기 상태
        };

        // CSE의 직속 자식만 파싱 - ACP를 먼저, 그 다음 AE 순서로
        // 1. ACP 먼저 추가
        if (rootNode['m2m:acp'] && Array.isArray(rootNode['m2m:acp'])) {
            convertedData.tasks.push(...rootNode['m2m:acp'].map(child => this.convertNodeShallow(child, 'ACP')));
        }

        // 2. AE 추가
        if (rootNode['m2m:ae'] && Array.isArray(rootNode['m2m:ae'])) {
            convertedData.tasks.push(...rootNode['m2m:ae'].map(child => this.convertNodeShallow(child, 'AE')));
        }

        // 3. 다른 리소스 타입도 추가 (GRP, SUB 등)
        for (const key in rootNode) {
            if (rootNode.hasOwnProperty(key) && key.startsWith('m2m:') && Array.isArray(rootNode[key])) {
                // ACP, AE는 이미 처리했으므로 스킵
                if (key === 'm2m:acp' || key === 'm2m:ae') {
                    continue;
                }
                const childNodeName = key.replace('m2m:', '').toUpperCase();
                convertedData.tasks.push(...rootNode[key].map(child => this.convertNodeShallow(child, childNodeName)));
            }
        }

        console.log('[convertListToFileFormat] Converted CSE with', convertedData.tasks.length, 'direct children (ACP first, then AE)');
        return [convertedData];
    },

    // Shallow conversion - 자식의 자식은 파싱하지 않음
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
            'poa'
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

        // Determine if this resource can have children (타입 기반)
        const canHaveChildren = (ty) => {
            return ty === 5  // CSE → AE, ACP, etc.
                || ty === 2  // AE → CNT, SUB, GRP
                || ty === 3  // CNT → CIN, CNT
                || ty === 9; // GRP → SUB
        };

        // _hasChildren이 설정되어 있으면 그것을 사용
        let hasChildren;
        if (node._hasChildren !== undefined) {
            hasChildren = node._hasChildren;
        } else {
            hasChildren = canHaveChildren(node.ty);
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

        return result;
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
        const setCSEData = async (data) => {
          console.log("************");
          console.log("####", data);
          console.log("--->", data['m2m:cb']);
          this.cse1[0].attrs = data['m2m:cb'];
          this.updateFullPaths();

          // 자동으로 실시간 동기화 시작
          if (!this.realtimeSyncEnabled) {
            console.log('[AUTO] Starting real-time sync after CSE load...');
            try {
              await this.toggleRealtimeSync();
            } catch (error) {
              console.error('[AUTO] Failed to auto-start real-time sync:', error);
            }
          }
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
          this.updateFullPaths();
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
      if(data.ty !== RT.CSE) // 수정
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

        if(task.ty === RT.ACP){ ACP 
          
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
        

        if(task.ty === RT.AE){ /* AE */
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


        if(task.ty === RT.CNT){ /* CNT */
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
        
        
        if(task.ty === RT.SUB){ /* SUB */
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


        if(task.ty === RT.GRP){ /* GRP */
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

    // ===== WebSocket & Real-time Sync Methods =====

    async toggleRealtimeSync() {
      if (!this.realtimeSyncEnabled) {
        // 실시간 동기화 시작
        console.log('[REALTIME] Starting real-time sync...');

        if (!this.targetIP) {
          alert('먼저 CSE를 로드해주세요.');
          return;
        }

        try {
          // 1. WebSocket 연결
          await this.connectWebSocket();

          // 2. Subscription 생성
          await this.createSubscription();

          this.realtimeSyncEnabled = true;
          console.log('[REALTIME] ✅ Real-time sync enabled');
        } catch (error) {
          console.error('[REALTIME] Failed to enable real-time sync:', error);
          alert('실시간 동기화 시작 실패: ' + error.message);
          this.disconnectWebSocket();
        }
      } else {
        // 실시간 동기화 중지
        console.log('[REALTIME] Stopping real-time sync...');
        await this.deleteSubscription();
        this.disconnectWebSocket();
        this.realtimeSyncEnabled = false;
        console.log('[REALTIME] ✅ Real-time sync disabled');
      }
    },

    connectWebSocket() {
      return new Promise((resolve, reject) => {
        console.log('[WS] Connecting to WebSocket...');

        this.websocket = new WebSocket(this.websocketUrl);

        this.websocket.onopen = () => {
          console.log('[WS] ✅ WebSocket connected');
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS] Received:', data);
            this.handleNotification(data);
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('[WS] WebSocket error:', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('[WS] WebSocket closed');
          this.realtimeSyncEnabled = false;
        };

        // 10초 타임아웃
        setTimeout(() => {
          if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      });
    },

    disconnectWebSocket() {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
        console.log('[WS] WebSocket disconnected');
      }
    },

    async createSubscription() {
      console.log('[SUBSCRIPTION] targetIP:', this.targetIP);

      if (!this.targetIP) {
        throw new Error('CSE를 먼저 로드해주세요');
      }

      const target = this.parseTargetUrl(this.targetIP);
      if (!target) {
        throw new Error(`잘못된 URL 형식입니다: ${this.targetIP}`);
      }

      console.log('[SUBSCRIPTION] Creating subscription on:', target);

      const subscriptionName = 'designToolSub_' + Date.now();
      const subscriptionData = {
        'm2m:sub': {
          rn: subscriptionName,
          nu: ['http://localhost:8081'], // Python notification server
          enc: {
            net: [1, 2, 3] // CREATE, UPDATE, DELETE
          }
        }
      };

      try {
        const url = `http://${target.host}:${target.port}/${target.basePath}`;
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

        this.subscriptionCreated = true;
        this.subscriptionResourceName = subscriptionName;
        console.log('[SUBSCRIPTION] ✅ Subscription created:', subscriptionName);
        return result;
      } catch (error) {
        console.error('[SUBSCRIPTION] Failed to create:', error);
        throw error;
      }
    },

    async deleteSubscription() {
      if (!this.subscriptionCreated || !this.subscriptionResourceName) {
        return;
      }

      console.log('[SUBSCRIPTION] Deleting subscription...');

      try {
        const target = this.parseTargetUrl(this.targetIP);
        const url = `http://${target.host}:${target.port}/${target.basePath}/${this.subscriptionResourceName}`;

        console.log('[SUBSCRIPTION] DELETE:', url);

        await fetch(url, {
          method: 'DELETE',
          headers: {
            'X-M2M-Origin': this.originator,
            'X-M2M-RVI': '2a'
          }
        });

        this.subscriptionCreated = false;
        this.subscriptionResourceName = null;
        console.log('[SUBSCRIPTION] ✅ Subscription deleted');
      } catch (error) {
        console.error('[SUBSCRIPTION] Failed to delete:', error);
      }
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
        console.log('[NOTIFICATION] Resource already exists, skipping');
        return;
      }

      // 새 리소스 객체 생성
      const newResource = this.convertNodeShallow(resourceData, resourceType);

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

      // 리소스 찾아서 제거
      const resourceName = pathParts[pathParts.length - 1];
      const index = parent.tasks.findIndex(r =>
        (r.attrs && r.attrs.rn === resourceName) || r.name === resourceName
      );

      if (index !== -1) {
        parent.tasks.splice(index, 1);
        this.updateFullPaths();
        this.syncSessionStorage();
        console.log('[NOTIFICATION] ✅ Resource removed from tree:', resourceName);
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

    findResourceByName(tasks, name) {
      if (!tasks) return null;
      return tasks.find(r =>
        (r.attrs && r.attrs.rn === name) || r.name === name
      );
    },

    addFlashingEffect(uri) {
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

  beforeUnmount() {
    // WebSocket 정리
    if (this.realtimeSyncEnabled) {
      this.deleteSubscription();
      this.disconnectWebSocket();
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
