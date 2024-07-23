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
  >
    <template #item="{ element }">
      <li :class="{ resourceBox: true, nestTree: this.nestTree }">
        <div class="nestedBox">
          <span v-if="this.nestTree" class="horizontalLine"></span>
          <p
            :class="{ selected: element.selected, centerText: element.ty === RT_CSE }"
            :style="RTtoStr(element.ty)"
            @click.stop
            @click="$emit('clicked', element)"
          >
            <!-- 아이콘이 있을 때만 렌더링 -->
            <img v-if="getIcon(element.ty)" :src="getIcon(element.ty)" alt="" class="icon"/>
            <!-- 캔버스로 옮겨졌을 때는 rn만 보이게 조건부 렌더링 -->
            <template v-if="this.isOnCanvas">
              <span v-if="element.attrs && element.attrs.rn" class="rn-display">{{ formatName(element.attrs.rn) }}</span>
            </template>
            <!-- 캔버스로 옮겨지지 않았을 때는 element.name 표시 -->
            <template v-else>
              {{ element.name }}
              <span v-if="element.attrs && element.attrs.rn" class="rn-display">({{ formatName(element.attrs.rn) }})</span>
            </template>
          </p>
        </div>
        <nested-draggable
          v-if="element.tasks && getChildRT(element.ty).length > 0"
          :tasks="element.tasks"
          :group="this.group"
          @clicked="(element) => { $emit('clicked', element) }"
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
  3: [RT_CNT, RT_FCNT, RT_TS],
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
      if (evt?.to?.parentElement?.className == "trashcan") {
        evt.willInsertAfter = true;
        return true;
      }
      if (evt.relatedContext.component.$parent.childRT == undefined) {
        evt.willInsertAfter = false;
        return false;
      }
      if (evt.relatedContext.component.$parent.childRT.indexOf(evt.draggedContext.element.ty) == -1) {
        evt.willInsertAfter = false;
        return false;
      }

      evt.willInsertAfter = true;
      return true;
    },
    cloneResource(evt) {
      let newElement = JSON.parse(JSON.stringify(evt));
      if (newElement.id == undefined) newElement.id = uuidv4();
      newElement.tasks = [];
      newElement.attrs = {};
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
        9: null,
        23: null,
      };
      return icons[type];
    },
    formatName(name) {
      const maxLength = 4;
      if (name.length <= maxLength) {
        return name; // 이름이 최대 길이 이하인 경우, 전체 이름 표시
      } else {
        return name.substring(0, maxLength); // 이름이 최대 길이보다 긴 경우, 잘라서 표시
      }
    }
  }
};
</script>

<style scoped>
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
  width: 20px;
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
  margin-left: 30px !important;
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
  width: 150px;
  min-height: 40px;
  margin-bottom: 0px;
  display: flex;
  align-items: center;
}
.icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  margin-left: 10px;
  vertical-align: middle;
}
.rn-display {
  margin-left: 5px;
}
.centerText {
  justify-content: center; /* 수평 가운데 정렬 */
}
</style>
