<template>
    <div>
        <div v-if="modalData.status" class="modal">
            <div class="overlay"></div>
            <div v-if="modalData.type == 'ACR'" class="modalBody">
                <setAcr 
                :acr_props="modalData.data.value"
                @modified="(value) => { 
                    isModified=true;
                }"
                @close="() => { modalData.status=false; modalData.data=undefined; modalData.type=''; }"
                @save="(value) => {  
                    modalData.data.value = value;
                    }"
                />
            </div>
            <div v-if="modalData.type == 'LOAD'" class="modalBody">
                <loadFromRemote />
            </div>
        </div> 
        <div class="titleBox"> 
            <p>{{ element.name }} Attributes</p>
            <div v-if="element.name === 'AE'">
                <div style="text-align: center;">
                    <label for="aei" style="margin-left: 5px; font-weight: bold; margin-right: 10px;">Originator(aei) :</label>
                    <input
                        type="text"
                        v-model="setoriginator.setoriginator.value"
                        name="originator"
                        placeholder="Should Start with C or S"
                    >
                    <button @click="submitOriginator" style="margin-left: 10px;">Submit</button>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button
                    v-if="element.ty === 2 || element.ty === 3 || element.ty === 28"
                    class="zoomBtn"
                    @click="$emit('zoom-view', element)"
                    title="Expanded View"
                >🔍</button>
                <div class="closeBtn" @click="confirmClose">
                    <svg width="25px" height="25px" version="1.0" id="katman_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1436 1054" style="enable-background:new 0 0 1436 1054;" xml:space="preserve">
                        <path d="M718.5,453.8l224-224.3c20.4-20.4,53.3-20.4,73.6,0c20.4,20.4,20.4,53.3,0,73.6l-224,224.6l224,224c20.4,20.4,20.4,53.3,0,73.6c-20.4,20.4-53.3,20.4-73.6,0l-224-224l-224.6,224c-20.4,20.4-53.3,20.4-73.6,0c-20.4-20.4-20.4-53.3,0-73.6l224-224L420.4,303.2c-20.5-20.4-20.5-53.3-0.1-73.6s53.3-20.4,73.6,0l224.6,224V453.8z"/>
                    </svg>
                </div>
            </div>
        </div>
        <form @submit="validate" id="attrForm">
            <div class="attrBox">
                <div v-for="(content, key) in selectedElement" class="attrRow" :key="key" :class="{ customRow: isCustomAttr(content) }">
                    <div class="col-3 key">
                        <p class="fullName">
                            {{ content.fullName }}
                            <span class="tooltips">{{ content.description }}</span>
                        </p>
                    </div>
                    <div class="col-9 values">
                        <select :name="key" v-if="content.type == 'Select'" v-model="content.value" @keydown.enter.prevent="" @input="isModified=true" class="selectAttr">
                            <option v-for="option2,key2 in content.options" :key="key2" :value="key2">{{ option2 }}</option>
                        </select>
                        <select :name="key" v-if="content.type == 'Boolean'" v-model="content.value" class="selectAttr" @input="isModified=true">
                            <option :value="true">true</option>
                            <option :value="false">false</option>
                        </select>
                        <div v-if="content.type=='Array'" class="arrayInput">
                            <ArrayInput
                            :content="content"
                            @input="(value) => {
                                if(value.length > 0) isModified = true;
                                content.value=value;
                                }"
                            >
                            </ArrayInput>
                        </div>
                        <div v-if="content.type=='Checkbox'" class="CheckboxInput">
                            <div v-for="option, optkey in content.options" class="Checkbox" :key="optkey">
                                <input type="checkbox" v-model="content.value" :key="optkey" :value="optkey" @input="isModified=true">
                                <span>
                                    {{ option }}
                                </span>
                            </div>
                        </div>
                        <div v-if="content.type=='ACR'" class="">
                            <div class="btn" @click.stop @click="modalData.data=content; modalData.type='ACR'; modalData.status=true; ">
                                <p>set ACR</p>
                            </div>
                        </div>
                        <input v-if="content.type == 'text' || content.type == 'Number'"
                        :name="key"
                        :type="content.type"
                        :placeholder="content.placeholder"
                        :disabled="content.disable"
                        v-model="content.value"
                        :required="content.required"
                        autocomplete="off"
                        @input="isModified=true"
                        @keydown.enter.prevent=""
                        />
                    </div>
                    <div v-if="isCustomAttr(content)" class="removeCustomBtn" @click="removeCustomAttr(key)" title="Remove">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </div>
                </div>
                <!-- FCNT/FCIN: 커스텀 속성 구분선 -->
                <div v-if="(element.ty === 28 || element.ty === 58) && hasCustomAttrs" class="customSectionLabel" key="__customLabel__">
                    <span>Custom Attributes (SDT)</span>
                </div>
                <!-- FCNT/FCIN: 커스텀 속성 추가 (속성 리스트 안) -->
                <div v-if="element.ty === 28 || element.ty === 58" class="attrRow addRow" key="__addCustom__">
                    <div class="addRowInner">
                        <input type="text" v-model="newCustomKey" placeholder="Attribute name" class="addInput addInputName" @keydown.enter.prevent="addCustomAttr" />
                        <input type="text" v-model="newCustomValue" placeholder="Value" class="addInput addInputValue" @keydown.enter.prevent="addCustomAttr" />
                        <button type="button" class="addCustomBtn" @click="addCustomAttr" title="Add Attribute">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            </div>
        </form>
        <div class="buttonBox">
            <div class="btn" @click="validate">
                <p>save</p>
            </div>
        </div>
    </div>
