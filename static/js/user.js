const cardId = document.getElementById('cardId')
const cardBalance = document.getElementById('cardBalance')
const recieverCardId = document.getElementById('recieverCardId')
const moneyAmount = document.getElementById('moneyAmount')
const cardPin = document.getElementById('cardPin')
const sendButton = document.getElementById('sendButton')
const errorText = document.getElementById('errorText')

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

function send(){
xhr = new XMLHttpRequest()
xhr.open("POST", "/user/" + userName)
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
xhr.send(JSON.stringify({ "ToName": recieverCardId.value, "Amount": moneyAmount.value, "Password": cardPin.value }))
xhr.onload = function() {
  let res = JSON.parse(xhr.response)
  if (res.Text !== "OK") {
    errorText.innerText=res.Text
  } else {
    errorText.innerText=""
    cardBalance.innerText=parseInt(cardBalance.innerText)-parseInt(moneyAmount.value)
  }
  cardPin.value=""
}
}

h = window.location.href.split('/')
userName = h[h.length-1]
cardId.innerText = userName
updateBalance()
sendButton.addEventListener('click', send)