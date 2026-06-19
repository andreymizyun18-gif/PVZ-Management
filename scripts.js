const KEYS = ["employees", "materials", "equipment", "shifts"];
function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
function setData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function resetData() {
  if (!confirm("Все данные будут удалены. Продолжить?")) return;
  KEYS.forEach((k) => localStorage.removeItem(k));
  renderAll();
}
let currentForm = null;
let editId = null;
function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  document.getElementById("page-" + page).classList.remove("hidden");
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  event.currentTarget.classList.add("active");
  if (page === "dashboard") renderDashboard();
  if (page === "materials") renderMaterials();
  if (page === "equipment") renderEquipment();
  if (page === "shifts") renderShifts();
  if (page === "employees") renderEmployees();
}
function renderAll() {
  renderDashboard();
  renderMaterials();
  renderEquipment();
  renderShifts();
  renderEmployees();
}
function renderDashboard() {
  const mats = getData("materials");
  const eq = getData("equipment");
  const shifts = getData("shifts");
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("dash-materials").textContent = mats.length;
  document.getElementById("dash-equipment").textContent = eq.length;
  document.getElementById("dash-shifts").textContent = shifts.filter(
    (s) => s.date === today,
  ).length;
  const critical = mats.filter((m) => m.quantity <= m.min_stock);
  document.getElementById("dash-critical").textContent = critical.length;
  const alertBox = document.getElementById("dash-alerts");
  const alertList = document.getElementById("alert-list");
  if (critical.length > 0) {
    alertBox.style.display = "block";
    alertList.innerHTML = critical
      .map(
        (c) =>
          `<li><svg><use href="#icon-droplet"/></svg> ${c.name}: ${c.quantity} ${c.unit} (мин. ${c.min_stock})</li>`,
      )
      .join("");
  } else {
    alertBox.style.display = "none";
  }
  const statuses = {};
  eq.forEach((e) => {
    statuses[e.status] = (statuses[e.status] || 0) + 1;
  });
  document.getElementById("dash-eq-status").innerHTML =
    Object.entries(statuses)
      .map(
        ([s, c]) =>
          `<tr><td><span class="badge ${s === "Работает" ? "badge-green" : s === "В ремонте" ? "badge-yellow" : "badge-red"}">${s}</span></td><td style="font-weight:700;font-size:16px">${c}</td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="2" style="color:var(--gray-400);text-align:center;padding:40px"><div class="empty-state" style="padding:0"><div class="empty-state-icon" style="width:56px;height:56px;margin-bottom:12px"><svg style="width:28px;height:28px"><use href="#icon-cpu"/></svg></div><div class="empty-state-title" style="font-size:15px">Нет данных</div></div></td></tr>';
  document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
}
function renderMaterials() {
  const search = document.getElementById("mat-search").value.toLowerCase();
  const filter = document.getElementById("mat-filter").value;
  let mats = getData("materials");
  if (search) mats = mats.filter((m) => m.name.toLowerCase().includes(search));
  if (filter) mats = mats.filter((m) => m.category === filter);
  const container = document.getElementById("materials-content");
  if (mats.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg><use href="#icon-box"/></svg></div><div class="empty-state-title">Нет расходных материалов</div><div class="empty-state-desc">Нажмите «Добавить», чтобы создать первую запись</div></div>`;
    return;
  }
  container.innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>Название</th><th>Категория</th><th>Количество</th><th>Мин. запас</th><th>Ед. изм.</th><th>Статус</th><th style="width:120px">Действия</th></tr></thead>
        <tbody>${mats
          .map((m) => {
            const isCrit = m.quantity <= m.min_stock;
            return `<tr>
                <td style="font-weight:600">${m.name}</td>
                <td><span class="badge badge-gray">${m.category}</span></td>
                <td style="font-weight:700">${m.quantity}</td>
                <td>${m.min_stock}</td>
                <td>${m.unit}</td>
                <td><span class="badge ${isCrit ? "badge-red" : "badge-green"}"><svg><use href="#${isCrit ? "icon-alert" : "icon-check"}"/></svg> ${isCrit ? "Критично" : "Норма"}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="editMaterial(${m.id})"><svg><use href="#icon-edit"/></svg></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMaterial(${m.id})"><svg><use href="#icon-trash"/></svg></button>
                </td>
            </tr>`;
          })
          .join("")}</tbody>
    </table></div>`;
}
function renderEquipment() {
  const filter = document.getElementById("eq-filter").value;
  let eq = getData("equipment");
  if (filter) eq = eq.filter((e) => e.status === filter);
  const emps = getData("employees");
  const empName = (id) => {
    const e = emps.find((x) => x.id === id);
    return e ? e.full_name : "Не назначен";
  };
  const container = document.getElementById("equipment-content");
  if (eq.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg><use href="#icon-printer"/></svg></div><div class="empty-state-title">Нет оборудования</div><div class="empty-state-desc">Нажмите «Добавить», чтобы создать первую запись</div></div>`;
    return;
  }
  container.innerHTML = `<div class="eq-grid">${eq
    .map((e) => {
      const statusClass =
        e.status === "Работает"
          ? "badge-green"
          : e.status === "В ремонте"
            ? "badge-yellow"
            : "badge-red";
      const cardColor =
        e.status === "Работает"
          ? "linear-gradient(90deg, var(--success) 0%, #34d399 100%)"
          : e.status === "В ремонте"
            ? "linear-gradient(90deg, var(--warning) 0%, #fbbf24 100%)"
            : "linear-gradient(90deg, var(--danger) 0%, #f87171 100%)";
      return `<div class="eq-card" style="--card-accent: ${cardColor}">
            <div class="eq-card-header">
                <div>
                    <div class="eq-card-title">${e.name}</div>
                    <div class="eq-card-model">${e.model}</div>
                </div>
                <span class="badge ${statusClass}">${e.status}</span>
            </div>
            <div class="eq-card-info">
                <div><strong>Инв. номер:</strong> ${e.inventory_number}</div>
                <div><strong>Ответственный:</strong> ${empName(e.employee_id)}</div>
            </div>
            <div class="eq-card-actions">
                <button class="btn btn-sm btn-success" onclick="editEquipment(${e.id})"><svg><use href="#icon-edit"/></svg></button>
                <button class="btn btn-sm btn-danger" onclick="deleteEquipment(${e.id})"><svg><use href="#icon-trash"/></svg></button>
            </div>
        </div>`;
    })
    .join("")}</div>`;
  document.querySelectorAll(".eq-card").forEach((card) => {
    const accent = card.style.getPropertyValue("--card-accent");
    if (accent) {
      const before = document.createElement("style");
      before.textContent = `.eq-card[style*="${accent}"]::before { background: ${accent} !important; }`;
      document.head.appendChild(before);
    }
  });
}
function renderShifts() {
  const shifts = getData("shifts");
  const emps = getData("employees");
  const empName = (id) => {
    const e = emps.find((x) => x.id === id);
    return e ? e.full_name : "Неизвестно";
  };
  const container = document.getElementById("shifts-content");
  if (shifts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg><use href="#icon-calendar"/></svg></div><div class="empty-state-title">Нет запланированных смен</div><div class="empty-state-desc">Нажмите «Добавить смену», чтобы создать первую запись</div></div>`;
    return;
  }
  const byDate = {};
  shifts.forEach((s) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });
  const sortedDates = Object.keys(byDate).sort();
  container.innerHTML = `<div class="shift-grid">${sortedDates
    .map((date) => {
      const d = new Date(date);
      const dateStr = d.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const isToday = date === new Date().toISOString().split("T")[0];
      return `<div class="shift-card" style="${isToday ? "border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,0.1)" : ""}">
            <div class="shift-date">
                <svg><use href="#icon-calendar"/></svg>
                ${dateStr} ${isToday ? '<span class="badge badge-blue" style="margin-left:8px">Сегодня</span>' : ""}
            </div>
            ${byDate[date]
              .map(
                (s) => `
                <div class="shift-item">
                    <div>
                        <div style="font-weight:600;color:var(--gray-900)">${empName(s.employee_id)}</div>
                        <div class="shift-time">
                            <svg><use href="#icon-clock"/></svg>
                            ${s.start_time} — ${s.end_time}
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-success" onclick="editShift(${s.id})"><svg><use href="#icon-edit"/></svg></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteShift(${s.id})"><svg><use href="#icon-trash"/></svg></button>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>`;
    })
    .join("")}</div>`;
}
function renderEmployees() {
  const emps = getData("employees");
  const container = document.getElementById("employees-content");
  if (emps.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg><use href="#icon-users"/></svg></div><div class="empty-state-title">Нет сотрудников</div><div class="empty-state-desc">Нажмите «Добавить», чтобы создать первую запись</div></div>`;
    return;
  }
  container.innerHTML = `<div class="table-wrap"><table>
        <thead><tr><th>ФИО</th><th>Должность</th><th>Телефон</th><th style="width:120px">Действия</th></tr></thead>
        <tbody>${emps
          .map(
            (e) => `
            <tr>
                <td style="font-weight:600">${e.full_name}</td>
                <td><span class="badge badge-gray">${e.position}</span></td>
                <td style="color:var(--gray-600)">${e.phone}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="editEmployee(${e.id})"><svg><use href="#icon-edit"/></svg></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${e.id})"><svg><use href="#icon-trash"/></svg></button>
                </td>
            </tr>
        `,
          )
          .join("")}</tbody>
    </table></div>`;
}
function openModal(type, id = null) {
  editId = id;
  currentForm = type;
  const modal = document.getElementById("modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  modal.classList.add("active");
  let html = "";
  if (type === "material") {
    title.textContent = id ? "Редактировать расходник" : "Добавить расходник";
    const m = id ? getData("materials").find((x) => x.id === id) : {};
    html = `<div class="form-grid">
            <div class="form-group"><label>Название</label><input type="text" id="f-name" value="${m.name || ""}"></div>
            <div class="form-group"><label>Категория</label>
                <select id="f-category"><option>Упаковка</option><option>Расходники</option><option>Канцелярия</option></select>
            </div>
            <div class="form-group"><label>Количество</label><input type="number" id="f-quantity" value="${m.quantity || ""}"></div>
            <div class="form-group"><label>Мин. запас</label><input type="number" id="f-min" value="${m.min_stock || ""}"></div>
            <div class="form-group"><label>Ед. изм.</label><input type="text" id="f-unit" value="${m.unit || ""}"></div>
        </div>`;
    setTimeout(() => {
      if (m.category) document.getElementById("f-category").value = m.category;
    }, 0);
  } else if (type === "equipment") {
    title.textContent = id
      ? "Редактировать оборудование"
      : "Добавить оборудование";
    const e = id ? getData("equipment").find((x) => x.id === id) : {};
    const emps = getData("employees");
    html = `<div class="form-grid">
            <div class="form-group"><label>Название</label><input type="text" id="f-name" value="${e.name || ""}"></div>
            <div class="form-group"><label>Модель</label><input type="text" id="f-model" value="${e.model || ""}"></div>
            <div class="form-group"><label>Инв. номер</label><input type="text" id="f-inv" value="${e.inventory_number || ""}"></div>
            <div class="form-group"><label>Статус</label>
                <select id="f-status"><option>Работает</option><option>В ремонте</option><option>Списано</option></select>
            </div>
            <div class="form-group"><label>Ответственный</label>
                <select id="f-emp"><option value="">Не назначен</option>${emps.map((emp) => `<option value="${emp.id}">${emp.full_name}</option>`).join("")}</select>
            </div>
        </div>`;
    setTimeout(() => {
      if (e.status) document.getElementById("f-status").value = e.status;
      if (e.employee_id) document.getElementById("f-emp").value = e.employee_id;
    }, 0);
  } else if (type === "shift") {
    title.textContent = id ? "Редактировать смену" : "Добавить смену";
    const s = id ? getData("shifts").find((x) => x.id === id) : {};
    const emps = getData("employees");
    if (emps.length === 0) {
      html = `<div style="padding:24px;text-align:center;color:var(--gray-600)"><div class="empty-state-icon" style="margin-bottom:16px"><svg><use href="#icon-users"/></svg></div>Сначала добавьте сотрудников в разделе «Сотрудники»</div>`;
    } else {
      html = `<div class="form-grid">
                <div class="form-group"><label>Сотрудник</label>
                    <select id="f-emp">${emps.map((emp) => `<option value="${emp.id}">${emp.full_name}</option>`).join("")}</select>
                </div>
                <div class="form-group"><label>Дата</label><input type="date" id="f-date" value="${s.date || new Date().toISOString().split("T")[0]}"></div>
                <div class="form-group"><label>Время начала</label><input type="time" id="f-start" value="${s.start_time || "08:00"}"></div>
                <div class="form-group"><label>Время окончания</label><input type="time" id="f-end" value="${s.end_time || "20:00"}"></div>
            </div>`;
      setTimeout(() => {
        if (s.employee_id)
          document.getElementById("f-emp").value = s.employee_id;
      }, 0);
    }
  } else if (type === "employee") {
    title.textContent = id ? "Редактировать сотрудника" : "Добавить сотрудника";
    const e = id ? getData("employees").find((x) => x.id === id) : {};
    html = `<div class="form-grid">
            <div class="form-group"><label>ФИО</label><input type="text" id="f-name" value="${e.full_name || ""}"></div>
            <div class="form-group"><label>Должность</label><input type="text" id="f-pos" value="${e.position || ""}"></div>
            <div class="form-group"><label>Телефон</label><input type="text" id="f-phone" value="${e.phone || ""}"></div>
        </div>`;
  }
  body.innerHTML = html;
}
function closeModal() {
  document.getElementById("modal").classList.remove("active");
  currentForm = null;
  editId = null;
}
function getStorageKey(formType) {
  if (formType === "equipment") return "equipment";
  return formType + "s";
}
function saveForm() {
  if (!currentForm) return;
  const key = getStorageKey(currentForm);
  const items = getData(key);
  const data = { id: editId || Date.now() };
  if (currentForm === "material") {
    data.name = document.getElementById("f-name").value;
    data.category = document.getElementById("f-category").value;
    data.quantity = parseInt(document.getElementById("f-quantity").value) || 0;
    data.min_stock = parseInt(document.getElementById("f-min").value) || 0;
    data.unit = document.getElementById("f-unit").value;
  } else if (currentForm === "equipment") {
    data.name = document.getElementById("f-name").value;
    data.model = document.getElementById("f-model").value;
    data.inventory_number = document.getElementById("f-inv").value;
    data.status = document.getElementById("f-status").value;
    data.employee_id = document.getElementById("f-emp").value
      ? parseInt(document.getElementById("f-emp").value)
      : null;
  } else if (currentForm === "shift") {
    const empSel = document.getElementById("f-emp");
    if (!empSel) {
      closeModal();
      return;
    }
    data.employee_id = parseInt(empSel.value);
    data.date = document.getElementById("f-date").value;
    data.start_time = document.getElementById("f-start").value;
    data.end_time = document.getElementById("f-end").value;
  } else if (currentForm === "employee") {
    data.full_name = document.getElementById("f-name").value;
    data.position = document.getElementById("f-pos").value;
    data.phone = document.getElementById("f-phone").value;
  }
  if (editId) {
    const idx = items.findIndex((x) => x.id === editId);
    if (idx >= 0) items[idx] = data;
  } else {
    items.push(data);
  }
  setData(key, items);
  closeModal();
  renderAll();
}
function deleteMaterial(id) {
  if (confirm("Удалить расходник?")) {
    setData(
      "materials",
      getData("materials").filter((x) => x.id !== id),
    );
    renderMaterials();
    renderDashboard();
  }
}
function deleteEquipment(id) {
  if (confirm("Удалить оборудование?")) {
    setData(
      "equipment",
      getData("equipment").filter((x) => x.id !== id),
    );
    renderEquipment();
    renderDashboard();
  }
}
function deleteShift(id) {
  if (confirm("Удалить смену?")) {
    setData(
      "shifts",
      getData("shifts").filter((x) => x.id !== id),
    );
    renderShifts();
    renderDashboard();
  }
}
function deleteEmployee(id) {
  if (confirm("Удалить сотрудника?")) {
    setData(
      "employees",
      getData("employees").filter((x) => x.id !== id),
    );
    renderEmployees();
    renderDashboard();
  }
}
function editMaterial(id) {
  openModal("material", id);
}
function editEquipment(id) {
  openModal("equipment", id);
}
function editShift(id) {
  openModal("shift", id);
}
function editEmployee(id) {
  openModal("employee", id);
}
renderAll();