</template>

<script>
import loadFromRemote from "@/components/loadFromRemote.vue";
import setAcr from "./setAcr.vue";
import ArrayInput from "./ArrayInput.vue";
import { resourceAttributes, resourceType as RT, tinyIoTPresets } from "@/components/attributes.js";
import { cloneDeep } from 'lodash';

export default {
    name: "setAttrs",
    emits: ["close", "save", "modified", "update-rn", "zoom-view"],
    components: {
        loadFromRemote,
        setAcr,
        ArrayInput
    },
    props: {
        element: {
            type: Object,
            required: true,
        },
        csePreset: {
            type: String,
            default: 'none',
        },
    },
    data() {
        return {
            selectedElement:  {},
            isModified: false,
            newCustomKey: '',
            newCustomValue: '',
            modalData: {
                status: false,
                type: '',
                data: {}
            },
            setoriginator: {
                setoriginator: {
                    type: "text",
                    placeholer: 'Should Start with C or S',
                    required: false,
                    disable: false,
                    value: '',
                    validation: function(value) {
                        if (value[0] === 'C' || value[0] === 'S') {
                            return true;
                        }
                        return false;
                    }
                }
            }
        }    
    },
    beforeMount() {
        window.addEventListener('beforeunload', () => { this.$emit('close', null); });
    },
    mounted() {
        this.selectedElement = cloneDeep(resourceAttributes[this.element.ty]);
        Object.entries(this.element.attrs).forEach(([key, value]) => {
            if(this.selectedElement[key]) {
                this.selectedElement[key].value = value;
            }
        });

        // TinyIoT 프리셋 적용: attrs가 비어있는 새 리소스에만 적용
        const hasUserAttrs = Object.keys(this.element.attrs).some(k => k !== 'ty');
        if (!hasUserAttrs && this.csePreset === 'tinyiot') {
            const preset = tinyIoTPresets[this.element.ty];
            if (preset) {
                Object.entries(preset).forEach(([key, val]) => {
                    if (this.selectedElement[key]) {
                        this.selectedElement[key].value = cloneDeep(val);
                    } else {
                        // 스키마에 없는 커스텀 속성 (SDT 등) 동적 추가
                        this.selectedElement[key] = {
                            type: Array.isArray(val) ? "Array"
                                : typeof val === 'number' ? "Number"
                                : typeof val === 'boolean' ? "Boolean"
                                : "text",
                            fullName: key + " (custom)",
                            description: "SDT custom attribute",
                            required: false,
                            disable: false,
                            value: cloneDeep(val)
                        };
                    }
                });
            }
        }

        // FCNT/FCIN의 경우 SDT 커스텀 속성을 동적으로 추가 (스키마에 없는 속성)
        if (this.element.ty === 28 || this.element.ty === 58) {
            Object.entries(this.element.attrs).forEach(([key, value]) => {
                if (!this.selectedElement[key]) {
                    // custom_attrs가 객체면 펼쳐서 개별 속성으로 추가
                    if (key === 'custom_attrs' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        Object.entries(value).forEach(([cKey, cVal]) => {
                            if (!this.selectedElement[cKey]) {
                                this.selectedElement[cKey] = {
                                    type: Array.isArray(cVal) ? "Array"
                                        : typeof cVal === 'number' ? "Number"
                                        : typeof cVal === 'boolean' ? "Boolean"
                                        : "text",
                                    fullName: cKey + " (custom)",
                                    description: "SDT custom attribute",
                                    required: false,
                                    disable: false,
                                    value: cVal
                                };
                            }
                        });
                    } else {
                        this.selectedElement[key] = {
                            type: Array.isArray(value) ? "Array"
                                : typeof value === 'number' ? "Number"
                                : typeof value === 'boolean' ? "Boolean"
                                : "text",
                            fullName: key,
                            description: "Custom attribute",
                            required: false,
                            disable: false,
                            value: value
                        };
                    }
                }
            });
        }

        const storedOriginator = localStorage.getItem('originator');
        if (storedOriginator) {
            this.setoriginator.setoriginator.value = storedOriginator;
        }
    },
    computed: {
        hasCustomAttrs() {
            return Object.values(this.selectedElement).some(c => this.isCustomAttr(c));
        }
    },
    methods: {
        validate(evt) {
            evt.preventDefault();
            for (const [key, value] of Object.entries(this.selectedElement)) {
                if(value.required && value.value === "") {
                    alert(key + " is required");
                    return;
                }

                if(value.validation) {
                    if(value.type === "Array" && value.value.length === 0) continue;
                    if(value.type === "text" && value.value === "") continue;

                    if(!value.validation(value.value)) {
                        alert(key + " is not valid");
                        return;
                    }
                }
            }
            this.$emit('save', this.selectedElement, () => { this.isModified = false; });
            this.isModified = false;

            if(this.selectedElement.rn && this.selectedElement.rn.value) {
                this.$emit('update-rn', { id: this.element.id, rn: this.selectedElement.rn.value });
            }
            this.$emit('close');
        },
        confirmClose() {
            if(this.isModified) {
                if(confirm("Are you sure to leave without saving?\nAll the changes will be lost.")) {
                    this.$emit('close', null);
                }
            } else {
                this.$emit('close', null);
            }
        },
        addCustomAttr() {
            const key = this.newCustomKey.trim();
            const val = this.newCustomValue.trim();
            if (!key) {
                alert('Attribute name을 입력하세요.');
                return;
            }
            if (this.selectedElement[key]) {
                alert(`'${key}' 속성이 이미 존재합니다.`);
                return;
            }
            // 숫자면 Number로 변환
            let parsedVal = val;
            let fieldType = 'text';
            if (val === 'true' || val === 'false') {
                parsedVal = val === 'true';
                fieldType = 'Boolean';
            } else if (val !== '' && !isNaN(Number(val))) {
                parsedVal = Number(val);
                fieldType = 'Number';
            }
            // Vue 3 반응성 보장: 새 객체로 교체하여 v-for 재렌더링
            this.selectedElement = Object.assign({}, this.selectedElement, {
                [key]: {
                    type: fieldType,
                    fullName: key + ' (custom)',
                    description: 'SDT custom attribute',
                    required: false,
                    disable: false,
                    value: parsedVal
                }
            });
            this.isModified = true;
            this.newCustomKey = '';
            this.newCustomValue = '';
        },
        isCustomAttr(content) {
            return content.description === 'SDT custom attribute' || content.description === 'Custom attribute';
        },
        removeCustomAttr(key) {
            const copy = Object.assign({}, this.selectedElement);
            delete copy[key];
            this.selectedElement = copy;
            this.isModified = true;
        },
        submitOriginator() {
            if (this.setoriginator.setoriginator.validation(this.setoriginator.setoriginator.value)) {
                localStorage.setItem('originator', this.setoriginator.setoriginator.value);
                alert("Originator submitted");
            } else {
                alert("Originator must start with C or S.");
            }
            this.$emit('save', this.setoriginator.setoriginator.value, () => { this.isModified = false; });
            this.isModified = false;
        },
    }
};
</script>
<style scoped>
.attrSetUi {
    overflow-y: auto;
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
  width: 100%;
  height: 100%;
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
  min-height: 300px;
}

