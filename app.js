const STORAGE_KEY = "phone-cache-items";

const form = document.getElementById("phone-form");
const nameInput = document.getElementById("name");
const countryInput = document.getElementById("country");
const phoneInput = document.getElementById("phone");
const listEl = document.getElementById("number-list");
const messageEl = document.getElementById("form-message");
const saveBtn = document.getElementById("save-btn");
const importCsvBtn = document.getElementById("import-csv-btn");
const importCsvInput = document.getElementById("import-csv-input");
const exportCsvBtn = document.getElementById("export-csv-btn");
const supportedCountryCodes = Array.from(countryInput.options)
  .map((option) => option.value)
  .filter(Boolean)
  .sort((left, right) => right.length - left.length);

let numbers = loadNumbers();
let editingId = null;

renderList();

importCsvBtn.addEventListener("click", () => {
  importCsvInput.click();
});
importCsvInput.addEventListener("change", handleImportCsv);
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

async function handleImportCsv(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importedItems = parseImportedCsv(text);

    if (!importedItems.length) {
      setMessage("No valid rows found in CSV.");
      return;
    }

    const result = mergeImportedNumbers(importedItems);
    numbers = result.nextNumbers;
    saveNumbers(numbers);
    renderList();
    setMessage(
      `Imported ${result.processed} rows (${result.added} new, ${result.updated} updated).`
    );
  } catch {
    setMessage("Could not import CSV. Please use a valid CSV file.");
  } finally {
    importCsvInput.value = "";
  }
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

function parseImportedCsv(csvText) {
  const rows = parseCsvRows(csvText).filter((row) =>
    row.some((cell) => String(cell).trim() !== "")
  );

  if (rows.length < 2) {
    return [];
  }

  const header = rows[0].map((cell) => normalizeHeader(cell));
  const nameIndex = findHeaderIndex(header, ["name"]);
  const countryIndex = findHeaderIndex(header, ["countrycode", "country", "code"]);
  const phoneIndex = findHeaderIndex(header, ["phone", "number", "phonenumber"]);
  const fullNumberIndex = findHeaderIndex(header, ["fullnumber", "full", "whatsapp"]);

  const imported = [];

  for (const row of rows.slice(1)) {
    const name = (row[nameIndex] || "").trim() || "Unknown";
    let countryCode = normalizeCountryCode((row[countryIndex] || "").trim());
    let phone = String(row[phoneIndex] || "").replace(/\D+/g, "");

    if ((!countryCode || !phone) && fullNumberIndex !== -1) {
      const parsed = splitFullNumber((row[fullNumberIndex] || "").trim());
      if (parsed) {
        countryCode = parsed.countryCode;
        phone = parsed.phone;
      }
    }

    if (!countryCode || !phone) {
      continue;
    }

    imported.push({
      id: crypto.randomUUID(),
      name,
      countryCode,
      phone,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  return imported;
}

function mergeImportedNumbers(importedItems) {
  const nextNumbers = [...numbers];
  let added = 0;
  let updated = 0;

  importedItems.forEach((item) => {
    const fullNumber = `${item.countryCode}${item.phone}`;
    const existingIndex = nextNumbers.findIndex(
      (entry) => `${entry.countryCode}${entry.phone}` === fullNumber
    );

    if (existingIndex >= 0) {
      nextNumbers[existingIndex] = {
        ...nextNumbers[existingIndex],
        name: item.name || nextNumbers[existingIndex].name,
        updatedAt: Date.now()
      };
      updated += 1;
      return;
    }

    nextNumbers.unshift(item);
    added += 1;
  });

  return {
    nextNumbers,
    processed: importedItems.length,
    added,
    updated
  };
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      row.push(value);
      rows.push(row.map((cell) => String(cell).trim()));
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row.map((cell) => String(cell).trim()));
  }

  return rows;
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function findHeaderIndex(headerRow, candidates) {
  return headerRow.findIndex((value) => candidates.includes(value));
}

function normalizeCountryCode(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) {
    return "";
  }

  return `+${digits}`;
}

function splitFullNumber(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) {
    return null;
  }

  const normalizedFull = `+${digits}`;
  const matchedCountryCode = supportedCountryCodes.find((code) =>
    normalizedFull.startsWith(code)
  );

  if (!matchedCountryCode) {
    return null;
  }

  const phone = normalizedFull.slice(matchedCountryCode.length).replace(/\D+/g, "");
  if (!phone) {
    return null;
  }

  return {
    countryCode: matchedCountryCode,
    phone
  };
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function setMessage(text) {
  messageEl.textContent = text;
}
