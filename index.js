import Vue from 'vue';
import $ from 'jquery';
// import Vuex from 'vuex';

// Vue.use(Vuex);
new Vue({
  el: '#app',
  data: {
    vue_test: 'vue is loaded!'
  }
});

$(function() {
  $('.jq').html('jquery is loaded!');
});