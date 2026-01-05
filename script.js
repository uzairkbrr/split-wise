(function () {

// elements
const	usersCards = document.querySelector(".users-cards");
const clearLocalStorage = document.getElementById("clear-record-button");

const addExpenseElements = {
	modal: document.getElementById("add-expense-modal"),
	details: document.querySelector(".expenses-details"),
	submitButton: document.querySelector(".add-Expense-button"),
	closeButton: document.getElementById("add-expense__close-button"),
	showButton: document.getElementById("dashboard-buttons_add-expense"),
}

const personElements = {
	modal: document.getElementById("add-person-modal"),
	closeButton: document.querySelector(".new-person-close-button"),
	submitButton: document.querySelector(".add-Person-submit-button"),
	showButton: document.getElementById("dashboard-buttons_add-person"),
}

const transactionElements = {
  day: document.getElementById("transaction-day"),
	date: document.getElementById("transaction-date"),
  time: document.getElementById("transaction-time"),
  payer: document.getElementById("transaction-payer"),
  persons: document.getElementById("transaction-persons"),
	modal: document.getElementById("transaction-details-modal"),
  description: document.getElementById("transaction-description"),
	closeButton: document.getElementById("transaction-close-button"),
}

const personAccounts = getFromLocalStorage("personAccounts") || [];
const transactionsArray = getFromLocalStorage("transactions") || [];

// functions
function hideExpenseModal() {
	addExpenseElements.modal.classList.add("hide");
}

function unHideExpenseModal() {
	addExpenseElements.modal.classList.remove("hide");
}

function hidePersonModal() {
	personElements.modal.classList.add("hide");
}

function unHidePersonModal() {
	personElements.modal.classList.remove("hide");
}

function hideTransactionModal() {
	transactionElements.modal.classList.add("hide");
}

function createElement(type, classes = [], textContent = '') {
	const element = document.createElement(type);

	if (classes.length) {
			element.classList.add(...classes);
	}

	if (textContent) {
			element.textContent = textContent;
	}

	return element;
}

function stringToArray(string) {
	return string.split(",").map((item) => item.trim());
}

function currentDate() {
	const now = new Date();
	return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    day: now.toLocaleDateString("en-US", { weekday: "long" })
	}
}

function setToLocalStorage (key, value) {
	return localStorage.setItem(key, JSON.stringify(value));
};

function getFromLocalStorage (key) {
	const data = localStorage.getItem(key);
	return data ? JSON.parse(data) : null;
};

function loadPersonsToSelectAsPayer() {
	const selectSection = document.querySelector(".select-payer");

	selectSection.innerHTML = "";
	for (let i = 0; i < personAccounts.length; i++) {
			const option = createElement("option");
			option.value = personAccounts[i].name;
			option.innerText = personAccounts[i].name;
			selectSection.appendChild(option);
	}
}

const showTransactionDetails = (transaction) => {
	transactionElements.modal.classList.remove("hide");
	transactionElements.day.innerText = `Day: ${transaction.day}`;
	transactionElements.date.innerText = `Date: ${transaction.date}`;
	transactionElements.time.innerText = `Time: ${transaction.time}`;
	transactionElements.payer.innerText = `Payer: ${transaction.payer}`;
	transactionElements.persons.innerText = `Persons in Expense: ${transaction.persons}`;
	transactionElements.description.innerText = `Description: ${transaction.description}`;
};

const clearUpInputs = () => {
	document.getElementById("payer").value = "";
	document.getElementById("amount").value = "";
	document.getElementById("num-people").value = "";
	document.getElementById("person-name").value = "";
	document.getElementById("description-input").value = "";
	document.getElementById("persons-in-expenses").value = "";
};

const renderUsers = (arrayOfPersons) => {
	usersCards.innerHTML = "";

	arrayOfPersons.forEach((person) => {
		const div = createElement("div", ["card"]);
		const h3 = createElement("h3", ["person-account-name"], person.name);
		const p = createElement("p", ["person-account-amount"], person.amount.toFixed(2));

		p.style.color = person.amount > 1 ? "green" : person.amount < 0 ? "red" : "black";
		
		div.appendChild(h3);
		div.appendChild(p);
		usersCards.appendChild(div);
	});
};

//  Events Listeners
addExpenseElements.showButton.addEventListener("click", function () {
	addExpenseElements.modal.classList.remove("hide");
	loadPersonsToSelectAsPayer();
});

addExpenseElements.submitButton.addEventListener("click", function (e) {
	e.preventDefault();

	const payer = document.getElementById("payer").value;
	const amount = parseFloat(document.getElementById("amount").value);
	const numPeople = parseInt(document.getElementById("num-people").value);
	const description = document.getElementById("description-input").value;
	const personsInExpense = document.getElementById("persons-in-expenses").value;

	const personsArray = stringToArray(personsInExpense);

	if (personsArray.length != numPeople) {
			alert(`You should select the same number of persons as you mentioned above in the field of "Number of Persons".`);
			expenseForm.classList.add("hide");
			clearUpInputs();
			return;
	}
	
	const { date, time, day } = currentDate();

	const transaction = {
			date,
			time,
			day,
			payer,
			description,
			amount,
			persons: personsArray.join(", "),
	};

	transactionsArray.push(transaction);

	const li =  createElement("li", ["cursor-pointer"], '');
	li.addEventListener("click", function () {
			showTransactionDetails(transaction);
	});

	const perPerson = (amount / numPeople).toFixed(2);

	const p1 = createElement("p", ["description-container"], description);
	const p2 =  createElement("p", ["amount-per-person"], `Per Person: ${perPerson}`)
	const p3 = createElement("p", ["payer"], `Paid by: ${payer}`)
	
	li.appendChild(p1);
	li.appendChild(p2);
	li.appendChild(p3);

	addExpenseElements.details.appendChild(li);

	let payerGetMoney = false;
	personsArray.forEach((person) => {
		personAccounts.forEach((p) => {
			if (payer.toLowerCase() === p.name.toLowerCase() && !payerGetMoney) {
					p.amount += amount - perPerson;
					payerGetMoney = !payerGetMoney;
					console.log(`Payed By: ${p.name}`);
			}
			
			if (p.name.toLowerCase() === person.toLowerCase() && payer.toLowerCase() !== person.toLowerCase()) {
					p.amount -= perPerson;
			}
		});
	});

	clearUpInputs();
	hideExpenseModal();
	renderUsers(personAccounts);
	setToLocalStorage("personAccounts", personAccounts);
	setToLocalStorage("transactions", transactionsArray);
});


personElements.submitButton.addEventListener("click", function (e) {
    e.preventDefault();

    const personName = document.getElementById("person-name").value;

    const div = createElement("div", ["card"]);
    const h3 = createElement("h3", ["person-account-name"],  personName);
    const p = createElement("p", ["person-account-amount"],  "0.00");

    div.appendChild(h3);
    div.appendChild(p);
    usersCards.appendChild(div);	

    personAccounts.push({ name: `${personName}`, amount: 0.00 });

    personElements.modal.classList.add("hide");
    setToLocalStorage("personAccounts", personAccounts);
    clearUpInputs();
});

document.addEventListener("DOMContentLoaded", function () {
	const localPersonsAccounts = getFromLocalStorage("personAccounts");
	const localTransactions = getFromLocalStorage("transactions");
	
	if (localPersonsAccounts) {
		localPersonsAccounts.length = 0;
		personAccounts.push(...localPersonsAccounts);
		renderUsers(personAccounts);
	}
	
	if (localTransactions) {
		transactionsArray.length = 0;
		transactionsArray.push(...localTransactions);
		
		localTransactions.forEach((transaction) => {
			const li = createElement("li", ["cursor-pointer"]);
			li.addEventListener("click", function () {
				showTransactionDetails(transaction);
			});

			const perPerson = (transaction.amount / personAccounts.length).toFixed(2);
			
			const p1 = createElement("p", ["description-container"],transaction.description);
			const p2 = createElement("p", ["amount-per-person"], `Per Person: ${perPerson}`);
			const p3 = createElement("p", ["amount-per-person"], `Paid by: ${transaction.payer}`);
			
			li.appendChild(p1);
			li.appendChild(p2);
			li.appendChild(p3);
			
			addExpenseElements.details.appendChild(li);
		});
	}
});

addExpenseElements.closeButton.addEventListener("click", hideExpenseModal);

personElements.showButton.addEventListener("click", unHidePersonModal);

personElements.closeButton.addEventListener("click", hidePersonModal);

transactionElements.closeButton.addEventListener("click", hideTransactionModal);

window.addEventListener("click", function(event) {
    if (event.target === addExpenseElements.modal) {
        hideExpenseModal();
    }
    if (event.target === personElements.modal) {
        hidePersonModal();
    }
    if (event.target === transactionElements.modal) {
        hideTransactionModal();
    }
});

clearLocalStorage.addEventListener('click', function(e) {
	e.preventDefault();
	localStorage.clear();
	renderUsers(personAccounts);
	location.reload();
})

window.addEventListener("blur", function () {
	this.document.title = "Clear Your Dues :(";
});

window.addEventListener("focus", function () {
	this.document.title = "Expense Manager - Dashboard";
});

renderUsers(personAccounts);
})();