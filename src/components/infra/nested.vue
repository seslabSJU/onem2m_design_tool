<template>
  <draggable
    class="dragArea"
    tag="ul"
    :clone="cloneResource"
    :list="tasks"
    :group="this.group"
    :sort="true"
    item-key="id"
    :move="validateMove"
    @add="$emit('add', $event)"
    @start="$emit('drag-start', $event)"
  >
    <template #item="{ element }">
      <li :class="{ resourceBox: true, nestTree: this.nestTree }">
        <div class="nestedBox">
          <span v-if="this.nestTree" class="horizontalLine"></span>

          <p
            :class="{
              selected: element.selected,
              centerText: element.ty === 5,
              flashing: element.flashing
            }"
            :style="RTtoStr(element.ty)"
            @click.stop
            @click="$emit('clicked', element)"
          >
            <img v-if="getIcon(element.ty)" :src="getIcon(element.ty)" alt="" class="icon"/>
            {{ getDisplayText(element) }}
          </p>

          <!-- CNT/FCNT/TS 인스턴스 토글 표시 -->
          <button
            v-if="(element.ty === 3 || element.ty === 28 || element.ty === 29) && element.createdOnServer && element.hasChildren && (element.childType === 4 || element.childType === 58 || element.childType === 30)"
            class="toggleBtn"
            :style="getToggleStyle(element.ty)"
            @click.stop="$emit('toggle-expand', element, 'default')"
            :title="element.expanded ? 'Collapse' : 'Expand'"
          >
            {{ element.expanded ? '−' : '+' }}
          </button>
          <span v-if="(element.ty === 3 || element.ty === 28) && element.childCount" class="child-count">
            {{ element.childCount }}
          </span>

          <!-- 줌뷰 내 CNT/FCNT/TS에서 전체 인스턴스 로드 버튼 -->
          <button
            v-if="(element.ty === 3 || element.ty === 28 || element.ty === 29)
              && element.createdOnServer
              && element.instancesLoaded
              && !element.instancesLoadedAll
              && this.group.name === 'zoomTree'"
            class="loadAllBtn"
            @click.stop="$emit('load-all-instances', element)"
            title="Load All Instances"
          >
            ▼ All
          </button>
        </div>

        <!-- Show children: CNT/FCNT 인스턴스 토글 제어, 나머지는 항상 표시 -->
        <nested-draggable
          v-if="(((element.ty === 3 && element.childType === 4) || (element.ty === 28 && element.childType === 58) || (element.ty === 29 && element.childType === 30)) ? element.expanded : true) && element.tasks && getChildRT(element.ty).length > 0"
          :tasks="element.tasks"
          :group="this.group"
          @clicked="(element) => { $emit('clicked', element) }"
          @drag-start="(evt) => { $emit('drag-start', evt) }"
          @toggle-expand="(element, side) => { $emit('toggle-expand', element, side) }"
          @zoom-view="(element) => { $emit('zoom-view', element) }"
          @load-all-instances="(element) => { $emit('load-all-instances', element) }"
          :childRT="getChildRT(element.ty)"
          :nestTree="true"
        />
      </li>
    </template>
  </draggable>
</template>

<script>
import draggable from "vuedraggable";
import { v4 as uuidv4 } from "uuid";
import cseIcon from "@/assets/CSE.png";
import aeIcon from "@/assets/ae.png";
import cntIcon from "@/assets/cnt.png";
import acpIcon from "@/assets/acp.png";
import grpIcon from "@/assets/grp.png";
import subIcon from "@/assets/sub.png";

const RT_CSE = 5;
const RT_ACP = 1;
const RT_AE = 2;
const RT_CNT = 3;
const RT_CIN = 4;
const RT_GRP = 9;
const RT_SUB = 23;
const RT_FCNT = 28;
const RT_FCIN = 58;
const RT_TS = 29;
const RT_TSI = 30;
const RT_MGMTOBJ = 11;
const RT_NODE = 14;

const resourceStructure = {
  5: [RT_AE, RT_GRP, RT_MGMTOBJ, RT_ACP, RT_FCNT, RT_CNT, RT_SUB],
  1: [],
  2: [RT_CNT, RT_GRP, RT_SUB, RT_FCNT, RT_TS, RT_MGMTOBJ, RT_NODE],
  3: [RT_CNT, RT_CIN, RT_FCNT, RT_SUB],
  4: [],
  9: [],
  16: [],
  23: [],
  28: [RT_FCNT, RT_FCIN, RT_CNT, RT_SUB],
  29: [RT_TSI, RT_SUB],
  30: [],
  58: []
};

