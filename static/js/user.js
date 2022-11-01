const cardId = document.getElementById('cardId')
const cardBalance = document.getElementById('cardBalance')
const recieverCardId = document.getElementById('recieverCardId')
const moneyAmount = document.getElementById('moneyAmount')
const cardPin = document.getElementById('cardPin')
const sendButton = document.getElementById('sendButton')
const errorText = document.getElementById('errorText')
const successText = document.getElementById('successText')

function updateBalanceLoop() {
setTimeout(updateBalance, 5000)
}

function updateBalance() {
xhr = new XMLHttpRequest()
xhr.open("GET", "/balance/" + userName)
xhr.setRequestHeader("Content-Type", "text/plain; charset=UTF-8")
xhr.send()
xhr.onload = function() {
  let res = JSON.parse(xhr.response)
  cardBalance.innerText = res.Text
}
updateBalanceLoop()
}

function clearError(){
    errorText.innerText=""
}

function clearSuccess(){
    successText.innerText=""
}

function send(){
xhr = new XMLHttpRequest()
xhr.open("POST", "/user/" + userName)
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
xhr.send(JSON.stringify({ "ToName": recieverCardId.value, "Amount": moneyAmount.value, "Password": cardPin.value }))
xhr.onload = function() {
  let res = JSON.parse(xhr.response)
  if (res.Text !== "OK") {
    errorText.innerText=res.Text
    successText.innerText=""
    setTimeout(clearError, 5000)
  } else {
    errorText.innerText=""
    successText.innerText="Средства отправлены"
    setTimeout(clearSuccess, 5000)
    cardBalance.innerText=parseInt(cardBalance.innerText)-parseInt(moneyAmount.value)
  }
  cardPin.value=""
}
}

function setProperty(e, k, v){
  if (v) {
    e.style[k] = v + 'px';
  }
}

function changeClass(classname){
  elements = document.getElementsByClassName(classname);
  for (var i = 0; i < elements.length; i++) {
    setProperty(elements[i], 'fontSize', elements[i].fontSize);
    setProperty(elements[i], 'width', elements[i].width);
    setProperty(elements[i], 'height', elements[i].height);
    setProperty(elements[i], 'paddingLeft', elements[i].paddingLeft);
    setProperty(elements[i], 'paddingRight', elements[i].paddingRight);
    setProperty(elements[i], 'paddingTop', elements[i].paddingTop);
    setProperty(elements[i], 'paddingBottom', elements[i].paddingBottom);
    setProperty(elements[i], 'marginLeft', elements[i].marginLeft);
    setProperty(elements[i], 'marginRight', elements[i].marginRight);
    setProperty(elements[i], 'marginTop', elements[i].marginTop);
    setProperty(elements[i], 'marginBottom', elements[i].marginBottom);
  }
}

function changeClass2(classname, key, value){
  elements = document.getElementsByClassName(classname);
  for (var i = 0; i < elements.length; i++) {
    elements[i].style[key] = value;
  }
}

function updateAll(event) {
if (window.visualViewport.height > window.visualViewport.width) {
  changeClass2('background', 'height', window.visualViewport.height);
  changeClass2('stretch', 'height', window.visualViewport.height);
} else {
  changeClass2('stretch', 'height', document.getElementsByClassName('stretch')[0].width*1.5);
  changeClass2('background', 'height', document.getElementsByClassName('background')[0].height);
}
changeClass('title');
changeClass('butt');
changeClass('in');
changeClass('inp');
changeClass('label');
changeClass('holder');
changeClass('error');
changeClass('success');
changeClass2('in', 'paddingTop', vh);
changeClass2('butt', 'marginTop', 1.5*vh);
}

h = window.location.href.split('/')
h = h[h.length-1]
userName = CryptoJS.enc.Utf16.stringify(CryptoJS.enc.Hex.parse(h))
cardId.innerText = userName
updateBalance()
vw = window.visualViewport.width * 0.01;
vh = window.visualViewport.height * 0.01;
updateAll(0)
sendButton.addEventListener('click', send)