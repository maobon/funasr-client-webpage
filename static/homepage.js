/**
 * homepage.js
 */

// start button
const btn_start_record = document.getElementById('btn_start_record');
btn_start_record.addEventListener('click', () => {
    window.location.href = 'index.html';
})

// auto record checkbox
const cb_auto_record = document.getElementById('bordered-checkbox-1');
let autoEnable = localStorage.getItem("auto")
cb_auto_record.checked = autoEnable === 'true';

cb_auto_record.addEventListener('change', () => {
    localStorage.setItem("auto", String(cb_auto_record.checked))
})