export default {
  props: {
    tasks: {
      required: true,
      type: Array
    },
    group: {
      required: true,
      type: Object
    },
    childRT: {
      required: false,
      type: Array,
      default: () => []
    },
    clickMethod: {
      required: false,
      type: Function,
      default: () => {}
    },
    nestTree: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  components: {
    draggable
  },
  computed: {},
  name: "nested-draggable",
  methods: {
    validateMove(evt) {
      const target = evt?.to;
      const isTrashcan = !!target?.classList?.contains('t_dragArea') || !!target?.closest('.trashcan');
      const isDeleteZone = !!target?.classList?.contains('delete_dragArea') || !!target?.closest('.deleteZone');

      if (isTrashcan || isDeleteZone) {
        evt.willInsertAfter = true;
        return true;
      }

      const parentComponent = evt?.relatedContext?.component?.$parent;
      const allowedChildren = parentComponent?.childRT;

      if (!Array.isArray(allowedChildren)) {
        evt.willInsertAfter = false;
        return false;
      }

      if (!allowedChildren.includes(evt.draggedContext.element.ty)) {
        evt.willInsertAfter = false;
        return false;
      }

      evt.willInsertAfter = true;
      return true;
    },
    cloneResource(evt) {
      let newElement = JSON.parse(JSON.stringify(evt));

      // Generate new ID only for new resources (templates from right panel)
      if (newElement.id == undefined) {
        newElement.id = uuidv4();
      }

      // For new templates (no attrs yet), initialize empty
      // For existing resources (has attrs), preserve them
      if (!newElement.attrs || Object.keys(newElement.attrs).length === 0) {
        newElement.tasks = [];
        newElement.attrs = {};
        newElement.fullPath = '';
        newElement.createdOnServer = false;

        // Auto-expand so children can be dropped immediately
        newElement.expanded = true;
      }
      // If attrs exist, keep everything (for moving existing resources)

      return newElement;
    },
    RTtoStr(ResourceType) {
      switch (ResourceType) {
        case RT_CSE:
          return {
            border: "2px solid skyblue",
            backgroundColor: "rgba(135, 206, 235, 0.1)",
            padding: "6px",
            borderRadius: "10px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center' // 추가된 스타일
          };
        case RT_AE:
          return {
            border: "2px solid #8BC34A",
            backgroundColor: "rgba(139, 195, 74, 0.1)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_CNT:
          return {
            border: "2px solid #E67E22",
            backgroundColor: "rgba(230, 126, 34, 0.12)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_CIN:
          return {
            border: "2px solid #F0C27A",
            backgroundColor: "rgba(240, 194, 122, 0.15)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_ACP:
          return {
            border: "2px solid red",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_GRP:
          return {
            border: "2px solid #9C27B0",
            backgroundColor: "rgba(156, 39, 176, 0.1)",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_SUB:
          return {
            border: "2px solid #2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_FCNT:
          return {
            border: "2px solid #C0392B",
            backgroundColor: "rgba(192, 57, 43, 0.1)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_FCIN:
          return {
            border: "2px solid #F1948A",
            backgroundColor: "rgba(241, 148, 138, 0.18)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_TS:
          return {
            border: "2px solid #3F51B5",
            backgroundColor: "rgba(63, 81, 181, 0.12)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_TSI:
          return {
            border: "2px solid #7986CB",
            backgroundColor: "rgba(121, 134, 203, 0.15)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        default:
          return {};
      }
    },
    getChildRT(parent_ty) {
      return resourceStructure[parent_ty] || [];
    },
    getIcon(type) {
      const icons = {
        5: null, // null로 설정 -> 아이콘 표시 안함
        1: null,
        2: null,
        3: null,
        4: null,
        9: null,
        23: null,
      };
      return icons[type];
    },
    getDisplayText(element) {
      if (!element) {
        return '';
      }

      const attrs = element.attrs || {};

      if (element.ty === RT_CIN) {
        if (attrs.con && attrs.con !== '') {
          return attrs.con;
        }
        if (attrs.rn && attrs.rn !== '') {
          return attrs.rn;
        }
      }

      if (element.ty === RT_FCIN) {
        const skipKeys = ['rn', 'lbl', 'ty', 'cs', 'ri', 'ct', 'lt', 'pi', 'et', 'st', 'cni', 'cbs', 'cnd', 'org', 'cnf', 'custom_attrs'];
        const customPairs = Object.entries(attrs)
          .filter(([key]) => !skipKeys.includes(key))
          .map(([key, val]) => `${key}: ${val}`);
        if (customPairs.length > 0) {
          return customPairs.join(', ');
        }
      }

      if (element.ty === RT_TSI) {
        if (attrs.con && attrs.con !== '') {
          return attrs.dgt ? `${attrs.con} (${attrs.dgt})` : attrs.con;
        }
        if (attrs.rn && attrs.rn !== '') {
          return attrs.rn;
        }
      }

      if (element.ty === RT_FCNT) {
        if (attrs.cnd && attrs.cnd !== '') {
          const cndParts = attrs.cnd.split('.');
          const shortName = cndParts[cndParts.length - 1];
          const abbr = shortName.length > 5 ? shortName.substring(0, 5) : shortName;
          return `cod:${abbr}`;
        }
      }

      if (attrs.rn && attrs.rn !== '') {
        return attrs.rn;
      }

      return element.name || '';
    },
    getToggleStyle(ResourceType) {
      let bgColor = '';
      let shadowColor = '';

      switch (ResourceType) {
        case RT_CSE:
          bgColor = 'skyblue';
          shadowColor = 'rgba(135, 206, 235, 0.5)';
          break;
        case RT_AE:
          bgColor = '#8BC34A';
          shadowColor = 'rgba(139, 195, 74, 0.5)';
          break;
        case RT_CNT:
          bgColor = '#FF9800';
          shadowColor = 'rgba(255, 152, 0, 0.5)';
          break;
        case RT_CIN:
          bgColor = '#FFB74D';
          shadowColor = 'rgba(255, 183, 77, 0.5)';
          break;
        case RT_ACP:
          bgColor = 'red';
          shadowColor = 'rgba(255, 0, 0, 0.5)';
          break;
        case RT_GRP:
          bgColor = '#9C27B0';
          shadowColor = 'rgba(156, 39, 176, 0.5)';
          break;
        case RT_SUB:
          bgColor = '#2196F3';
          shadowColor = 'rgba(33, 150, 243, 0.5)';
          break;
        case RT_FCNT:
          bgColor = '#E53935';
          shadowColor = 'rgba(229, 57, 53, 0.5)';
          break;
        case RT_FCIN:
          bgColor = '#EF9A9A';
          shadowColor = 'rgba(239, 154, 154, 0.5)';
          break;
        case RT_TS:
          bgColor = '#3F51B5';
          shadowColor = 'rgba(63, 81, 181, 0.5)';
          break;
        case RT_TSI:
          bgColor = '#7986CB';
          shadowColor = 'rgba(121, 134, 203, 0.5)';
          break;
        default:
          bgColor = '#667eea';
          shadowColor = 'rgba(102, 126, 234, 0.5)';
      }

      return {
        background: bgColor,
        boxShadow: `0 2px 6px ${shadowColor}`
      };
    }
  }
};
</script>

<style scoped>
.toggleBtn {
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-right: 8px;
  margin-left: 4px;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggleBtn:hover {
  filter: brightness(1.2);
  transform: scale(1.15);
}

.toggleBtn:active {
  transform: scale(0.95);
  filter: brightness(0.9);
}

.child-count {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  margin-left: 4px;
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 10px;
  display: inline-block;
}

.loadAllBtn {
  background: linear-gradient(145deg, #FF9800, #e68900);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.loadAllBtn:hover {
  background: linear-gradient(145deg, #FFB74D, #FF9800);
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.loadAllBtn:active {
  transform: scale(0.95);
}

.zoomBtn {
  background: linear-gradient(145deg, #4374D9, #2a5bb8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.zoomBtn:hover {
  background: linear-gradient(145deg, #5a8aea, #3a6bc8);
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.zoomBtn:active {
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.warningBadge {
  background: #ff9800;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  font-weight: bold;
}

.dragArea {
  min-height: 20px;
  width: 100%;
  padding-left: 0;
  margin: 0;
}
.resources .resourceBox .dragArea {
  padding-left: 0px;
  min-height: 0px !important;
  outline: 0px !important;
}
.horizontalLine {
  border-top: 1px solid black;
  width: 60px;
  height: 0px;
  display: inline-block;
}
.nestedBox {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 0px;
}
.dragArea li {
  list-style-type: none;
  margin: 0px;
  padding: 0px;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.0;
  text-align: center;
}
.resourceBox {
  list-style-type: none;
}
.nestTree {
  border-left: 1px solid black;
  margin-left: 87px !important;
  padding-top: 8px !important;
}
.nestTree .nestTree {
  margin-left: 147px !important;
}
/* 마지막 자식: └ 모양으로 깔끔하게 연결 */
.nestTree:last-child {
  border-left-color: transparent;
}
.nestTree:last-child > .nestedBox {
  position: relative;
}
.nestTree:last-child > .nestedBox > .horizontalLine {
  visibility: hidden;
}
.nestTree:last-child > .nestedBox::before {
  content: '';
  position: absolute;
  left: -1px;
  top: -8px;
  bottom: 50%;
  width: 60px;
  border-left: 1px solid black;
  border-bottom: 1px solid black;
}
.selected {
  border: 2px solid orange !important;
}
.resourceBox p {
  outline: 1px;
  margin: 4px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background-color: #fff;
  color: #000;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  min-width: 150px;
  width: fit-content;
  min-height: 40px;
  margin-bottom: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  white-space: nowrap;
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.1), -2px -2px 6px rgba(255, 255, 255, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}
.resourceBox p:hover {
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.15), -3px -3px 8px rgba(255, 255, 255, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}
.icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 10px;
  vertical-align: middle;
}
.centerText {
  justify-content: center; /* 수평 가운데 정렬 */
}

/* 실시간 동기화 - 빨간색 번쩍이는 애니메이션 효과 */
@keyframes flashingBorder {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.9),
                0 0 20px 10px rgba(255, 0, 0, 0.5);
    border-color: red;
    border-width: 3px;
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 0, 0, 0.6),
                0 0 40px 20px rgba(255, 0, 0, 0.3);
    border-color: #ff0000;
    border-width: 4px;
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.9),
                0 0 20px 10px rgba(255, 0, 0, 0.5);
    border-color: red;
    border-width: 3px;
  }
}

.flashing {
  animation: flashingBorder 1s ease-in-out infinite;
  position: relative;
  z-index: 100;
  border-style: solid !important;
}
</style>
