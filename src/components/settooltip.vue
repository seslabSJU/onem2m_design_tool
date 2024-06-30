<template>
    <div class="tooltip">
      <span>{{ text }}</span>
      <div class="tooltip-content" v-if="show">
        <p>{{ content }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      text: String,
      content: String
    },
    data() {
      return {
        show: false
      };
    },
    methods: {
      toggleShow() {
        this.show = !this.show;
      }
    }
  };
  </script>
  
  <style scoped>
  .tooltip {
    position: relative;
    display: inline-block;
    margin: auto;
  }

  .tooltip .tooltip-content {
    visibility: hidden;
    width: 220px;
    background-color: rgba(128, 128, 128, 0.5); /* 반투명한 회색 */
    padding: 0;
    color: white;
    text-align: center;
    position: absolute;
    z-index: 1;
    bottom: 100%;
    left: 50%;
    margin-left: -110px;
  }
  
  .tooltip:hover .tooltip-content {
    visibility: visible;
  }
  </style>
  