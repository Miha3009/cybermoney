package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB
var connStr string = "user=postgres password=1 dbname=postgres sslmode=disable"
var adminPage string = "j32JS36NbsdssOkfg8sLbgKcIhTs1tBd6cmsDuXvoiMxndOxtUfFLchJYi3AqDk8"

type User struct {
	Name     string
	Password string
	Balance  int
}

type Transaction struct {
	Id       int
	FromName string
	ToName   string
	Amount   int
	Date     time.Time
}

var validPath = regexp.MustCompile("^/(user|static|balance)/([a-zA-Z0-9а-яА-Я]+)$")

func createUser(user User) string {
	if user.Name == "" {
		return "Пустой логин"
	}
	if validPath.FindStringSubmatch("/user/"+user.Name) == nil {
		return "Некорректный логин"
	}
	if user.Password == "" {
		return "Пустой пароль"
	}
	u := getUser(user.Name)
	if u.Name == user.Name {
		if u.Password == user.Password {
			return "OK"
		} else {
			return "Неверный пароль"
		}
	}
	result, err := db.Exec("insert into Users (name, password, balance) values ($1, $2, $3)",
		user.Name, user.Password, user.Balance)
	if err != nil {
		return "Пользователь с таким именем уже существует"
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected != int64(1) {
		return "Пользователь с таким именем уже существует"
	} else {
		return "OK"
	}
}

func createTransaction(t Transaction, password string) string {
	fromUser := getUser(t.FromName)
	toUser := getUser(t.ToName)
	if fromUser.Name == "" || toUser.Name == "" {
		return "Пользователь не найден"
	}
	if t.FromName == t.ToName {
		return "Нельзя отправить средства себе"
	}
	if fromUser.Password != password {
		return "Неверный пароль"
	}
	if fromUser.Balance < t.Amount {
		return "Недостаточно средств"
	}
	if t.Amount <= 0 {
		return "Некорректная сумма"
	}
	_, err := db.Exec("insert into Transactions (fromName, toName, amount, date) values ($1, $2, $3, $4)",
		t.FromName, t.ToName, t.Amount, time.Now())
	if err != nil {
		return "Не удалось совершить транзакцию"
	}
	db.Exec("update Users set balance = $1 where name = $2", fromUser.Balance-t.Amount, fromUser.Name)
	db.Exec("update Users set balance = $1 where name = $2", toUser.Balance+t.Amount, toUser.Name)

	return "OK"
}

func getUser(name string) User {
	rows, _ := db.Query("select * from Users WHERE name=$1", name)
	defer rows.Close()

	p := User{}
	if rows.Next() {
		rows.Scan(&p.Name, &p.Password, &p.Balance)
	}
	return p
}

func getUsers() []User {
	rows, _ := db.Query("select * from Users")
	defer rows.Close()

	users := make([]User, 0)
	for rows.Next() {
		p := User{}
		rows.Scan(&p.Name, &p.Password, &p.Balance)
		users = append(users, p)
	}
	sort.Slice(users, func(i, j int) bool {
		return users[i].Name < users[j].Name
	})
	return users
}

func getTransactions(name string) []Transaction {
	ts := []Transaction{}

	if name == "" {
		rows, _ := db.Query("select * from Transactions")
		defer rows.Close()
		for rows.Next() {
			t := Transaction{}
			rows.Scan(&t.Id, &t.FromName, &t.ToName, &t.Amount, &t.Date)
			ts = append(ts, t)
		}
	} else {
		rows1, _ := db.Query("select * from Transactions WHERE fromName=$1", name)
		rows2, _ := db.Query("select * from Transactions WHERE toName=$1", name)
		defer rows1.Close()
		defer rows2.Close()
		for rows1.Next() {
			t := Transaction{}
			rows1.Scan(&t.Id, &t.FromName, &t.ToName, &t.Amount, &t.Date)
			ts = append(ts, t)
		}
		for rows2.Next() {
			t := Transaction{}
			rows2.Scan(&t.Id, &t.FromName, &t.ToName, &t.Amount, &t.Date)
			ts = append(ts, t)
		}
	}

	sort.Slice(ts, func(i, j int) bool {
		return ts[i].Date.After(ts[j].Date)
	})
	return ts
}

func setPassword(name, password string) bool {
	user := getUser(name)
	if user.Name == "" || password == "" {
		return false
	}
	db.Exec("update Users set password = $1 where name = $2", password, name)
	return true
}

func changeBalance(fromName string, name string, change int) bool {
	user := getUser(name)
	if user.Name == "" {
		return false
	}
	if user.Balance+change < 0 {
		return false
	}
	_, _ = db.Exec("update Users set balance = $1 where name = $2", user.Balance+change, name)
	db.Exec("insert into Transactions (fromName, toName, amount, date) values ($1, $2, $3, $4)",
		fromName, user.Name, change, time.Now())
	return true
}

func deleteUser(name string) bool {
	result, err := db.Exec("delete from Users where name = $1", name)
	if err != nil {
		fmt.Println(err)
		return false
	}
	rowsAffected, _ := result.RowsAffected()
	return rowsAffected == int64(1)
}

type Message struct {
	Text string
}

type TransactionRequest struct {
	ToName   string
	Amount   string
	Password string
}

func userHandler(w http.ResponseWriter, r *http.Request, title string) {
	if r.Method == "GET" {
		renderTemplate(w, "user")
	} else if r.Method == "POST" {
		var t TransactionRequest
		decoder := json.NewDecoder(r.Body)
		decoder.Decode(&t)
		amount, err := strconv.Atoi(t.Amount)
		var res string
		if err != nil {
			res = "Некорректная сумма"
		} else {
			res = createTransaction(Transaction{FromName: title, ToName: t.ToName, Amount: amount}, t.Password)
		}
		w.Header().Set("Content-Type", "application/json")
		resp, _ := json.Marshal(Message{Text: res})
		w.Write(resp)
	}
}

func balanceHandler(w http.ResponseWriter, r *http.Request, title string) {
	user := getUser(title)
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(Message{Text: strconv.Itoa(user.Balance)})
	w.Write(resp)
}

func mainHandler(w http.ResponseWriter, r *http.Request, title string) {
	if r.Method == "GET" {
		renderTemplate(w, "main")
	} else if r.Method == "POST" {
		var u User
		decoder := json.NewDecoder(r.Body)
		decoder.Decode(&u)
		res := createUser(u)
		w.Header().Set("Content-Type", "application/json")
		resp, _ := json.Marshal(Message{Text: res})
		w.Write(resp)
	}
}

func adminHandler(w http.ResponseWriter, r *http.Request, title string) {
	renderTemplate(w, "admin")
}

func adminHandlerGetUsers(w http.ResponseWriter, r *http.Request, title string) {
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(getUsers())
	w.Write(resp)
}

type ChangeBalanceRequest struct {
	FromName      string
	CardId        string
	BalanceChange int
}

func adminHandlerChangeBalance(w http.ResponseWriter, r *http.Request, title string) {
	var req ChangeBalanceRequest
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&req)
	changeBalance(req.FromName, req.CardId, req.BalanceChange)
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(Message{Text: "OK"})
	w.Write(resp)
}

