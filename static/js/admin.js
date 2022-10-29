const table = document.getElementById('mainTable')
const table2 = document.getElementById('secondTable')
const myName = document.getElementById('myName')
const updateButton = document.getElementById('updateButton')
const downloadButton = document.getElementById('downloadButton')
let href = document.location.href.split('/')
href = "/" + href[href.length-1]

function handleChangeBalance(element) {
  var cardId = element.path[2].children[0].innerText
  var balanceChange = Number(element.path[2].children[2].children[0].value)
  xhr = new XMLHttpRequest()
  xhr.open("POST", href + "/changeBalance")
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xhr.send(JSON.stringify({ "CardId": cardId, "BalanceChange": balanceChange, "FromName": myName.value }))
  xhr.onload = function() {
    updateUsers()
  }
}

function handleSetPassword(element) {
  var cardId = element.path[2].children[0].innerText
  var cardPassword = element.path[2].children[4].children[0].value
  xhr = new XMLHttpRequest()
  xhr.open("POST", href + "/setPassword")
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xhr.send(JSON.stringify({ "CardId": cardId, "NewPassword": cardPassword }))
  xhr.onload = function() {
    updateUsers()
  }
}

function handleDeleteCard(element) {
  var cardId = element.path[2].children[0].innerText
  result = confirm("Вы уверены, что хотите удалить пользователя с ником " + cardId + "?");
  if (result) {
  xhr = new XMLHttpRequest()
  xhr.open("POST", href + "/deleteCard")
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xhr.send(JSON.stringify({ "CardId": cardId }))
  xhr.onload = function() {
    updateUsers()
  }
  }
}

function deleteAllRows() {
  var rowCount = table.rows.length;
  for (var i = 1; i < rowCount; i++) {
    table.deleteRow(1);
  }
}

function addRow(cardIdText, cardBalanceText, cardPIN) {
  var row = table.insertRow()
  var cardId = row.insertCell()
  cardId.innerText = cardIdText
  var cardBalance = row.insertCell()
  cardBalance.innerText = cardBalanceText

  var changeBalanceInputCell = row.insertCell()
  var changeBalanceInput = document.createElement("input")
  changeBalanceInput.type = 'text'
  changeBalanceInputCell.appendChild(changeBalanceInput)
  var changeBalanceButtonCell = row.insertCell()
  var changeBalanceButton = document.createElement("button")
  changeBalanceButton.innerText = 'Изменить'
  changeBalanceButton.className = 'butt'
  changeBalanceButton.addEventListener('click', handleChangeBalance.bind(changeBalanceButton))
  changeBalanceButtonCell.appendChild(changeBalanceButton)

  var setPasswordInputCell = row.insertCell()
  var setPasswordInput = document.createElement("input")
  setPasswordInput.type = 'text'
  setPasswordInput.value = cardPIN
  setPasswordInputCell.appendChild(setPasswordInput)
  var setPasswordButtonCell = row.insertCell()
  var setPasswordButton = document.createElement("button")
  setPasswordButton.innerText = 'Сменить'
  setPasswordButton.className = 'butt'
  setPasswordButton.addEventListener('click', handleSetPassword.bind(setPasswordButton))
  setPasswordButtonCell.appendChild(setPasswordButton)

  var deleteCardButtonCell = row.insertCell()
  var deleteCardButton = document.createElement("button")
  deleteCardButton.innerText = 'Удалить'
  deleteCardButton.className = 'butt'
  deleteCardButton.addEventListener('click', handleDeleteCard.bind(deleteCardButton))
  deleteCardButtonCell.appendChild(deleteCardButton)
}


function deleteAllRows2() {
  var rowCount = table2.rows.length;
  for (var i = 1; i < rowCount; i++) {
    table2.deleteRow(1);
  }
}

function convertDate(date) {
  return date.split('T')[1].split('.')[0]
}

function addRow2(transaction) {
  var row = table2.insertRow()
  var fromName = row.insertCell()
  fromName.innerText = transaction.FromName
  var toName = row.insertCell()
  toName.innerText = transaction.ToName
  var amount = row.insertCell()
  amount.innerText = transaction.Amount
  var date = row.insertCell()
  date.innerText = convertDate(transaction.Date)
}

function updateUsers() {
xhr = new XMLHttpRequest()
xhr.open("GET", href + "/getUsers")
xhr.onload = function() {
  let res = JSON.parse(xhr.response)
  deleteAllRows()
  for (var i = 0; i < res.length; i++) {
    addRow(res[i].Name, res[i].Balance, res[i].Password)
  }
}
xhr.send(null)
}

function updateTransactions() {
xhr2 = new XMLHttpRequest()
xhr2.open("POST", href + "/getTransactions")
xhr2.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
xhr2.onload = function() {
  let res2 = JSON.parse(xhr2.response)
  deleteAllRows2()
  for (var i = 0; i < res2.length; i++) {
    addRow2(res2[i])
  }
  setTimeout(updateTransactions, 5000)
}
xhr2.send(JSON.stringify({ "Name": myName.value }))
}

function download() {
xhr3 = new XMLHttpRequest()
xhr3.open("POST", href + "/getTransactions")
xhr3.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
xhr3.onload = function() {
  let blob = new Blob([xhr3.response], {type: "application/json;charset=UTF-8"});
  let link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", "transactions.json");
  link.click();
}
xhr3.send(JSON.stringify({ "Name": myName.value }))
}

updateUsers()
updateTransactions()
updateButton.addEventListener('click', updateUsers)
downloadButton.addEventListener('click', download)