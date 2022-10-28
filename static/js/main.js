const cardId = document.getElementById('cardId')
const cardPin = document.getElementById('cardPin')
const enterButton = document.getElementById('enterButton')
const errorText = document.getElementById('errorText')

function enter(){
xhr = new XMLHttpRequest()
xhr.open("POST", "/")
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
xhr.send(JSON.stringify({ "Name": cardId.value, "Password": cardPin.value }))
xhr.onload = function() {
  let res = JSON.parse(xhr.response)
  if (res.Text === "OK") {
     window.location.href=window.location.href+'/user/'+cardId.value
  } else {
    errorText.innerText=res.Text
  }
}
}

function changeClass(classname, key, value){
  elements = document.getElementsByClassName(classname);
  for (var i = 0; i < elements.length; i++) {
    elements[i].style[key] = value;
  }
}

function updateAll(event) {
changeClass('title', 'fontSize', 5*vw);
changeClass('butt', 'fontSize', 3*vw);
changeClass('butt', 'marginTop', 2*vh);
changeClass('in', 'paddingTop', vh);
changeClass('inp', 'fontSize', 3*vw);
changeClass('label', 'fontSize', 3*vw);
changeClass('holder', 'width', 70*vw);
changeClass('holder', 'height', document.getElementsByClassName('holder')[0].height + 'px');
changeClass('holder', 'marginTop', document.getElementsByClassName('holder')[0].marginTop + 'px');
changeClass('holder', 'paddingLeft', document.getElementsByClassName('holder')[0].paddingLeft + 'px');
changeClass('holder', 'paddingRight', document.getElementsByClassName('holder')[0].paddingRight + 'px');
changeClass('holder', 'paddingTop', document.getElementsByClassName('holder')[0].paddingTop + 'px');
changeClass('holder', 'paddingBottom', document.getElementsByClassName('holder')[0].paddingBottom + 'px');
changeClass('error', 'marginTop', vh);
changeClass('error', 'fontSize', 3*vw);
changeClass('stretch', 'height', Math.max(document.getElementsByClassName('stretch')[0].height, document.getElementsByClassName('stretch')[0].width*1.5));
changeClass('background', 'height', document.getElementsByClassName('background')[0].height);
}

vw = window.visualViewport.width * 0.01;
vh = window.visualViewport.height * 0.01;
updateAll(0);
enterButton.addEventListener('click', enter);