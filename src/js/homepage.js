/**
 * homepage.js
 */

const btn_go_index = document.getElementById('btn_go_index');
btn_go_index.addEventListener('click', () => {
    window.location.href = 'index.html';
})

// settings button
const btn_settings = document.getElementById('btnSettings');
btn_settings.addEventListener('click', () => {
    window.location.href = 'settings.html';
})

// auto record checkbox
const cb_auto_record = document.getElementById('bordered-checkbox-1');
let autoEnable = localStorage.getItem("auto")
cb_auto_record.checked = autoEnable === 'true';

cb_auto_record.addEventListener('change', () => {
    localStorage.setItem("auto", String(cb_auto_record.checked))
})
