'use strict';

let file = '';
let linkUrl = '';
const req = new XMLHttpRequest();

const reqOnload = () => {
  if (req.status === 200 || req.status === 201) {
    const data = chatbotParser(req.responseText);
    createAgentText(data, 'non-welcome');
  } else {
    console.error(req.responseText);
  }
};

const sendData = (msg) => {
  req.onload = reqOnload;
  req.open('POST','https://t-aichatbot.catholic.kr:10443/hyperchatbot-engine/deploy/6/dialog');
  //req.open('POST','https://hsmst.cnu.ac.kr/hyperchatbot-engine/deploy/10019/dialog');
  req.setRequestHeader('Content-Type', 'application/json');
  req.send(msg);
};

const selectEvent = (item) => {
  const selectData = item.currentTarget;
  console.log(selectData);
  let userText = selectData.options[selectData.selectedIndex].text;
  console.log(userText);
  let userIntentId = selectData.options[selectData.selectedIndex].value;
  let msg = `{"intentId":"${userIntentId}","userId":0}`;
  sendData(msg);
  createClientText(userText, 200);
};

const buttonEvent = (item) => {
  const itemParse = item.currentTarget;
  const btnText = itemParse.innerText;
  const btnIntentId = itemParse.querySelector('#itid').value;
  const btnLinkUrl = itemParse.querySelector('#url').value;
  const btnFileUrl = itemParse.querySelector('#file').value;

  if (btnLinkUrl.length !== 0) {
    if (btnLinkUrl.includes('http' || 'https')) {
      window.open(btnLinkUrl);
    } else {
      window.open(`https://${btnLinkUrl}`);
    }
  } else if (btnFileUrl.length !== 0) {
    window.open(btnFileUrl);
  } else if (btnIntentId.length !== 0) {
    const msg = `{"intentId":"${btnIntentId}","userId":0}`;
    sendData(msg);
    createClientText(btnText, 200);
  }
};

const createBtnOrSelectBox = (btnCount, chatbotResult) => {
  const dateString = getCurrentTime();
  let agentInnerSet = '';
  let agentInnerImage = '';
  let agentInnerButton = '';
  let agentInnerSelect =
    '<select id="selectBox" onchange="selectEvent(event)"><option value="basic" disabled selected>원하는 유형을 선택하세요</option>';
  for (let i = 0; i < chatbotResult.length; i++) {
    let type = chatbotResult[i]['type'];
    let msg = chatbotResult[i]['value'];
    let url = chatbotResult[i]['url'];
    let imageURL = '';
    if (url !== undefined)
      imageURL = url.replace('http://engine:18088', 'https://aichatbot.catholic.kr');
    if (type === 0) {
      if (msg === '정의할 수 없는 에러') {
        agentInnerSet += `<pre class="agent-message">아이코 제게는 아직 그런 내용을 해석할 준비가 되지 않았어요 😥</pre>`;
      } else {
        agentInnerSet += `<pre class="agent-message">${msg}</pre>`;
      }
    } else if (type === 1) {
      agentInnerImage += `${imageURL}`;
    } else if (type === 2) {
      let type = '';
      let text = '';
      let intentId = '';
      let button_elements = chatbotResult[i]['buttonElements'];
      for (let j = 0; j < button_elements.length; j++) {
        let btnType = button_elements[j]['type'];
        if (btnType === 0) {
          text = button_elements[j]['value'];
        } else if (btnType === 3) {
          intentId = button_elements[j]['intentId'];
        } else if (btnType === 4) {
          type = btnType;
          linkUrl = button_elements[j]['url'];
        } else if (btnType === 5) {
          type = btnType;
          file = button_elements[j]['url'];
        }
      }
      if (btnCount < 7) {
        agentInnerButton += `
          <button class="agent-button"><span>${text}</span>
            <input type="hidden" name="type" value="${type}">
            <input type="hidden" id="url" name="url" value="${linkUrl}">
            <input type="hidden" id="itid" name="itid" value="${intentId}">
            <input type="hidden" id="file" name="file" value="${file.replace('http://engine:18088','https://aichatbot.catholic.kr')}">
          </button>`;
        file = '';
        linkUrl = '';
      } else if (btnCount > 6) {
        if (file.length || linkUrl.length !== 0) {
          agentInnerButton += `
            <button class="agent-button"><span>${text}</span>
              <input type="hidden" name="type" value="${type}">
              <input type="hidden" id="url" name="url" value="${linkUrl}">
              <input type="hidden" id="itid" name="itid" value="${intentId}">
              <input type="hidden" id="file" name="file" value="${file.replace('http://engine:18088','https://aichatbot.catholic.kr')}">
            </button>`;
          file = '';
          linkUrl = '';
        } else {
          agentInnerSelect += `<option value="${intentId}">${text}</option>`;
        }
      }
    }
  }

  let agentChatFrame = `
  <article id="agent-wrapper">
      <img src="resources/img/profile.png" alt="프로필 사진" class="agent-profile" onclick="location.reload();">
      <section id="agent-frame">
        <span class="agent-name">CATHOLIC</span>
        <p class="current-date">${dateString}</p>`;

  if (agentInnerImage.length !== 0) {
    agentChatFrame += `<section id="message-area"><img class="agent-img" alt ="받은 이미지" src="${agentInnerImage}"/>${agentInnerSet}`;
  } else {
    agentChatFrame += `<section id="message-area">${agentInnerSet}`;
  }

  if ((agentInnerButton.length || agentInnerSelect.length) !== 0) {
    if (btnCount < 7 && btnCount > 0) {
      agentChatFrame += `
                    <section class="agent-button-wrapper">${agentInnerButton}</section>
                </section>
            </article>`;
    } else if (btnCount > 6) {
      agentChatFrame += `
                    <section class="agent-button-wrapper">${agentInnerButton}${agentInnerSelect}</section>
                </section>
            </article>`;
    }
  } else {
    agentChatFrame += `</section></article>`;
  }

  const chatFrame = document.getElementById('main');
  chatFrame.insertAdjacentHTML('beforeend', agentChatFrame);

  chatFrame.scrollTop = chatFrame.scrollHeight;

  const curIdx = document.getElementsByClassName('agent-button-wrapper').length - 1;
  const curEv = document.getElementsByClassName('agent-button-wrapper')[curIdx].getElementsByClassName('agent-button');

  for (let item of curEv) {
    item.addEventListener('click', buttonEvent);
  }
};

