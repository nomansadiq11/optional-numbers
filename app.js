const STORAGE_KEY = "phone-cache-items";

const form = document.getElementById("phone-form");
const countryInput = document.getElementById("country");
const phoneInput = document.getElementById("phone");
const listEl = document.getElementById("number-list");
const messageEl = document.getElementById("form-message");
const saveBtn = document.getElementById("save-btn");

let numbers = loadNumbers();
let editingId = null;

renderList();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const countryCode = countryInput.value;
  const rawPhone = phoneInput.value.trim();
  const cleanPhone = rawPhone.replace(/\D+/g, "");

  if (!countryCode) {
    setMessage("Please select a country.");
    return;
  }

  if (!cleanPhone) {
    setMessage("Please enter a valid number.");
    return;
  }

  if (editingId) {
    numbers = numbers.map((item) =>
      item.id === editingId
        ? { ...item, countryCode, phone: cleanPhone, updatedAt: Date.now() }
        : item
    );

    setMessage("Number updated.");
  } else {
    numbers.unshift({
      id: crypto.randomUUID(),
      countryCode,
      phone: cleanPhone,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    setMessage("Number saved.");
  }

  saveNumbers(numbers);
  resetForm();
  renderList();
});

function renderList() {
  if (!numbers.length) {
    listEl.innerHTML = '<li><p class="empty">No numbers saved yet.</p></li>';
    return;
  }

  listEl.innerHTML = "";

  numbers.forEach((item) => {
    const li = document.createElement("li");
    li.className = "number-item";

    const fullNumber = `${item.countryCode}${item.phone}`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullNumber}`;

    li.innerHTML = `
      <div class="number-main">
        <span class="phone-value">${fullNumber}</span>
      </div>
      <div class="actions">
        <button type="button" class="edit-btn" data-id="${item.id}">Edit</button>
        <button type="button" class="delete-btn" data-id="${item.id}">Delete</button>
        <a class="whatsapp-btn" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    `;

    listEl.appendChild(li);
  });
}

listEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.classList.contains("edit-btn")) {
    const id = target.dataset.id;
    startEdit(id);
  }

  if (target.classList.contains("delete-btn")) {
    const id = target.dataset.id;
    removeNumber(id);
  }
});

function startEdit(id) {
  const item = numbers.find((entry) => entry.id === id);
  if (!item) {
    return;
  }

  editingId = id;
  countryInput.value = item.countryCode;
  phoneInput.value = item.phone;
  saveBtn.textContent = "Update Number";
  setMessage(`Editing ${item.countryCode}${item.phone}`);
  phoneInput.focus();
}

function removeNumber(id) {
  numbers = numbers.filter((entry) => entry.id !== id);
  saveNumbers(numbers);

  if (editingId === id) {
    resetForm();
  }

  renderList();
  setMessage("Number deleted.");
}

function resetForm() {
  form.reset();
  editingId = null;
  saveBtn.textContent = "Save Number";
}

function loadNumbers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNumbers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setMessage(text) {
  messageEl.textContent = text;
}
