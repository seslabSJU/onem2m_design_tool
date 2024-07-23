<!-- Load from Remote server  원격 CSE에서 로드 -->
<!-- 
    show modal that sets protocol for request,
    and sets the url to request
    makes request and emits result to parent
-->

<!-- 여기 코드 아예 안쓰이고 있는 듯 하다...-->

<template>
    <div class="modal" tabindex="-1" id="remoteLoadModal" role="dialog" v-if="showModal">
        <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">x
            <h5 class="modal-title">Load from Remote Server</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            </div>
            <div class="modal-body">
            <label for="protocol">Protocol</label>
            <select name="protocol" id="protocol" v-model="protocol">
                <option value="http">http</option>
                <option value="https">https</option>
            </select>
            <label for="url">URL</label>
            <input type="text" name="url" id="url" v-model="url">
            </div>
            <div class="modal-footer">
            <button type="button" class="btn btn-primary" @click="loadFromRemote">Load</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
        </div>
    </div>
</template>


<script>
import axios from 'axios';

export default {
    props: {
        showModal: {
            required: true,
            type: Boolean
        }
    },
    data(){
        return {
            protocol: 'http',
            url: ''
        }
    },
    methods: {
        async loadFromRemote(){
            try {
                const response = await axios.get(`${this.protocol}://${this.url}`);
                // 성공적으로 데이터를 받아왔을 때, 부모 컴포넌트로 데이터를 전달합니다.
                this.$emit('loadFromRemote', response.data);
                console("vue")
            } catch (error) {
                console.error('Error fetching data from remote server:', error);
                // 오류 발생 시 에러 메시지를 출력합니다.
                alert('Error fetching data from remote server. Please check the URL and try again.');
            }
        },

        async loadFromRemote(){
    try {
        // 프로토콜과 URL을 이용하여 요청할 경로를 생성합니다.
        const requestURL = `${this.protocol}://${this.url}`;
        
        // 요청 헤더를 설정합니다.
        const headers = {
            "X-M2M-Origin": "your_originator",
            "X-M2M-RVI" : 3,
            "X-M2M-RI" : 12345,
            "Accept" : "application/json"
        };

        // axios를 사용하여 요청을 보냅니다.
        const response = await axios.get(requestURL, {
            headers: headers
        });

        // 성공적으로 데이터를 받아왔을 때, 부모 컴포넌트로 데이터를 전달합니다.
        this.$emit('loadFromRemote', response.data);
    } catch (error) {
        console.error('원격 서버에서 데이터를 가져오는 중 오류가 발생했습니다:', error);
        // 오류 발생 시 에러 메시지를 출력합니다.
        alert('원격 서버에서 데이터를 가져오는 중 오류가 발생했습니다. URL을 확인해주세요.');
    }
}



    },
    watch:{
        showModal: function(val){
            console.log(val);
            if(val){
                // 모달을 열기 위해 showModal 값이 true로 변경되면 modal 요소를 표시합니다.
                document.getElementById('remoteLoadModal').show();
            } else {
                // 모달을 닫기 위해 showModal 값이 false로 변경되면 modal 요소를 감춥니다.
                document.getElementById('remoteLoadModal').modal('hide');
            }
        }
    }
}

</script>

<style scoped>
</style>

