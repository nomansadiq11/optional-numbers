const STORAGE_KEY = "phone-cache-items";

const form = document.getElementById("phone-form");
const nameInput = document.getElementById("name");
const countryInput = document.getElementById("country");
const phoneInput = document.getElementById("phone");
const listEl = document.getElementById("number-list");
const messageEl = document.getElementById("form-message");
const saveBtn = document.getElementById("save-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");

let numbers = loadNumbers();
let editingId = null;

renderList();

exportCsvBtn.addEventListener("click", exportNumbersAsCsv);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const countryCode = countryInput.value;
  const rawPhone = phoneInput.value.trim();
  const cleanPhone = rawPhone.replace(/\D+/g, "");

  if (!name) {
    setMessage("Please enter a name.");
    return;
  }

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
        ? { ...item, name, countryCode, phone: cleanPhone, updatedAt: Date.now() }
        : item
    );

    setMessage("Number updated.");
  } else {
    numbers.unshift({
      id: crypto.randomUUID(),
      name,
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

    const ownerName = item.name || "Unknown";
    const fullNumber = `${item.countryCode}${item.phone}`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullNumber}`;

    li.innerHTML = `
      <div class="number-main">
        <span class="name-value">${ownerName}</span>
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
  nameInput.value = item.name || "";
  countryInput.value = item.countryCode;
  phoneInput.value = item.phone;
  saveBtn.textContent = "Update Number";
  setMessage(`Editing ${item.name || "contact"}`);
  nameInput.focus();
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
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      ...item,
      name: typeof item.name === "string" ? item.name : ""
    }));
  } catch {
    return [];
  }
}

function saveNumbers(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function exportNumbersAsCsv() {
  if (!numbers.length) {
    setMessage("No numbers to export.");
    return;
  }

  const headers = ["Name", "CountryCode", "Phone", "FullNumber"];
  const rows = numbers.map((item) => [
    item.name || "",
    item.countryCode || "",
    item.phone || "",
    `${item.countryCode || ""}${item.phone || ""}`
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);

  link.href = fileUrl;
  link.download = `phone-cache-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);

  setMessage("CSV exported successfully.");
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function setMessage(text) {
  messageEl.textContent = text;
}
