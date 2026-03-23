document.addEventListener("DOMContentLoaded", () => {
    const loadSection = async (containerId, filePath) => {
        try {
            const response = await fetch(filePath);
            if (response.ok) {
                const htmlCode = await response.text();
                document.getElementById(containerId).innerHTML = htmlCode;
            } else {
                console.error(`Error loading ${filePath}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Fetch error for ${filePath}:`, error);
        }
    };

    Promise.all([
        loadSection("header-container",  "sections/header.html"),
        loadSection("summary-container", "sections/summary.html"),
        loadSection("filter-container",  "sections/filter.html"),
        loadSection("table-container",   "sections/table.html"),
        loadSection("modals-container",  "sections/modals.html")
    ]).then(() => {
        initializeInteractions();
        initMonthPicker();
        initModals();
    });
});

/* ═══════════════════════════════════════════════
   DATA STORE
═══════════════════════════════════════════════ */
let tableData = [
    { id: "EXP-1042", date: "2026-03-18", purpose: "Client Summit",  from: "New York", to: "Boston",        mode: "Flight",   distance: "450 km", amount: "12500.00", status: "approved" },
    { id: "EXP-1043", date: "2026-03-15", purpose: "Site Visit",     from: "Office",   to: "Site A",        mode: "Cab",      distance: "45 km",  amount: "1200.00",  status: "pending"  },
    { id: "EXP-1044", date: "2026-03-10", purpose: "Vendor Meeting", from: "Delhi",    to: "Gurgaon",       mode: "Cab",      distance: "30 km",  amount: "800.00",   status: "rejected" },
    { id: "EXP-1045", date: "2026-02-28", purpose: "Team Offsite",   from: "Mumbai",   to: "Pune",          mode: "Train",    distance: "150 km", amount: "3000.00",  status: "paid"     },
    { id: "EXP-1046", date: "2026-03-05", purpose: "Conference",     from: "Chennai",  to: "Bangalore",     mode: "Flight",   distance: "350 km", amount: "8500.00",  status: "approved" },
    { id: "EXP-1047", date: "2026-01-12", purpose: "Training",       from: "Office",   to: "Training Ctr",  mode: "Own Car",  distance: "25 km",  amount: "450.00",   status: "paid"     }
];

// Tracks which row is being edited or deleted
let activeEditId   = null;
let activeDeleteId = null;

/* ═══════════════════════════════════════════════
   MONTH PICKER (Header badge)
═══════════════════════════════════════════════ */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
let pickerYear  = 2026;
let pickerMonth = "March"; // default

function initMonthPicker() {
    const badge = document.getElementById("month-badge");
    const dropdown = document.getElementById("month-dropdown");
    if (!badge || !dropdown) return;

    // Toggle open/close on badge click
    badge.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
        if (dropdown.classList.contains("open")) buildPickerUI();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && e.target !== badge) {
            dropdown.classList.remove("open");
        }
    });

    // Year nav
    document.getElementById("picker-year-prev").addEventListener("click", () => { pickerYear--; buildPickerUI(); });
    document.getElementById("picker-year-next").addEventListener("click", () => { pickerYear++; buildPickerUI(); });
}

function buildPickerUI() {
    const yearLabel = document.getElementById("picker-year-label");
    const grid      = document.getElementById("picker-months-grid");
    if (!yearLabel || !grid) return;

    yearLabel.textContent = pickerYear;
    grid.innerHTML = MONTHS.map(m => `
        <button class="month-item ${m === pickerMonth && pickerYear === 2026 ? 'active' : ''}" data-month="${m}">
            ${m.slice(0, 3)}
        </button>
    `).join("");

    // Month select
    grid.querySelectorAll(".month-item").forEach(btn => {
        btn.addEventListener("click", () => {
            pickerMonth = btn.dataset.month;
            // Update the badge label
            const badgeText = document.getElementById("badge-text");
            if (badgeText) badgeText.textContent = `Showing ${pickerMonth} ${pickerYear}`;
            // Sync the filter-month dropdown and apply
            const filterMonth = document.getElementById("filter-month");
            const cSelect = document.querySelector('.custom-select[data-target="filter-month"]');
            if (filterMonth) filterMonth.value = pickerMonth;
            if (cSelect) {
                cSelect.querySelector(".select-value").textContent = pickerMonth;
                cSelect.querySelectorAll(".select-item").forEach(i => i.classList.remove("active"));
                const activeM = cSelect.querySelector(`.select-item[data-value="${pickerMonth}"]`);
                if (activeM) activeM.classList.add("active");
            }
            
            document.getElementById("month-dropdown").classList.remove("open");
            applyFilters();
        });
    });
}