type SetPasswordRequest struct {
	CardId      string
	NewPassword string
}

func adminHandlerSetPassword(w http.ResponseWriter, r *http.Request, title string) {
	var req SetPasswordRequest
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&req)
	setPassword(req.CardId, req.NewPassword)
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(Message{Text: "OK"})
	w.Write(resp)
}

type DeleteCardRequest struct {
	CardId string
}

func adminHandlerDeleteCard(w http.ResponseWriter, r *http.Request, title string) {
	var req SetPasswordRequest
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&req)
	deleteUser(req.CardId)
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(Message{Text: "OK"})
	w.Write(resp)
}

type GetTransactionsRequest struct {
	Name string
}

func adminHandlerGetTransactions(w http.ResponseWriter, r *http.Request, title string) {
	var req GetTransactionsRequest
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&req)
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(getTransactions(req.Name))
	w.Write(resp)
}

func adminHandlerDeleteTransactions(w http.ResponseWriter, r *http.Request, title string) {
	_, _ = db.Exec("delete from Transactions")
	w.Header().Set("Content-Type", "application/json")
	resp, _ := json.Marshal(Message{Text: "OK"})
	w.Write(resp)
}

var templates = template.Must(template.ParseFiles("main.html", "user.html", "admin.html"))

func renderTemplate(w http.ResponseWriter, tmpl string) {
	err := templates.ExecuteTemplate(w, tmpl+".html", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func makeHandler(fn func(http.ResponseWriter, *http.Request, string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || strings.Contains(r.URL.Path, adminPage) {
			fn(w, r, "")
			return
		}
		m := validPath.FindStringSubmatch(r.URL.Path)
		if m == nil {
			http.NotFound(w, r)
			return
		}
		fn(w, r, m[2])
	}
}

func main() {
	db, _ = sql.Open("postgres", connStr)
	defer db.Close()

	fileServer := http.FileServer(http.Dir("./static/"))

	http.Handle("/static/", http.StripPrefix("/static", fileServer))
	http.HandleFunc("/", makeHandler(mainHandler))
	http.HandleFunc("/user/", makeHandler(userHandler))
	http.HandleFunc("/balance/", makeHandler(balanceHandler))
	http.HandleFunc("/"+adminPage, makeHandler(adminHandler))
	http.HandleFunc("/"+adminPage+"/getUsers", makeHandler(adminHandlerGetUsers))
	http.HandleFunc("/"+adminPage+"/changeBalance", makeHandler(adminHandlerChangeBalance))
	http.HandleFunc("/"+adminPage+"/setPassword", makeHandler(adminHandlerSetPassword))
	http.HandleFunc("/"+adminPage+"/deleteCard", makeHandler(adminHandlerDeleteCard))
	http.HandleFunc("/"+adminPage+"/getTransactions", makeHandler(adminHandlerGetTransactions))
	http.HandleFunc("/"+adminPage+"/deleteTransactions", makeHandler(adminHandlerDeleteTransactions))

	log.Fatal(http.ListenAndServe(":80", nil))
}