const createAgentText = (chatbotResult, btn) => {
  if (btn === 'non-welcome') {
    let btnCount = 0;
    for (let i = 0; i < chatbotResult.length; i++) {
      let type = chatbotResult[i]['type'];
      if (type === 2) ++btnCount;
    }
    createBtnOrSelectBox(btnCount, chatbotResult);
  } else if (btn === 'welcome') {
    createBtnOrSelectBox(0, chatbotResult);
  }
};

function chatbotParser(data) {
  const totalData = JSON.parse(data);
  return JSON.parse(totalData.replyMessage);
}

const requestChatbot = (message) => {
  if (message === 'welcome') {
    message = '';
    const msg = `{\"userId\":\"0\",\"userMessage\":\"${message}\"}`;
    sendData(msg);
  } else {
    message = message.replace(/\w+\s/g, '');
    const msg = `{\"userId\":\"0\",\"userMessage\":\"${message}\"}`;
    sendData(msg);
  }
};

const getCurrentTime = () => {
  const date = new Date();
  const calcHour = date.getHours();
  let calcMinutes = date.getMinutes();
  if (calcMinutes < 10) calcMinutes = '0' + calcMinutes;
  const ampm = calcHour > 11 ? '오후' : '오전';
  const hours = calcHour > 12 ? calcHour - 12 : calcHour;
  return `${ampm} ${hours}:${calcMinutes}`;
};

const getCurrentTimeString = () => {
  const date = new Date();
  const thisYear = date.getFullYear();
  const thisMonth = date.getMonth() + 1;
  const today = date.getDate();
  document.querySelector(
    '.date-info'
  ).textContent = `${thisYear}년 ${thisMonth}월 ${today}일`;
};

const createClientText = (clientText, status) => {
  const clientChatFrame = `<article id="client-wrapper">
            <p class="client-date">${getCurrentTime()}</p>
            <section class="client-message"><pre>${clientText}</pre></section>
        </article>`;
  const chatBody = document.getElementById('main');
  chatBody.insertAdjacentHTML('beforeend', clientChatFrame);
  chatBody.scrollTop = chatBody.scrollHeight;
  if (status !== 200) {
    requestChatbot(clientText);
  }
};

const textCheck = () => {
  if (document.getElementsByClassName('input-text')[0].value.trim() === '') {
    document.getElementsByClassName('input-text')[0].value = '';
  } else {
    createClientText(document.getElementsByClassName('input-text')[0].value);
    document.getElementsByClassName('input-text')[0].value = '';
  }
};

const submitTextEvent = (e) => {
  if (e === 'click') textCheck();
  else if (e.keyCode === 13) {
    e.preventDefault();
    textCheck();
  }
};

window.onload = getCurrentTimeString;