/* ═══════════════════════════════════════════════
   FILTER LOGIC
═══════════════════════════════════════════════ */
function initializeInteractions() {
    initCustomSelects(); // Initialize custom UI dropdowns
    applyFilters(); // Apply initial filter and KPIs
    const applyBtn = document.getElementById("btn-apply-filter");
    const resetBtn = document.getElementById("btn-reset-filter");
    if (applyBtn) applyBtn.addEventListener("click", applyFilters);
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);
}

function initCustomSelects() {
    if (window.customSelectsInitialized) return;
    window.customSelectsInitialized = true;

    document.addEventListener("click", (e) => {
        const trigger = e.target.closest(".select-trigger");
        if (trigger) {
            const select = trigger.closest(".custom-select");
            if (select.classList.contains("disabled")) return;
            document.querySelectorAll(".custom-select.open").forEach(other => {
                if (other !== select) other.classList.remove("open");
            });
            select.classList.toggle("open");
            return;
        }

        const item = e.target.closest(".select-item");
        if (item) {
            const select = item.closest(".custom-select");
            if (select && !select.classList.contains("disabled")) {
                let hiddenInput = null;
                if (select.dataset.target) {
                    hiddenInput = document.getElementById(select.dataset.target);
                } else {
                    hiddenInput = select.querySelector("input[type='hidden']");
                }
                const valueSpan = select.querySelector(".select-value");
                
                select.querySelectorAll(".select-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                
                if (hiddenInput) {
                    hiddenInput.value = item.dataset.value;
                    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (valueSpan) {
                    valueSpan.textContent = item.textContent;
                    valueSpan.style.color = item.dataset.value === "" ? "#94a3b8" : "inherit";
                }
                select.classList.remove("open");
            }
            return;
        }

        document.querySelectorAll(".custom-select.open").forEach(select => {
            select.classList.remove("open");
        });
    });
}

function updateSummaryStats() {
    const monthsMap = {
        "January":"01","February":"02","March":"03","April":"04",
        "May":"05","June":"06","July":"07","August":"08",
        "September":"09","October":"10","November":"11","December":"12"
    };
    
    // KPI is purely driven by the top-right pill (pickerYear/pickerMonth)
    const monthNum = monthsMap[pickerMonth];
    let stats = { count: 0, total: 0, approved: 0, paid: 0, pending: 0, rejected: 0 };
    
    tableData.forEach(item => {
        const itemYear = item.date.substring(0, 4);
        const itemMonth = item.date.substring(5, 7);
        if (itemYear === pickerYear.toString() && itemMonth === monthNum) {
            stats.count++;
            const amt = parseFloat(item.amount);
            stats.total += amt;
            if (item.status === 'approved') stats.approved += amt;
            else if (item.status === 'paid') stats.paid += amt;
            else if (item.status === 'pending') stats.pending += amt;
            else if (item.status === 'rejected') stats.rejected += amt;
        }
    });

    // Update DOM (use fallback "fmt" safely or format statically if needed)
    const safeFmt = (val) => "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const el = (id) => document.getElementById(id);
    
    if(el('summary-month-text')) el('summary-month-text').textContent = `${pickerMonth} ${pickerYear}`;
    if(el('stat-count'))    el('stat-count').textContent    = stats.count;
    if(el('stat-total'))    el('stat-total').textContent    = safeFmt(stats.total);
    if(el('stat-approved')) el('stat-approved').textContent = safeFmt(stats.approved);
    if(el('stat-paid'))     el('stat-paid').textContent     = safeFmt(stats.paid);
    if(el('stat-pending'))  el('stat-pending').textContent  = safeFmt(stats.pending);
    if(el('stat-rejected')) el('stat-rejected').textContent = safeFmt(stats.rejected);
}

function applyFilters() {
    const statusVal = (document.getElementById("filter-status")?.value || "").toLowerCase();
    const monthVal  = document.getElementById("filter-month")?.value || "";
    const dateFrom  = document.getElementById("filter-date-from")?.value || "";
    const dateTo    = document.getElementById("filter-date-to")?.value || "";

    const monthsMap = {
        "January":"01","February":"02","March":"03","April":"04",
        "May":"05","June":"06","July":"07","August":"08",
        "September":"09","October":"10","November":"11","December":"12"
    };

    const filtered = tableData.filter(item => {
        // Enforce the selected Year from the top-right header Pill
        if (pickerYear && item.date.substring(0, 4) !== pickerYear.toString()) return false;
        
        // Form field filters
        if (statusVal && statusVal !== "all statuses" && item.status !== statusVal) return false;
        if (monthVal) {
            const expected = monthsMap[monthVal];
            if (expected && item.date.substring(5, 7) !== expected) return false;
        }
        if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo   && new Date(item.date) > new Date(dateTo))   return false;
        return true;
    });

    renderTable(filtered);
    updateSummaryStats();
}

function resetFilters() {
    const s = document.getElementById("filter-status");
    const m = document.getElementById("filter-month");
    const f = document.getElementById("filter-date-from");
    const t = document.getElementById("filter-date-to");
    
    // Clear the specific filter fields dynamically
    if (s) {
        s.value = "";
        const cSelect = document.querySelector('.custom-select[data-target="filter-status"]');
        if (cSelect) {
            cSelect.querySelector('.select-value').textContent = "All Statuses";
            cSelect.querySelectorAll('.select-item').forEach(i => i.classList.remove("active"));
            const first = cSelect.querySelector('.select-item[data-value=""]');
            if (first) first.classList.add("active");
        }
    }
    
    if (m) {
        m.value = pickerMonth; // Sync to active header month
        const cSelect = document.querySelector('.custom-select[data-target="filter-month"]');
        if (cSelect) {
            cSelect.querySelector('.select-value').textContent = pickerMonth;
            cSelect.querySelectorAll('.select-item').forEach(i => i.classList.remove("active"));
            const activeM = cSelect.querySelector(`.select-item[data-value="${pickerMonth}"]`);
            if (activeM) activeM.classList.add("active");
        }
    }
    
    if (f) f.value = "";
    if (t) t.value = "";
    
    // Auto-apply the default filter state
    applyFilters();
}

/* ═══════════════════════════════════════════════
   TABLE RENDERER
═══════════════════════════════════════════════ */
function fmt(amount) {
    return "₹" + parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function renderTable(dataArray) {
    const tbody = document.getElementById("expense-table-body");
    if (!tbody) return;

    if (dataArray.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="10" style="padding:0;">
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fa-solid fa-car-side"></i></div>
                    <div class="empty-state-title">No travel expenses found</div>
                    <div class="empty-state-text">No records match your selected filters.</div>
                </div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = dataArray.map(item => {
        const badgeClass = `badge badge-${item.status}`;
        const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
        return `
            <tr>
                <td><strong>${item.id}</strong></td>
                <td>${item.date}</td>
                <td>${item.purpose}</td>
                <td>${item.from}</td>
                <td>${item.to}</td>
                <td>${item.mode}</td>
                <td>${item.distance}</td>
                <td><strong>${fmt(item.amount)}</strong></td>
                <td><span class="${badgeClass}">${statusText}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn-custom view" title="View"   data-id="${item.id}"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn-custom edit" title="Edit"   data-id="${item.id}"><i class="fa-solid fa-pen" style="color:#ff8b45;"></i></button>
                        <button class="action-btn-custom del"  title="Delete" data-id="${item.id}"><i class="fa-solid fa-trash-can" style="color:#aba2c5;"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join("");

    // Attach row-level action events
    tbody.querySelectorAll(".action-btn-custom.view").forEach(b => b.addEventListener("click", () => openViewModal(b.dataset.id)));
    tbody.querySelectorAll(".action-btn-custom.edit").forEach(b => b.addEventListener("click", () => openEditModal(b.dataset.id)));
    tbody.querySelectorAll(".action-btn-custom.del") .forEach(b => b.addEventListener("click", () => openDeleteModal(b.dataset.id)));
}

/* ═══════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════ */
// Temp list of expenses staged in the add modal
let stagedExpenses = [];

function initModals() {
    // ── View modal close
    ["view-modal-close", "view-modal-close-btn"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => closeModal("view-modal"));
    });

    // ── Edit modal close / save
    ["edit-modal-close", "edit-modal-cancel"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => closeModal("edit-modal"));
    });
    document.getElementById("edit-modal-save")?.addEventListener("click", saveEdit);

    // ── Delete modal close / confirm
    ["delete-modal-close", "delete-modal-cancel"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => closeModal("delete-modal"));
    });
    document.getElementById("delete-modal-confirm")?.addEventListener("click", confirmDelete);

    // ── Add Expense modal
    const addBtn = document.getElementById("btn-add-expense");
    if (addBtn) addBtn.addEventListener("click", openAddExpenseModal);

    ["add-modal-close", "add-modal-close-btn"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => closeModal("add-expense-modal"));
    });

    document.getElementById("btn-add-to-list")?.addEventListener("click", stageExpense);
    document.getElementById("btn-save-all-expenses")?.addEventListener("click", saveAllExpenses);

    // File pickers — show file name + green state (Event Delegation)
    const formsContainer = document.getElementById("expense-forms-container");
    if (formsContainer) {
        formsContainer.addEventListener("change", e => {
            if (e.target.classList.contains("e-mode")) {
                const form = e.target.closest(".expense-entry-form");
                const mode = e.target.value;
                // If Car or Bike or empty, show meters, else show bill
                const isMeterMode = (mode === 'Car' || mode === 'Bike' || mode === '');
                form.querySelectorAll(".meter-photo-field").forEach(el => el.style.display = isMeterMode ? "flex" : "none");
                form.querySelectorAll(".bill-photo-field").forEach(el => el.style.display = isMeterMode ? "none" : "flex");
            }
            if (e.target.classList.contains("e-meter-start-input")) {
                const name = e.target.files[0]?.name || "Choose file…";
                const form = e.target.closest(".expense-entry-form");
                form.querySelector(".e-meter-start-name").textContent = name;
                form.querySelector(".e-meter-start-lbl").classList.toggle("has-file", !!e.target.files[0]);
            }
            if (e.target.classList.contains("e-meter-end-input")) {
                const name = e.target.files[0]?.name || "Choose file…";
                const form = e.target.closest(".expense-entry-form");
                form.querySelector(".e-meter-end-name").textContent = name;
                form.querySelector(".e-meter-end-lbl").classList.toggle("has-file", !!e.target.files[0]);
            }
            if (e.target.classList.contains("e-bill-input")) {
                const name = e.target.files[0]?.name || "Choose file…";
                const form = e.target.closest(".expense-entry-form");
                form.querySelector(".e-bill-name").textContent = name;
                form.querySelector(".e-bill-lbl").classList.toggle("has-file", !!e.target.files[0]);
            }
        });

        // Delegate remove expense handling
        formsContainer.addEventListener("click", e => {
            const btn = e.target.closest(".remove-expense-btn");
            if (btn) {
                const form = btn.closest(".expense-entry-form");
                form.remove();
                updateExpenseHeaders();
            }
        });
    }

    // Close on backdrop click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", e => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
}

function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

// ── VIEW
function openViewModal(id) {
    const item = tableData.find(r => r.id === id);
    if (!item) return;
    const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    
    // Format date roughly like '3/6/2026'
    let dateStr = item.date;
    try {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
            dateStr = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
        }
    } catch(e){}

    const isAppr = item.status === 'approved';
    const mainIcon = isAppr ? 'circle-check' : (item.status === 'rejected' ? 'circle-xmark' : 'hourglass-half');
    const bgCol = isAppr ? '#10b981' : (item.status === 'rejected' ? '#ef4444' : '#f59e0b');

    // Number part of ID
    const numId = item.id.replace('EXP-', '');

    document.getElementById("view-modal-dynamic-content").innerHTML = `
        <!-- Premium Dark Header -->
        <div class="vm-premium-header">
            <div class="vm-header-left">
                <div class="vm-icon-box"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                <div>
                    <h2>Expense #${numId}</h2>
                    <p>${item.purpose}</p>
                </div>
            </div>
            <div class="vm-header-right">
                <div class="vm-status-badge" style="background: ${bgCol};">
                    <i class="fa-solid fa-${mainIcon}"></i> ${statusText}
                </div>
                <button class="vm-close-btn" id="view-modal-close-new"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>

        <!-- Scrollable content on soft background -->
        <div class="vm-premium-body">
            
            <!-- Quick Stats Row -->
            <div class="vm-stats-row">
                <div class="vm-stat-card">
                    <div class="vm-stat-icon" style="background:#dbeafe;color:#3b82f6;"><i class="fa-solid fa-car"></i></div>
                    <div class="vm-stat-info">
                        <label>Transport</label>
                        <span>${item.mode}</span>
                    </div>
                </div>
                <div class="vm-stat-card">
                    <div class="vm-stat-icon" style="background:#f3e8ff;color:#a855f7;"><i class="fa-solid fa-route"></i></div>
                    <div class="vm-stat-info">
                        <label>Distance</label>
                        <span>${item.distance}</span>
                    </div>
                </div>
                <div class="vm-stat-card vm-stat-amount">
                    <div class="vm-stat-icon" style="background:#dcfce7;color:#22c55e;"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                    <div class="vm-stat-info">
                        <label>Total Amount</label>
                        <span class="vm-amount-val">₹${parseFloat(item.amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- Two Column Layout -->
            <div class="vm-two-col">
                <!-- Left: Trip Details -->
                <div class="vm-card">
                    <div class="vm-card-header">
                        <i class="fa-solid fa-map-location-dot"></i> Trip Details
                    </div>
                    <div class="vm-card-body">
                        <div class="vm-detail-row">
                            <span class="vm-lbl">Date</span>
                            <span class="vm-val">${dateStr}</span>
                        </div>
                        <div class="vm-detail-row">
                            <span class="vm-lbl">From</span>
                            <span class="vm-val"><strong>${item.from}</strong></span>
                        </div>
                        <div class="vm-detail-row">
                            <span class="vm-lbl">To</span>
                            <span class="vm-val"><strong>${item.to}</strong></span>
                        </div>
                        <div class="vm-detail-row" style="border:none;">
                            <span class="vm-lbl">Created On</span>
                            <span class="vm-val" style="color:#64748b;">${dateStr}</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Approval Workflow -->
                <div class="vm-card">
                    <div class="vm-card-header">
                        <i class="fa-solid fa-list-check"></i> Approval Workflow
                    </div>
                    <div class="vm-card-body">
                        <div class="vm-workflow-step">
                            <i class="fa-solid fa-user-tie step-icon"></i>
                            <div class="step-info">Manager</div>
                            <div class="step-status" style="background:${bgCol}"><i class="fa-solid fa-${mainIcon}"></i> ${statusText}</div>
                        </div>
                        <div class="vm-workflow-step">
                            <i class="fa-solid fa-file-invoice step-icon"></i>
                            <div class="step-info">Accountant</div>
                            <div class="step-status" style="background:${bgCol}"><i class="fa-solid fa-${mainIcon}"></i> ${statusText}</div>
                        </div>
                        <div class="vm-workflow-step" style="border:none;">
                            <i class="fa-solid fa-users-gear step-icon"></i>
                            <div class="step-info">HR Dept</div>
                            <div class="step-status" style="background:${bgCol}"><i class="fa-solid fa-${mainIcon}"></i> ${statusText}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Attachments -->
            <div class="vm-card" style="margin-bottom:0;">
                <div class="vm-card-header">
                    <i class="fa-solid fa-paperclip"></i> Attachments
                </div>
                <div class="vm-card-body" style="padding:16px;">
                    <div class="vm-attachment-box">
                        <div class="vm-attach-preview"><i class="fa-regular fa-image"></i></div>
                        <div class="vm-attach-info">
                            <span class="vm-file-name">receipt_${numId}.jpg</span>
                            <span class="vm-file-size">1.2 MB</span>
                        </div>
                        <button class="vm-btn-view"><i class="fa-solid fa-download"></i></button>
                    </div>
                </div>
            </div>

        </div>
        
        <!-- Footer -->
        <div class="vm-premium-footer">
            <button class="btn btn-ghost" id="view-modal-close-footer">Close</button>
            <button class="btn btn-blue" id="view-modal-print"><i class="fa-solid fa-print"></i> Print Details</button>
        </div>
    `;
    
    // Add event listeners for the new close buttons
    document.getElementById("view-modal-close-new")?.addEventListener("click", () => closeModal("view-modal"));
    document.getElementById("view-modal-close-footer")?.addEventListener("click", () => closeModal("view-modal"));
    document.getElementById("view-modal-print")?.addEventListener("click", () => window.print());

    openModal("view-modal");
}

// ── EDIT
function openEditModal(id) {
    const item = tableData.find(r => r.id === id);
    if (!item) return;
    activeEditId = id;
    
    // Number part of ID
    const numId = item.id.replace('EXP-', '');

    document.getElementById("edit-modal-dynamic-content").innerHTML = `
        <!-- Premium Dark Header -->
        <div class="vm-premium-header">
            <div class="vm-header-left">
                <div class="vm-icon-box" style="color:#f97316;"><i class="fa-solid fa-pen-to-square"></i></div>
                <div>
                    <h2>Edit Expense #${numId}</h2>
                    <p>Update expense details</p>
                </div>
            </div>
            <div class="vm-header-right">
                <button class="vm-close-btn" id="edit-modal-close-new"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>

        <!-- Scrollable content on soft background -->
        <div class="vm-premium-body">
            
            <div class="vm-card" style="margin-bottom:24px;">
                <div class="vm-card-header">
                    <i class="fa-solid fa-money-check-pen"></i> General Details
                </div>
                <div class="vm-card-body" style="padding: 18px;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>Date</label>
                            <input type="date" id="edit-date" value="${item.date}">
                        </div>
                        <div class="edit-field">
                            <label>Purpose</label>
                            <input type="text" id="edit-purpose" value="${item.purpose}">
                        </div>
                    </div>
                </div>
            </div>

            <div class="vm-card" style="margin-bottom:24px;">
                <div class="vm-card-header">
                    <i class="fa-solid fa-route"></i> Travel Information
                </div>
                <div class="vm-card-body" style="padding: 18px;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>From</label>
                            <input type="text" id="edit-from" value="${item.from}">
                        </div>
                        <div class="edit-field">
                            <label>To</label>
                            <input type="text" id="edit-to" value="${item.to}">
                        </div>
                        <div class="edit-field">
                            <label>Mode</label>
                            <div class="custom-select" tabindex="0">
                                <div class="select-trigger add-input" style="justify-content: space-between; display: flex;">
                                    <span class="select-value">${item.mode || 'Select mode'}</span>
                                    <i class="fa-solid fa-chevron-down" style="color:#cbd5e1;font-size:11px;"></i>
                                </div>
                                <div class="select-dropdown" style="z-index: 100;">
                                    <div class="select-item ${item.mode === 'Flight' ? 'active' : ''}" data-value="Flight">Flight</div>
                                    <div class="select-item ${item.mode === 'Train' ? 'active' : ''}" data-value="Train">Train</div>
                                    <div class="select-item ${item.mode === 'Cab' ? 'active' : ''}" data-value="Cab">Cab</div>
                                    <div class="select-item ${item.mode === 'Own Car' ? 'active' : ''}" data-value="Own Car">Own Car</div>
                                    <div class="select-item ${item.mode === 'Bus' ? 'active' : ''}" data-value="Bus">Bus</div>
                                    <div class="select-item ${item.mode === 'Taxi' ? 'active' : ''}" data-value="Taxi">Taxi</div>
                                    <div class="select-item ${item.mode === 'Other' ? 'active' : ''}" data-value="Other">Other</div>
                                </div>
                                <input type="hidden" id="edit-mode" value="${item.mode}">
                            </div>
                        </div>
                        <div class="edit-field">
                            <label>Distance</label>
                            <input type="text" id="edit-distance" value="${item.distance}">
                        </div>
                    </div>
                </div>
            </div>

            <div class="vm-card" style="margin-bottom:24px;">
                <div class="vm-card-header">
                    <i class="fa-solid fa-indian-rupee-sign"></i> Status & Amount
                </div>
                <div class="vm-card-body" style="padding: 18px;">
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>Amount (₹)</label>
                            <input type="text" id="edit-amount" value="${parseFloat(item.amount).toFixed(2)}">
                        </div>
                        <div class="edit-field">
                            <label>Status <i class="fa-solid fa-lock" style="font-size:10px;color:#94a3b8;margin-left:4px;" title="Only HR/Managers can change status"></i></label>
                            <div class="custom-select disabled" tabindex="-1" style="opacity: 0.8; cursor: not-allowed;" title="Status updates are managed by HR/Managers">
                                <div class="select-trigger add-input" style="justify-content: space-between; display: flex; background: #f8fafc;">
                                    <span class="select-value">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                                    <i class="fa-solid fa-chevron-down" style="color:#cbd5e1;font-size:11px;"></i>
                                </div>
                                <input type="hidden" id="edit-status" value="${item.status}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="vm-card" style="margin-bottom:0px;">
                <div class="vm-card-header">
                    <i class="fa-solid fa-paperclip"></i> Update Attachments
                </div>
                <div class="vm-card-body" style="padding: 18px;">
                    <div class="edit-field">
                        <label>Upload New Receipt or Meter Photo</label>
                        <label class="file-drop-zone edit-file-lbl">
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <span class="edit-file-name">receipt_${numId}.jpg uploaded. Click to change…</span>
                            <input type="file" id="edit-attachment" accept="image/*,.pdf" style="display:none;">
                        </label>
                    </div>
                </div>
            </div>

        </div>
        
        <!-- Footer -->
        <div class="vm-premium-footer">
            <button class="btn btn-ghost" id="edit-modal-cancel-new">Cancel</button>
            <button class="btn btn-orange" id="edit-modal-save-new"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
        </div>
    `;

    // Reattach listeners to newly created buttons
    document.getElementById("edit-modal-close-new")?.addEventListener("click", () => closeModal("edit-modal"));
    document.getElementById("edit-modal-cancel-new")?.addEventListener("click", () => closeModal("edit-modal"));
    document.getElementById("edit-modal-save-new")?.addEventListener("click", saveEdit);

    // Attachment field listener
    const editAttachment = document.getElementById("edit-attachment");
    if (editAttachment) {
        editAttachment.addEventListener("change", (e) => {
            const name = e.target.files[0]?.name || `receipt_${numId}.jpg uploaded. Click to change…`;
            const lbl = document.querySelector(".edit-file-lbl");
            document.querySelector(".edit-file-name").textContent = name;
            if (e.target.files && e.target.files.length > 0) {
                lbl.classList.add("has-file");
                lbl.querySelector("i").className = "fa-solid fa-check";
            } else {
                lbl.classList.remove("has-file");
                lbl.querySelector("i").className = "fa-solid fa-cloud-arrow-up";
            }
        });
    }

    openModal("edit-modal");
}

function saveEdit() {
    const idx = tableData.findIndex(r => r.id === activeEditId);
    if (idx === -1) return;
    tableData[idx] = {
        ...tableData[idx],
        date:     document.getElementById("edit-date").value,
        purpose:  document.getElementById("edit-purpose").value,
        from:     document.getElementById("edit-from").value,
        to:       document.getElementById("edit-to").value,
        mode:     document.getElementById("edit-mode").value,
        distance: document.getElementById("edit-distance").value,
        amount:   document.getElementById("edit-amount").value,
        status:   document.getElementById("edit-status").value,
    };
    closeModal("edit-modal");
    applyFilters();
    activeEditId = null;
}

// ── DELETE
function openDeleteModal(id) {
    const item = tableData.find(r => r.id === id);
    if (!item) return;
    activeDeleteId = id;
    document.getElementById("delete-modal-msg").textContent =
        `You are about to delete "${item.purpose}" (${item.id}). This action cannot be undone.`;
    openModal("delete-modal");
}

function confirmDelete() {
    tableData = tableData.filter(r => r.id !== activeDeleteId);
    closeModal("delete-modal");
    applyFilters();
    activeDeleteId = null;
}

/* ═══════════════════════════════════════════════
   ADD EXPENSE MODAL LOGIC (DYNAMIC FORMS)
═══════════════════════════════════════════════ */
function openAddExpenseModal() {
    const container = document.getElementById("expense-forms-container");
    if (!container) return;

    // Keep only the first form, clear it
    const forms = container.querySelectorAll(".expense-entry-form");
    forms.forEach((val, idx) => {
        if (idx !== 0) val.remove();
    });

    const firstForm = container.querySelector(".expense-entry-form");
    if (firstForm) {
        firstForm.querySelectorAll(".add-input, .e-mode").forEach(el => {
            if (el.tagName !== "DIV") el.value = "";
            el.style.borderColor = "";
            el.style.boxShadow = "";
        });
        firstForm.querySelectorAll('.custom-select').forEach(sel => {
            const defItem = sel.querySelector('.select-item[data-value=""]');
            const valSpan = sel.querySelector('.select-value');
            if (defItem && valSpan) {
                valSpan.textContent = defItem.textContent;
                valSpan.style.color = "#94a3b8";
            }
            sel.querySelectorAll('.select-item').forEach(i => i.classList.remove('active'));
            if (defItem) defItem.classList.add('active');
        });
        firstForm.querySelectorAll(".e-meter-start-input, .e-meter-end-input, .e-bill-input").forEach(el => el.value = "");
        firstForm.querySelectorAll(".e-meter-start-name, .e-meter-end-name, .e-bill-name").forEach(el => el.textContent = "Choose file…");
        firstForm.querySelectorAll(".file-drop-zone").forEach(el => el.classList.remove("has-file"));
        firstForm.querySelectorAll(".meter-photo-field").forEach(el => el.style.display = "flex");
        firstForm.querySelectorAll(".bill-photo-field").forEach(el => el.style.display = "none");
        
        // Ensure no remove button on first form
        const rm = firstForm.querySelector(".remove-expense-btn");
        if (rm) rm.remove();

        const today = new Date().toISOString().split("T")[0];
        const dateInput = firstForm.querySelector(".e-date");
        if (dateInput) dateInput.value = today;
    }

    updateExpenseHeaders();
    openModal("add-expense-modal");
}

function updateExpenseHeaders() {
    const forms = document.querySelectorAll("#expense-forms-container .expense-entry-form");
    forms.forEach((form, idx) => {
        form.dataset.index = idx + 1;
        const headerTitle = form.querySelector("h4");
        if (headerTitle) headerTitle.innerHTML = `Expense #${idx + 1}`;
    });
}

// Orange button: add a new cloned form below the current ones
function stageExpense() {
    const container = document.getElementById("expense-forms-container");
    if (!container) return;

    const forms = container.querySelectorAll(".expense-entry-form");
    const lastForm = forms[forms.length - 1];

    if (!lastForm) return;

    // Validate the last form before letting them add a new one
    if (!validateForm(lastForm)) {
        shakeModal("add-expense-modal");
        return;
    }

    const newForm = lastForm.cloneNode(true);
    
    // Clear the cloned fields (except date maybe)
    const today = new Date().toISOString().split("T")[0];
    newForm.querySelectorAll(".add-input, .e-mode").forEach(el => {
        if (el.tagName !== "DIV") {
            if (!el.classList.contains("e-date")) el.value = "";
            else el.value = today;
        }
        el.style.borderColor = "";
        el.style.boxShadow = "";
    });
    newForm.querySelectorAll('.custom-select').forEach(sel => {
        const defItem = sel.querySelector('.select-item[data-value=""]');
        const valSpan = sel.querySelector('.select-value');
        if (defItem && valSpan) {
            valSpan.textContent = defItem.textContent;
            valSpan.style.color = "#94a3b8";
        }
        sel.querySelectorAll('.select-item').forEach(i => i.classList.remove('active'));
        if (defItem) defItem.classList.add('active');
    });

    // Reset file pickers
    newForm.querySelectorAll(".e-meter-start-input, .e-meter-end-input, .e-bill-input").forEach(el => el.value = "");
    newForm.querySelectorAll(".e-meter-start-name, .e-meter-end-name, .e-bill-name").forEach(el => el.textContent = "Choose file…");
    newForm.querySelectorAll(".file-drop-zone").forEach(el => el.classList.remove("has-file"));
    
    // Default visibility for cloned forms
    newForm.querySelectorAll(".meter-photo-field").forEach(el => el.style.display = "flex");
    newForm.querySelectorAll(".bill-photo-field").forEach(el => el.style.display = "none");

    // Add remove button if it doesn't exist (since it's not the 1st one)
    let header = newForm.querySelector(".expense-entry-header");
    if (header && !header.querySelector(".remove-expense-btn")) {
        header.innerHTML += `<button class="remove-expense-btn" title="Remove Entry"><i class="fa-solid fa-trash-can"></i></button>`;
    }

    container.appendChild(newForm);
    updateExpenseHeaders();

    // Scroll to the new form smoothly
    setTimeout(() => {
        newForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
}

// Read and validate a specific form element
function readFormEntryElement(form) {
    const date     = form.querySelector(".e-date")?.value.trim()     || "";
    const purpose  = form.querySelector(".e-purpose")?.value.trim()  || "";
    const from     = form.querySelector(".e-from")?.value.trim()     || "";
    const to       = form.querySelector(".e-to")?.value.trim()       || "";
    const mode     = form.querySelector(".e-mode")?.value            || "";
    const distance = form.querySelector(".e-distance")?.value.trim() || "";
    const amount   = form.querySelector(".e-amount")?.value.trim()   || "";

    if (!date || !purpose || !from || !to || !mode || !distance || !amount) return null;

    return {
        id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
        date, purpose, from, to, mode,
        distance: `${distance} km`,
        amount,
        status: "pending"
    };
}

function validateForm(form) {
    let valid = true;
    const required = [".e-date", ".e-purpose", ".e-from", ".e-to", ".e-mode", ".e-distance", ".e-amount"];
    
    required.forEach(cls => {
        const el = form.querySelector(cls);
        if (!el) return;
        if (!el.value.trim()) {
            valid = false;
            el.style.borderColor = "#f87171";
            el.style.boxShadow   = "0 0 0 3px rgba(248,113,113,0.15)";
            el.addEventListener("input", () => {
                el.style.borderColor = "";
                el.style.boxShadow   = "";
            }, { once: true });
        }
    });
    return valid;
}

// Green button: parse all forms, if valid save to main table
function saveAllExpenses() {
    const container = document.getElementById("expense-forms-container");
    const forms = container.querySelectorAll(".expense-entry-form");
    
    let allValid = true;
    let newEntries = [];

    forms.forEach(form => {
        const isValid = validateForm(form);
        if (!isValid) allValid = false;
        else {
            const entry = readFormEntryElement(form);
            if (entry) newEntries.push(entry);
        }
    });

    if (!allValid || newEntries.length === 0) {
        shakeModal("add-expense-modal");
        return;
    }

    // Push all into main table data
    newEntries.forEach(item => tableData.push(item));

    closeModal("add-expense-modal");
    applyFilters();

    // Brief toast-style confirmation count
    const saved = newEntries.length;
    showToast(`${saved} expense${saved > 1 ? 's' : ''} saved successfully!`);
}

// Minimal toast notification
function showToast(message) {
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.style.cssText = `
            position:fixed; bottom:28px; right:28px; z-index:9999;
            background:#1e293b; color:#fff;
            padding:13px 20px; border-radius:10px;
            font-family:var(--font); font-size:13.5px; font-weight:500;
            box-shadow:0 8px 24px rgba(0,0,0,0.25);
            display:flex; align-items:center; gap:10px;
            animation: slideUp 0.25s ease;
            transition: opacity 0.3s;`;
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#4ade80;"></i> ${message}`;
    toast.style.opacity = "1";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

// Subtle shake animation if validation fails
function shakeModal(overlayId) {
    const box = document.querySelector(`#${overlayId} .modal-box, #${overlayId} .add-expense-box`);
    if (!box) return;
    box.style.animation = "none";
    box.offsetHeight; // reflow
    box.style.animation = "shake 0.4s ease";
}

// Inject shake keyframe if not present
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
@keyframes shake {
  0%,100%{ transform: translateX(0); }
  20%{ transform: translateX(-8px); }
  40%{ transform: translateX(8px); }
  60%{ transform: translateX(-6px); }
  80%{ transform: translateX(4px); }
}`;
document.head.appendChild(shakeStyle);

