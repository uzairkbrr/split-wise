(function () {

	// elements
	const usersCards = document.querySelector(".users-cards");
	const clearLocalStorage = document.getElementById("clear-record-button");
	const exportButton = document.getElementById("export-data-button");

	const addExpenseElements = {
		modal: document.getElementById("add-expense-modal"),
		details: document.querySelector(".expenses-details"),
		submitButton: document.querySelector(".add-Expense-button"),
		closeButton: document.getElementById("add-expense__close-button"),
		showButton: document.getElementById("dashboard-buttons_add-expense"),
	}

	const settleUpElements = {
		modal: document.getElementById("settle-up-modal"),
		showButton: document.getElementById("dashboard-buttons_settle-up"),
		closeButton: document.querySelector(".settle-up-close-button"),
		submitButton: document.querySelector("#settle-up-form button[type='submit']"),
		payerSelect: document.getElementById("settle-payer"),
		receiverSelect: document.getElementById("settle-receiver"),
		amountInput: document.getElementById("settle-amount")
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
	function generateId() {
		return Math.random().toString(36).substr(2, 9);
	}

	function recalculateBalances() {
		// Reset all balances to 0
		personAccounts.forEach(person => person.amount = 0);

		transactionsArray.forEach(transaction => {
			if (transaction.type === 'expense') {
				const amount = parseFloat(transaction.amount);
				const personsInvolved = transaction.involvedPersons || [];
				// Fallback for old data structure if needed, but best to normalize

				const splitAmount = amount / personsInvolved.length;

				// Payer gets + (Total - split share) OR just simply: 
				// Payer paid full amount (+Amount), but also "consumed" splitAmount (-Share).
				// Easier logic: Payer +Amount. Everyone involved -Share.

				const payer = personAccounts.find(p => p.name.toLowerCase() === transaction.payer.toLowerCase());
				if (payer) payer.amount += amount;

				personsInvolved.forEach(personName => {
					const person = personAccounts.find(p => p.name.toLowerCase() === personName.toLowerCase());
					if (person) person.amount -= splitAmount;
				});

			} else if (transaction.type === 'settlement') {
				const amount = parseFloat(transaction.amount);
				const payer = personAccounts.find(p => p.name.toLowerCase() === transaction.payer.toLowerCase());
				const receiver = personAccounts.find(p => p.name.toLowerCase() === transaction.receiver.toLowerCase());

				if (payer) payer.amount += amount; // Payer "paid" debt, so their balance goes UP (less negative)
				if (receiver) receiver.amount -= amount; // Receiver "got" money, so their owed amount goes DOWN (less positive)

				// Wait, standard Splitwise logic:
				// User A owes User B 50. A is -50, B is +50.
				// A pays B 50.
				// A balance: -50 + 50 = 0.
				// B balance: +50 - 50 = 0.
				// Logic checks out.
			}
		});

		setToLocalStorage("personAccounts", personAccounts);
	}

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

	function hideSettleUpModal() {
		settleUpElements.modal.classList.add("hide");
	}

	function unHideSettleUpModal() {
		if (personAccounts.length < 2) {
			showCustomAlert("You need at least 2 people to settle up!", "Not Enough People");
			return;
		}

		// Check if anyone actually owes anything
		const hasDebts = personAccounts.some(p => Math.abs(p.amount) > 0.01);
		if (!hasDebts) {
			showCustomAlert("Everyone is already settled up! No debts to clear.", "All Good! 🎉");
			return;
		}

		const options = personAccounts.map(p => `<option value="${p.name}">${p.name}</option>`).join("");
		settleUpElements.payerSelect.innerHTML = options;
		settleUpElements.receiverSelect.innerHTML = options;
		settleUpElements.modal.classList.remove("hide");
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

	function setToLocalStorage(key, value) {
		return localStorage.setItem(key, JSON.stringify(value));
	};

	function getFromLocalStorage(key) {
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

		const container = transactionElements.modal.querySelector(".modal-content");
		// Keep close button, remove rest (heading is static? no, let's rebuild)

		// Safe way: clear everything except close button? 
		// Easier: Just select specific elements? No, the current HTML is too simple (just P tags).
		// Let's replace the innerHTML of a specific container wrapper.
		// I'll create a new wrapper string.

		const isSettlement = transaction.type === 'settlement';
		const icon = isSettlement ? '🤝' : '💸';
		const title = isSettlement ? 'Settlement' : 'Expense Details';
		const dateInfo = `${transaction.day}, ${transaction.date} at ${transaction.time}`;

		const amountHTML = `<div class="detail-amount ${isSettlement ? 'text-success' : 'text-primary'}">PKR ${transaction.amount.toFixed(2)}</div>`;

		let extraInfo = '';
		if (isSettlement) {
			extraInfo = `
				<div class="detail-row">
					<span class="detail-label">Payer</span>
					<span class="detail-value">${transaction.payer}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Receiver</span>
					<span class="detail-value">${transaction.receiver}</span>
				</div>
			`;
		} else {
			extraInfo = `
				<div class="detail-row">
					<span class="detail-label">Paid By</span>
					<span class="detail-value">${transaction.payer}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">For</span>
					<span class="detail-value">${transaction.persons}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Description</span>
					<span class="detail-value">${transaction.description}</span>
				</div>
			`;
		}

		// Reconstruct content
		const closeButtonHTML = `<span class="transaction-close-button" id="transaction-close-button">&times;</span>`;

		container.innerHTML = `
			${closeButtonHTML}
			<div class="detail-header">
				<div class="detail-icon">${icon}</div>
				<h2>${title}</h2>
				<p class="detail-date">${dateInfo}</p>
			</div>
			${amountHTML}
			<div class="detail-body">
				${extraInfo}
			</div>
		`;

		// Re-attach listener since we wiped the DOM
		document.getElementById("transaction-close-button").addEventListener("click", hideTransactionModal);
	};

	const clearUpInputs = () => {
		document.getElementById("payer").value = "";
		document.getElementById("amount").value = "";
		document.getElementById("num-people").value = "";
		document.getElementById("person-name").value = "";
		document.getElementById("description-input").value = "";
		document.getElementById("persons-in-expenses").value = "";
	};

	const userGuide = document.getElementById("user-guide");
	const expenseGuide = document.getElementById("expense-guide");
	const overviewSection = document.querySelector(".dashboard-overview");
	const expensesSection = document.querySelector(".dashboard-expenses");

	const updateUIState = () => {
		// User Section State
		if (personAccounts.length === 0) {
			overviewSection.classList.add("hide");
			userGuide.classList.remove("hide");
		} else {
			overviewSection.classList.remove("hide");
			userGuide.classList.add("hide");
		}

		// Expense Section State
		if (personAccounts.length > 0 && transactionsArray.length === 0) {
			expensesSection.classList.add("hide");
			expenseGuide.classList.remove("hide");
		} else if (transactionsArray.length > 0) {
			expensesSection.classList.remove("hide");
			expenseGuide.classList.add("hide");
		} else {
			// No users yet, so hide expense stuff too
			expensesSection.classList.add("hide");
			expenseGuide.classList.add("hide");
		}

		// Safety check: if no users, definitely no expense guide should be shown (handled above but explicit is good)
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
		updateUIState();
	};

	const customAlertElements = {
		modal: document.getElementById("custom-alert-modal"),
		title: document.getElementById("alert-title"),
		message: document.getElementById("alert-message"),
		okButton: document.getElementById("alert-ok-button"),
		closeButton: document.querySelector(".alert-close-button")
	};

	function showCustomAlert(message, title = "Notice") {
		customAlertElements.title.textContent = title;
		customAlertElements.message.textContent = message;
		customAlertElements.modal.classList.remove("hide");
	}

	function hideCustomAlert() {
		customAlertElements.modal.classList.add("hide");
	}

	//  Events Listeners
	addExpenseElements.showButton.addEventListener("click", function () {
		if (personAccounts.length < 2) {
			showCustomAlert("You need at least 2 people to split an expense!", "Not Enough People");
			return;
		}
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

		if (amount <= 0 || isNaN(amount)) {
			showCustomAlert("Please enter a valid positive amount.", "Invalid Amount");
			return;
		}

		const personsArray = stringToArray(personsInExpense);

		if (personsArray.length != numPeople) {
			showCustomAlert(`You should select the same number of persons as you mentioned above in the field of "Number of Persons".`, "Mismatch");
			return;
		}

		// Verify users exist
		const lowerCaseAccounts = personAccounts.map(p => p.name.toLowerCase());
		const invalidPersons = personsArray.filter(p => !lowerCaseAccounts.includes(p.toLowerCase()));

		if (invalidPersons.length > 0) {
			showCustomAlert(`The following people do not exist: ${invalidPersons.join(", ")}. Please add them first.`, "Unknown Person");
			return;
		}

		const { date, time, day } = currentDate();

		const transaction = {
			id: generateId(),
			type: 'expense',
			date,
			time,
			day,
			payer,
			description,
			amount,
			persons: personsArray.join(", "),
			involvedPersons: personsArray
		};

		transactionsArray.unshift(transaction); // Add to beginning (Newest First)

		// Recalculate everything
		recalculateBalances();

		clearUpInputs();
		hideExpenseModal();
		renderUsers(personAccounts);
		renderTransactions();
		setToLocalStorage("transactions", transactionsArray);
		updateUIState();
	});

	function deleteTransaction(id) {
		if (!confirm("Are you sure you want to delete this transaction?")) return;

		const index = transactionsArray.findIndex(t => t.id === id);
		if (index > -1) {
			transactionsArray.splice(index, 1);
			recalculateBalances();
			renderUsers(personAccounts);
			renderTransactions();
			setToLocalStorage("transactions", transactionsArray);
			updateUIState();
		}
	}

	function exportData() {
		if (transactionsArray.length === 0) {
			showCustomAlert("No data to export!", "Empty Records");
			return;
		}

		const totalSpent = transactionsArray
			.filter(t => t.type === 'expense')
			.reduce((acc, t) => acc + t.amount, 0);

		// Calculate max balance for graph scaling
		const maxBalance = Math.max(...personAccounts.map(p => Math.abs(p.amount)), 1);

		// Generate HTML for Charts
		const chartHTML = personAccounts.map(p => {
			const isPositive = p.amount >= 0;
			const color = isPositive ? '#10b981' : '#ef4444'; // Green or Red
			// Calculate width percentage relative to max balance (capped at 100%)
			const width = Math.min((Math.abs(p.amount) / maxBalance) * 100, 100);
			const formattedAmount = `PKR ${Math.abs(p.amount).toFixed(2)}`;
			const label = isPositive ? 'Gets back' : 'Owes';

			return `
				<div class="chart-row">
					<div class="chart-label">${p.name}</div>
					<div class="chart-bar-container">
						<div class="chart-bar" style="width: ${width}%; background-color: ${color};"></div>
						<span class="chart-value" style="color: ${color}">${label} ${formattedAmount}</span>
					</div>
				</div>
			`;
		}).join('');

		// transaction rows
		const tableRows = transactionsArray.map(t => {
			const isSettlement = t.type === 'settlement';
			const date = t.date || 'N/A';
			const desc = isSettlement ? `Settlement` : t.description;
			const amount = `PKR ${t.amount.toFixed(2)}`;
			const rowClass = isSettlement ? 'settlement-row' : '';

			// Step-by-step logic explanation
			let narration = "";
			if (isSettlement) {
				narration = `<strong>${t.payer}</strong> paid <strong>${amount}</strong> to <strong>${t.receiver}</strong>. Debt settled.`;
			} else {
				const involved = t.involvedPersons || (t.persons ? t.persons.split(", ") : []);
				const names = involved.join(", ");
				const count = involved.length || 1;
				const share = (t.amount / count).toFixed(2);

				// Identify who actually owes (everyone except payer, theoretically)
				// But simpler explanation: 
				narration = `Total <strong>${amount}</strong> ÷ <strong>${count}</strong> people (${names}) = <strong>PKR ${share}</strong>/person.<br>`;
				narration += `<strong>${t.payer}</strong> paid full amount. Others owe <strong>PKR ${share}</strong> each.`;
			}

			return `
				<tr class="${rowClass}">
					<td>${date}</td>
					<td>
						<div class="desc-main">${desc}</div>
						<div class="desc-sub">${narration}</div>
					</td>
					<td>${t.payer}</td>
					<td style="text-align: right;">${amount}</td>
				</tr>
			`;
		}).join('');

		const reportHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Expense Report - Tera Mera Hisaab</title>
				<style>
					@page { margin: 0; size: auto; } /* Hides browser default headers/footers */
					body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; margin-top: 20px; }
					
					/* Content needs padding because page margin is 0 */
					.print-container { padding: 40px; }

					h1 { color: #6366f1; margin-bottom: 5px; font-size: 28px; }
					.subtitle { color: #64748b; font-size: 14px; margin-bottom: 40px; }
					
					.section-title { font-size: 18px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px; color: #0f172a; }
					
					/* Chart Styles */
					.chart-container { margin-bottom: 40px; }
					.chart-row { display: flex; align-items: center; margin-bottom: 15px; }
					.chart-label { width: 120px; font-weight: 600; font-size: 14px; }
					.chart-bar-container { flex: 1; display: flex; align-items: center; gap: 10px; }
					.chart-bar { height: 24px; border-radius: 6px; min-width: 4px; transition: width 0.5s; }
					.chart-value { font-size: 13px; font-weight: 600; white-space: nowrap; }

					/* Math Box */
					.math-box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.6; }
					.math-highlight { color: #6366f1; font-weight: 700; }

					/* Table */
					table { width: 100%; border-collapse: collapse; font-size: 13px; }
					th { text-align: left; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding: 10px 5px; }
					td { border-bottom: 1px solid #f1f5f9; padding: 12px 5px; vertical-align: top; }
					.settlement-row { background-color: #f0fdf4; }
					.desc-main { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
					.desc-sub { font-size: 12px; color: #64748b; line-height: 1.4; }
					
					/* Footer */
					.footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 16px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-weight: 600; }
					
					@media print {
						body { -webkit-print-color-adjust: exact; }
						.no-print { display: none; }
					}
				</style>
			</head>
			<body>
				<div class="print-container">
					<h1>Tera Mera Hisaab</h1>
					<div class="subtitle">Expense Report &bull; Generated on ${new Date().toLocaleString()}</div>

					<div class="math-box">
						<strong>💡 The Math Logic:</strong><br>
						We summed up all expenses (Total: <span class="math-highlight">PKR ${totalSpent.toFixed(2)}</span>). 
						For each expense, the amount was split equally among the involved people. 
						<br><br>
						If you <strong>Paid</strong> more than your share, your bar is <span style="color:#10b981; font-weight:bold;">Green</span> (You get back).<br>
						If you <strong>Consumed</strong> more than you paid, your bar is <span style="color:#ef4444; font-weight:bold;">Red</span> (You owe).
					</div>

					<div class="section-title">Net Balances</div>
					<div class="chart-container">
						${chartHTML}
					</div>

					<div class="section-title">Step-by-Step Transaction History</div>
					<table>
						<thead>
							<tr>
								<th width="15%">Date</th>
								<th width="50%">Description & Explanation</th>
								<th width="20%">Payer</th>
								<th width="15%" style="text-align: right;">Amount</th>
							</tr>
						</thead>
						<tbody>
							${tableRows}
						</tbody>
					</table>

					<div class="footer">
						Built with 🫶 by <a href="https://www.linkedin.com/in/uzairkbrr" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 700;">Uzair</a>
					</div>
				</div>
				<script>
					window.onload = function() { window.print(); }
				</script>
			</body>
			</html>
		`;

		const printWindow = window.open('', '_blank');
		printWindow.document.write(reportHTML);
		printWindow.document.close();
	}


	personElements.submitButton.addEventListener("click", function (e) {
		e.preventDefault();

		const personName = document.getElementById("person-name").value;

		if (!personName) {
			showCustomAlert("Please enter a valid name.", "Empty Name");
			return;
		}

		if (personAccounts.some(p => p.name.toLowerCase() === personName.toLowerCase())) {
			showCustomAlert("This person is already added!", "Duplicate");
			return;
		}

		const div = createElement("div", ["card"]);
		const h3 = createElement("h3", ["person-account-name"], personName);
		const p = createElement("p", ["person-account-amount"], "0.00");

		div.appendChild(h3);
		div.appendChild(p);
		usersCards.appendChild(div);

		personAccounts.push({ name: `${personName}`, amount: 0.00 });

		personElements.modal.classList.add("hide");
		setToLocalStorage("personAccounts", personAccounts);
		clearUpInputs();
		updateUIState();
	});

	function renderTransactions() {
		addExpenseElements.details.innerHTML = "";

		transactionsArray.forEach((transaction) => {
			const li = createElement("li", ["cursor-pointer", "expense-card"]);

			// Create container for content to separate from actions
			const contentDiv = createElement("div", ["expense-content"]);

			// Click on content opens details
			contentDiv.addEventListener("click", function () {
				showTransactionDetails(transaction);
			});

			let amountText = "";
			let subText = "";
			let dateText = transaction.date || currentDate().date;

			if (transaction.type === 'settlement') {
				amountText = `PKR ${transaction.amount.toFixed(2)}`;
				subText = `${transaction.payer} ➔ ${transaction.receiver}`;
			} else {
				const involvedCount = transaction.involvedPersons ? transaction.involvedPersons.length : (transaction.persons ? transaction.persons.split(',').length : 1);
				const perPerson = (transaction.amount / involvedCount).toFixed(2);
				amountText = `PKR ${transaction.amount.toFixed(2)}`;
				subText = `${transaction.payer} paid (${perPerson}/person)`;
			}

			// Left Side: Description + Date
			const leftDiv = createElement("div", ["expense-left"]);
			const descP = createElement("p", ["expense-description"], transaction.description || "Settlement");
			const dateP = createElement("p", ["expense-date"], dateText);
			leftDiv.appendChild(descP);
			leftDiv.appendChild(dateP);

			// Right Side: Amount + Subtext (Payer info)
			const rightDiv = createElement("div", ["expense-right"]);
			const amountP = createElement("p", ["expense-amount"], amountText);
			const subP = createElement("p", ["expense-subtext"], subText);

			// Color coding amount
			if (transaction.type === 'settlement') {
				amountP.classList.add("text-success");
			} else {
				amountP.classList.add("text-primary");
			}

			rightDiv.appendChild(amountP);
			rightDiv.appendChild(subP);

			contentDiv.appendChild(leftDiv);
			contentDiv.appendChild(rightDiv);

			// Actions
			const actionsDiv = createElement("div", ["transaction-actions"]);
			const deleteBtn = createElement("button", ["action-btn", "delete-btn"], "🗑️");
			deleteBtn.title = "Delete Transaction";
			deleteBtn.onclick = (e) => {
				e.stopPropagation(); // Prevent modal opening
				deleteTransaction(transaction.id);
			};

			actionsDiv.appendChild(deleteBtn);

			li.appendChild(contentDiv);
			li.appendChild(actionsDiv);

			addExpenseElements.details.appendChild(li);
		});
	}

	document.addEventListener("DOMContentLoaded", function () {


		const localPersonsAccounts = getFromLocalStorage("personAccounts");
		const localTransactions = getFromLocalStorage("transactions");

		if (localPersonsAccounts) {
			personAccounts.length = 0;
			personAccounts.push(...localPersonsAccounts);
			renderUsers(personAccounts);
		}

		if (localTransactions) {
			transactionsArray.length = 0;
			transactionsArray.push(...localTransactions);
			renderTransactions();
		}
		updateUIState();
	});

	addExpenseElements.closeButton.addEventListener("click", hideExpenseModal);
	personElements.showButton.addEventListener("click", unHidePersonModal);
	personElements.closeButton.addEventListener("click", hidePersonModal);
	transactionElements.closeButton.addEventListener("click", hideTransactionModal);

	// Settle Up Listeners
	settleUpElements.showButton.addEventListener("click", unHideSettleUpModal);
	settleUpElements.closeButton.addEventListener("click", hideSettleUpModal);

	settleUpElements.submitButton.addEventListener("click", function (e) {
		e.preventDefault();
		const payer = settleUpElements.payerSelect.value;
		const receiver = settleUpElements.receiverSelect.value;
		const amount = parseFloat(settleUpElements.amountInput.value);

		if (payer === receiver) {
			showCustomAlert("Payer and Receiver cannot be the same person.", "Logic Error");
			return;
		}

		if (amount <= 0 || isNaN(amount)) {
			showCustomAlert("Please enter a valid positive amount.", "Invalid Amount");
			return;
		}

		const { date, time, day } = currentDate();
		const transaction = {
			id: generateId(),
			type: 'settlement',
			date,
			time,
			day,
			payer,
			receiver,
			amount,
			description: `Settlement: ${payer} paid ${receiver}`
		};

		transactionsArray.unshift(transaction);
		recalculateBalances();

		settleUpElements.amountInput.value = "";
		hideSettleUpModal();
		renderUsers(personAccounts);
		renderTransactions();
		setToLocalStorage("transactions", transactionsArray);
		updateUIState();
	});

	// Theme & Export
	if (exportButton) exportButton.addEventListener("click", exportData);

	// Alert Modal Listeners
	customAlertElements.closeButton.addEventListener("click", hideCustomAlert);
	customAlertElements.okButton.addEventListener("click", hideCustomAlert);

	window.addEventListener("click", function (event) {
		if (event.target === addExpenseElements.modal) hideExpenseModal();
		if (event.target === personElements.modal) hidePersonModal();
		if (event.target === transactionElements.modal) hideTransactionModal();
		if (event.target === customAlertElements.modal) hideCustomAlert();
		if (event.target === settleUpElements.modal) hideSettleUpModal();
	});

	clearLocalStorage.addEventListener('click', function (e) {
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

	// Mobile Menu Logic
	const mobileMenuBtn = document.getElementById("mobile-menu-btn");
	const mobileMenu = document.getElementById("mobile-menu");
	const mobileMenuClose = document.getElementById("mobile-menu-close");

	if (mobileMenuBtn) {
		mobileMenuBtn.addEventListener("click", () => {
			mobileMenu.classList.remove("hide");
		});
	}

	if (mobileMenuClose) {
		mobileMenuClose.addEventListener("click", () => {
			mobileMenu.classList.add("hide");
		});
	}

	// Close menu when clicking outside (on the overlay)
	window.addEventListener("click", function (event) {
		if (event.target === mobileMenu) {
			mobileMenu.classList.add("hide");
		}
	});

	// Navbar logic moved to navbar.js

	renderUsers(personAccounts);
})();