CREATE TABLE Users (
  name varchar(255) PRIMARY KEY,
  password varchar(255),
  balance int
);

CREATE TABLE Transactions (
  id SERIAL PRIMARY KEY,
  fromName varchar(255),
  toName varchar(255),
  amount int,
  date timestamp
);