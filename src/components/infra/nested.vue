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

          <!-- CNT의 CIN만 토글 표시: CNT(ty=3)이면서 자식이 CIN(childType=4)인 경우만 -->
          <button
            v-if="element.ty === 3 && element.createdOnServer && element.hasChildren && element.childType === 4"
            class="toggleBtn"
            :style="getToggleStyle(element.ty)"
            @click.stop="$emit('toggle-expand', element, 'default')"
            :title="element.expanded ? 'Collapse' : 'Expand'"
          >
            {{ element.expanded ? '−' : '+' }}
          </button>
          <span v-if="element.ty === 3 && element.childCount" class="child-count">
            {{ element.childCount }}
          </span>

          <!-- AE 확대 보기 버튼: AE(ty=2)이면서 서버에서 로드한 경우, 확대 뷰가 아닐 때만 -->
          <button
            v-if="element.ty === 2 && element.createdOnServer && this.group.name !== 'zoomTree'"
            class="zoomBtn"
            @click.stop="$emit('zoom-view', element)"
            title="Expand View"
          >
            🔍
          </button>
        </div>

        <!-- Show children: CNT의 CIN만 토글 제어, CNT의 CNT는 항상 표시 -->
        <nested-draggable
          v-if="(element.ty === 3 && element.childType === 4 ? element.expanded : true) && element.tasks && getChildRT(element.ty).length > 0"
          :tasks="element.tasks"
          :group="this.group"
          @clicked="(element) => { $emit('clicked', element) }"
          @drag-start="(evt) => { $emit('drag-start', evt) }"
          @toggle-expand="(element, side) => { $emit('toggle-expand', element, side) }"
          @zoom-view="(element) => { $emit('zoom-view', element) }"
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
const RT_FCNT = 7;
const RT_TS = 8;
const RT_TSI = 9;
const RT_TSR = 10;
const RT_MGMTOBJ = 11;
const RT_NODE = 14;

const resourceStructure = {
  5: [RT_AE, RT_GRP, RT_MGMTOBJ, RT_ACP, RT_FCNT, RT_CNT, RT_SUB],
  1: [],
  2: [RT_CNT, RT_GRP, RT_SUB, RT_FCNT, RT_TS, RT_TSI, RT_TSR, RT_MGMTOBJ, RT_NODE],
  3: [RT_CNT, RT_CIN, RT_FCNT, RT_TS, RT_SUB],
  4: [],
  9: [],
  16: [],
  23: []
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
            border: "2px solid #FF9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_CIN:
          return {
            border: "2px solid #00BCD4",
            backgroundColor: "rgba(0, 188, 212, 0.1)",
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
            border: "2px solid #FFC107",
            backgroundColor: "rgba(255, 193, 7, 0.2)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        case RT_TS:
          return {
            border: "2px solid #3F51B5",
            backgroundColor: "rgba(63, 81, 181, 0.2)",
            padding: "6px",
            borderRadius: "10px",
            justifyContent: 'center'
          };
        default:
          return {};
      }
    },
    getChildRT(parent_ty) {
      return resourceStructure[parent_ty];
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
          bgColor = '#00BCD4';
          shadowColor = 'rgba(0, 188, 212, 0.5)';
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
          bgColor = '#FFC107';
          shadowColor = 'rgba(255, 193, 7, 0.5)';
          break;
        case RT_TS:
          bgColor = '#3F51B5';
          shadowColor = 'rgba(63, 81, 181, 0.5)';
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
}
.resources .resourceBox .dragArea {
  padding-left: 0px;
  min-height: 0px !important;
  outline: 0px !important;
}
.horizontalLine {
  border-top: 2px solid black;
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
  border-left: 2px solid black;
  margin-left: 100px !important;
  padding-top: 8px !important;
}
.selected {
  border: 2px solid orange !important;
}
.resourceBox p {
  outline: 1px;
  margin: 4px;
  border-radius: 5px;
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