.titleBox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: #333 1px solid;
}

.titleBox p {
    font-size: 25px;
    font-weight: bold;
    margin: 0;
    padding: 0;
}

.attrBox {
    overflow-y: auto;
    max-height: 500px;
    display: flex;
    flex-direction: column;
}

.attrBox .attrRow {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 0px;
    padding: 5px;
    border-bottom: #333 1px solid;
}

.selectAttr {
    width: 100%;
    text-align: left;
}

.key {
    text-align: center;
    font-weight: bold;
}

.fullName {
    position: relative;
}

.fullName .tooltips {
    visibility: hidden;
    position: absolute;
    background-color: #333;
    color: #fff;
    top: 100%;
    left: 50%;
    margin-left: -60px;
    z-index: 1;
    border-radius: 4px;
    padding-left: 5px;
    padding-right: 5px;
    padding-top: 2px;
    padding-bottom: 2px;
}

.fullName:hover .tooltips{
    visibility: visible;
}

.values {
    text-align: center;
    overflow: auto;
}

.values input {
    width: 100%;
    padding: 0%;
    margin: 0%;
}

.arrayInput {
    box-sizing: border-box;
}

.closeBtn {
    cursor: pointer;
    padding: 5px;
}

.buttonBox {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
    width: auto;
}

.CheckboxInput {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
}

.CheckboxInput .Checkbox {
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: center;
    align-items: center;
    gap: 5px;
}

.delBtn {
    background-color: orangered;
    color: white;
    padding: 10px;
    border-radius: 5px;
    cursor: pointer;  
}

.btn {
    background-color: #333; 
    color: white;
    border-radius: 5px;
    cursor: pointer;  
}

.btn p {
    padding: 0;
    margin: 0;
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

/* --- Custom Attribute Rows --- */
.customRow {
    background: linear-gradient(90deg, #eef4ff 0%, #f8faff 100%);
    border-left: 3px solid #667eea;
    padding-left: 8px !important;
}

.removeCustomBtn {
    cursor: pointer;
    color: #bbb;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
}

.removeCustomBtn:hover {
    color: #fff;
    background-color: #e74c3c;
}

/* --- Custom Section Label --- */
.customSectionLabel {
    padding: 6px 12px;
    background: linear-gradient(90deg, #667eea20, transparent);
    border-top: 1px solid #dde4f0;
    border-bottom: 1px solid #dde4f0;
}

.customSectionLabel span {
    font-size: 11px;
    font-weight: 600;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* --- Add Row --- */
.addRow {
    border-top: none !important;
    border-bottom: none !important;
    padding: 8px 5px !important;
    background: #f8f9fb;
}

.addRowInner {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.addInput {
    padding: 7px 12px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.addInput:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
}

.addInputName {
    flex: 1;
}

.addInputValue {
    flex: 1.5;
}

.addCustomBtn {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.addCustomBtn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.addCustomBtn:active {
    transform: translateY(0);
}
</style>
