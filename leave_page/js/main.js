document.addEventListener("DOMContentLoaded", () => {

    // ─────────────────────────────────────────────
    // 3. Custom Dropdowns
    // ─────────────────────────────────────────────
    document.addEventListener('click', e => {
        const trigger = e.target.closest('.dropdown-trigger');
        const item = e.target.closest('.dropdown-item');

        if (trigger) {
            e.stopPropagation();
            const dd = trigger.closest('.custom-dropdown');
            document.querySelectorAll('.custom-dropdown').forEach(o => { if (o !== dd) o.classList.remove('open'); });
            dd.classList.toggle('open');
        } else if (item) {
            e.stopPropagation();
            const dd = item.closest('.custom-dropdown');
            const selectedSpan = dd.querySelector('.selected-value');

            selectedSpan.textContent = item.dataset.value;
            dd.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            dd.classList.remove('open');

            // Specific logic for the new balance year dropdown
            if (dd.id === 'balance-year-dropdown') {
                updateBalanceByYear(item.dataset.value);
            }

            // Recalculate duration if a dropdown in the dates table changes
            if (dd.closest('#generated-dates-body')) {
                if (dd.classList.contains('leave-type-dropdown')) {
                    const row = dd.closest('tr');
                    const dayTypeDd = row.querySelector('.day-type-dropdown');
                    const dayTypeSpan = dayTypeDd.querySelector('.selected-value');
                    const dayTypeMenu = dayTypeDd.querySelector('.dropdown-menu');
                    
                    if (item.dataset.value === 'Short Leave') {
                        const opts = ['Morning (09:00 - 10:30)', 'Evening (16:30 - 18:00)'];
                        dayTypeSpan.textContent = opts[0];
                        dayTypeMenu.innerHTML = opts.map(o => `<div class="dropdown-item ${o === opts[0] ? 'active' : ''}" data-value="${o}">${o}</div>`).join('');
                    } else if (item.dataset.value === 'Half Day Leave') {
                        const opts = ['First Half', 'Second Half'];
                        dayTypeSpan.textContent = opts[0];
                        dayTypeMenu.innerHTML = opts.map(o => `<div class="dropdown-item ${o === opts[0] ? 'active' : ''}" data-value="${o}">${o}</div>`).join('');
                    } else {
                        const opts = ['Full Day', 'First Half', 'Second Half'];
                        dayTypeSpan.textContent = opts[0];
                        dayTypeMenu.innerHTML = opts.map(o => `<div class="dropdown-item ${o === opts[0] ? 'active' : ''}" data-value="${o}">${o}</div>`).join('');
                    }
                }
                calculateDynamicDuration();
            }
        } else {
            document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
        }
    });

    const calculateDynamicDuration = () => {
        let total = 0;
        const rows = document.querySelectorAll('#generated-dates-body tr');
        rows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                // Determine Day Type from the second dropdown in the row
                const dropdowns = row.querySelectorAll('.custom-dropdown');
                if (dropdowns.length >= 2) {
                    const selectedValue = dropdowns[1].querySelector('.selected-value').textContent.trim();
                    if (selectedValue === 'Full Day') {
                        total += 1;
                    } else if (selectedValue === 'First Half' || selectedValue === 'Second Half') {
                        total += 0.5;
                    } else if (selectedValue.includes('Morning') || selectedValue.includes('Evening')) {
                        total += 1.5 / 9; // 1.5 hours out of a 9-hour working day
                    }
                }
            }
        });
        
        const totalMinutes = Math.round(total * 9 * 60);
        const days    = Math.floor(totalMinutes / (9 * 60));
        const hours   = Math.floor((totalMinutes % (9 * 60)) / 60);
        const minutes = totalMinutes % 60;

        const parts = [];
        if (days)    parts.push(`${days}d`);
        if (hours)   parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);

        const badge = document.querySelector('.duration-badge');
        badge.textContent   = parts.length ? parts.join(' ') : '0m';
        badge.dataset.raw   = total; // exact decimal-day value used for submission
    };

    const updateBalanceByYear = (year) => {
        // Simulating data filter logic based on the year selected
        const isCurrentYear = year === new Date().getFullYear().toString();
        document.querySelector('.balance-list li:nth-child(1) .bl-val').innerHTML = isCurrentYear ? '36 days' : '36 days';
        document.querySelector('.balance-list li:nth-child(2) .bl-val').innerHTML = isCurrentYear ? '12 days <span class="mini">0/2 used this month</span>' : '15 days <span class="mini">0/2 used logic</span>';
        document.querySelector('.balance-list li:nth-child(4) .bl-val').innerHTML = isCurrentYear ? '3 days' : '5 days';
        document.querySelector('.balance-list li:nth-child(8) .bl-val').innerHTML = isCurrentYear ? '1.37 days <div class="mini-prog"><div class="mini-prog-fill" style="width:25%"></div></div>' : '2.00 days <div class="mini-prog"><div class="mini-prog-fill" style="width:10%"></div></div>';
        document.querySelector('.balance-list li:nth-child(9) .bl-val').innerHTML = isCurrentYear ? '6 days' : '10 days';
    };

    // ─────────────────────────────────────────────
    // 4. Generate Date Rows
    // ─────────────────────────────────────────────
    const leaveTypes = [
        'Casual Leave', 'Short Leave', 'Sick Leave',
        'Emergency Leave', 'Unpaid Leave', 'Half Day Leave',
        'Back Office Leave', 'Compensate Leave'
    ];
    const dayTypes = ['Full Day', 'First Half', 'Second Half'];

    const mkSelect = (opts, cls) => {
        return `
            <div class="custom-dropdown ${cls}">
                <button class="dropdown-trigger" type="button" style="padding: 5px 8px; width: 100%; justify-content: space-between;">
                    <span class="selected-value" style="font-size: 0.79rem; margin-right: 8px;">${opts[0]}</span>
                    <svg class="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="dropdown-menu">
                    ${opts.map(o => `<div class="dropdown-item ${o === opts[0] ? 'active' : ''}" data-value="${o}">${o}</div>`).join('')}
                </div>
            </div>`;
    };

    document.querySelector('.js-generate-dates').addEventListener('click', () => {
        const from = document.getElementById('mrf_from_date').value;
        const to   = document.getElementById('mrf_to_date').value;

        if (!from || !to) { alert('Please select both From and To dates.'); return; }

        const start = new Date(from);
        const end   = new Date(to);
        if (start > end) { alert('From Date cannot be after To Date.'); return; }

        // List of 2026 holidays based on user input
        const holidays2026 = {
            '2026-01-01': 'New Year',
            '2026-01-26': 'Republic Day',
            '2026-02-15': 'Maha Shivaratri',
            '2026-03-04': 'Holi',
            '2026-03-26': 'Ram Navmi',
            '2026-08-15': 'Independence Day',
            '2026-08-28': 'Raksha Bandhan',
            '2026-09-04': 'Krishna Janmashtami',
            '2026-10-02': 'Gandhi Jayanti',
            '2026-10-20': 'Dussehra (Vijayadashami)',
            '2026-11-08': 'Diwali',
            '2026-11-09': 'Govardhan Puja',
            '2026-11-11': 'Bhai Dooj'
        };

        let rows = '', count = 0;
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            const dateStr  = dt.toISOString().split('T')[0];
            const dayBasicName  = dt.toLocaleDateString('en-US', { weekday: 'long' });
            const weekend  = dt.getDay() === 0 || dt.getDay() === 6;
            const holidayName = holidays2026[dateStr];
            
            const isOff = weekend || holidayName;
            
            // Format holiday name neatly or fallback to basic day name
            let displayDay = holidayName ? 
                `<span style="color:var(--red);font-weight:600;">${dayBasicName} · ${holidayName}</span>` : 
                dayBasicName;

            rows += `
                <tr ${isOff ? 'style="opacity:.6; background:#fffafa;"' : ''}>
                    <td><input type="checkbox" ${isOff ? '' : 'checked'}></td>
                    <td style="font-variant-numeric:tabular-nums;font-size:.83rem;">${dateStr}</td>
                    <td style="color:var(--text-secondary);font-size:.8rem;">${displayDay}</td>
                    <td>${mkSelect(leaveTypes, 'table-select leave-type-dropdown')}</td>
                    <td>${mkSelect(dayTypes,   'table-select day-type-dropdown')}</td>
                </tr>`;
            count++;
        }

        document.getElementById('generated-dates-body').innerHTML = rows;
        calculateDynamicDuration();
    });

    // Recalculate when checkboxes in the table are toggled manually
    document.getElementById('generated-dates-body').addEventListener('change', e => {
        if (e.target.type === 'checkbox') {
            calculateDynamicDuration();
        }
    });

    // Select-all
    document.getElementById('select-all-dates').addEventListener('change', function () {
        document.querySelectorAll('#generated-dates-body input[type="checkbox"]')
            .forEach(cb => cb.checked = this.checked);
        calculateDynamicDuration();
    });

    // Cancel
    document.getElementById('cancel-btn').addEventListener('click', () => {
        document.getElementById('application-form').reset();
        document.getElementById('generated-dates-body').innerHTML =
            `<tr><td colspan="5" class="empty-state">Select a date range and click <strong>Generate</strong></td></tr>`;
        const badge = document.querySelector('.duration-badge');
        badge.textContent = '0m';
        badge.dataset.raw = 0;
    });

    // ─────────────────────────────────────────────
    // 5. Fetch & Render History
    // ─────────────────────────────────────────────
    const statusConfig = {
        'Approved':        { cls: 'badge-green', label: 'Approved' },
        'Pending':         { cls: 'badge-gray',  label: 'Pending' },
        'Rejected':        { cls: 'badge-red',   label: 'Rejected' },
        'No Action Taken': { cls: 'badge-amber', label: 'No Action' },
    };

    const renderBadge = status => {
        const s = statusConfig[status] || { cls: 'badge-gray', label: status };
        return `<span class="badge ${s.cls}">${s.label}</span>`;
    };

    const fetchHistory = async () => {
        try {
            const res  = await fetch('api/api.php');
            const allData = await res.json();
            const tbody = document.getElementById('history-table-body');

            // Get selected filters
            const monthDropdown = document.querySelector('#month-dropdown .dropdown-item.active');
            const yearDropdown = document.querySelector('#year-dropdown .dropdown-item.active');
            const monthVal = monthDropdown ? monthDropdown.dataset.value : 'March';
            const yearVal = yearDropdown ? yearDropdown.dataset.value : new Date().getFullYear().toString();
            
            const months = { 'January':'01', 'February':'02', 'March':'03', 'April':'04', 'May':'05', 'June':'06', 'July':'07', 'August':'08', 'September':'09', 'October':'10', 'November':'11', 'December':'12' };
            const filterPrefix = `${yearVal}-${months[monthVal]}`;

            // Filter data for the table (by selected month & year)
            const data = allData.filter(item => item.date && item.date.startsWith(filterPrefix));

            // Filter data for the stats (by selected year only)
            const yearData = allData.filter(item => item.date && item.date.startsWith(yearVal));
            const total    = yearData.length;
            const approved = yearData.filter(d => d.status === 'Approved').length;
            const pending  = yearData.filter(d => d.status === 'Pending').length;

            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            // Original history-based status updates are commented out as the KPI cards were explicitly requested to display statically mapped balances instead of calculated history
            // setEl('stat-total',        `${total}`);
            // setEl('stat-approved',     `${approved}`);
            // setEl('stat-pending',      `${pending}`);
            // setEl('stat-approved-sub', `${approved} of ${total} requests`);
            // setEl('stat-pending-sub',  pending ? `${pending} require action` : 'All clear');

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No leave history found for this period.</td></tr>`;
                return;
            }

            window.leaveHistoryData = data; // Store data globally for modal access

            // Helper: convert decimal days into human-readable "X day Y hr Z min"
            const formatDuration = (val) => {
                const num = parseFloat(val);
                if (isNaN(num)) return val;

                const totalMinutes = Math.round(num * 9 * 60); // 9-hour workday → total minutes
                const days    = Math.floor(totalMinutes / (9 * 60));
                const hours   = Math.floor((totalMinutes % (9 * 60)) / 60);
                const minutes = totalMinutes % 60;

                const parts = [];
                if (days)    parts.push(`${days}d`);
                if (hours)   parts.push(`${hours}h`);
                if (minutes) parts.push(`${minutes}m`);

                return parts.length ? parts.join(' ') : '0m';
            };

            tbody.innerHTML = data.map((item, index) => {
                const isApproved = item.status === 'Approved';
                const disabledAttr = isApproved ? 'disabled' : '';
                return `
                <tr>
                    <td style="font-size:.82rem;font-variant-numeric:tabular-nums;">${item.date}</td>
                    <td><span class="badge badge-gray">${item.leaveType}</span></td>
                    <td style="font-weight:700;">${formatDuration(item.duration)}</td>
                    <td>${renderBadge(item.status)}</td>
                    <td>${renderBadge(item.managerStatus)}</td>
                    <td style="max-width:220px;color:var(--text-secondary);font-size:.82rem;">${item.reason}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn" title="View" onclick="openViewModal(${index})">👁️</button>
                            <button class="action-btn" title="Edit" onclick="openEditModal(${index})" ${disabledAttr}>✏️</button>
                            <button class="action-btn danger" title="Delete" onclick="openDeleteModal(${index})" ${disabledAttr}>🗑️</button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        } catch (e) {
            console.error('History error:', e);
        }
    };

    fetchHistory();
    document.getElementById('load-history-btn').addEventListener('click', fetchHistory);

    // ─────────────────────────────────────────────
    // 6. Form Submit
    // ─────────────────────────────────────────────
    document.getElementById('application-form').addEventListener('submit', async e => {
        e.preventDefault();

        const from     = document.getElementById('mrf_from_date').value;
        const to       = document.getElementById('mrf_to_date').value;
        const reason   = document.getElementById('reason').value;
        const approver = document.getElementById('mrf_approver').value;
        const badge    = document.querySelector('.duration-badge');
        const duration = parseFloat(badge.dataset.raw) || 0; // decimal days (e.g. 0.5 = half day)

        if (!from || !to || !reason) { alert('Please fill in all required fields.'); return; }

        const btn = document.getElementById('submit-btn');
        btn.textContent = 'Submitting…';
        btn.disabled = true;

        try {
            const res  = await fetch('api/api.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ from_date: from, to_date: to, reason, duration, leave_type: 'Casual Leave' })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message);
                document.getElementById('application-form').reset();
                document.getElementById('generated-dates-body').innerHTML =
                    `<tr><td colspan="5" class="empty-state">Select a date range and click <strong>Generate</strong></td></tr>`;
                const badge = document.querySelector('.duration-badge');
                badge.textContent = '0m';
                badge.dataset.raw = 0;
                fetchHistory();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred. Please try again.');
        } finally {
            btn.textContent = 'Submit Application →';
            btn.disabled = false;
        }
    });

    // ─────────────────────────────────────────────
    // 7. Modals
    // ─────────────────────────────────────────────
    window.closeModal = (id) => {
        document.getElementById(id).classList.remove('active');
    };

    window.openViewModal = (index) => {
        const item = window.leaveHistoryData[index];
        const content = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid var(--border-light); margin-bottom:5px;">
                    <div><strong style="color:var(--text-primary);">Date:</strong> <br>${item.date}</div>
                    <div><strong style="color:var(--text-primary);">Duration:</strong> <br>${item.duration}</div>
                    <div><strong style="color:var(--text-primary);">Type:</strong> <br><span class="badge badge-gray">${item.leaveType}</span></div>
                </div>
                <div style="display:flex; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid var(--border-light); margin-bottom:5px;">
                    <div><strong style="color:var(--text-primary);">Status:</strong> <br>${renderBadge(item.status)}</div>
                    <div><strong style="color:var(--text-primary);">Manager:</strong> <br>${renderBadge(item.managerStatus)}</div>
                </div>
                <div>
                    <strong style="color:var(--text-primary);">Reason:</strong> <br>
                    <p style="margin-top:4px; padding:10px; background:var(--bg); border-radius:var(--r-sm); border:1px solid var(--border);">${item.reason}</p>
                </div>
            </div>
        `;
        document.getElementById('view-modal-content').innerHTML = content;
        document.getElementById('view-modal').classList.add('active');
    };

    let editingIndex = null;
    window.openEditModal = (index) => {
        editingIndex = index;
        const item = window.leaveHistoryData[index];
        document.getElementById('edit_reason').value = item.reason || '';
        
        let fromDate = '', toDate = '';
        if(item.date) {
            const parts = item.date.split(' to ');
            fromDate = parts[0] || '';
            toDate = parts[1] || parts[0] || '';
        }
        document.getElementById('edit_from_date').value = fromDate;
        document.getElementById('edit_to_date').value = toDate;
        
        document.getElementById('edit-modal').classList.add('active');
    };

    window.saveEditLeave = async () => {
        if(editingIndex === null) return;
        const reason = document.getElementById('edit_reason').value;
        const fromDate = document.getElementById('edit_from_date').value;
        const toDate = document.getElementById('edit_to_date').value;
        if(!reason || !fromDate || !toDate) { alert('Please fill in all required fields.'); return; }
        
        try {
            const item = window.leaveHistoryData[editingIndex];
            const res = await fetch('api/api.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    reason: reason,
                    from_date: fromDate,
                    to_date: toDate
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchHistory(); 
                window.closeModal('edit-modal');
            } else {
                alert(data.message);
            }
        } catch(e) {
            console.error(e);
            alert('Error updating leave application.');
        }
    };

    let deletingIndex = null;
    window.openDeleteModal = (index) => {
        deletingIndex = index;
        document.getElementById('delete-modal').classList.add('active');
    };

    window.confirmDeleteLeave = async () => {
        if(deletingIndex === null) return;
        
        try {
            const item = window.leaveHistoryData[deletingIndex];
            const res = await fetch('api/api.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchHistory();
                window.closeModal('delete-modal');
            } else {
                alert(data.message);
            }
        } catch(e) {
            console.error(e);
            alert('Error deleting leave application.');
        }
    };

    // ─────────────────────────────────────────────
    // 8. Holidays Marquee Mouse Wheel Scroll
    // ─────────────────────────────────────────────
    const holidaysMarquee = document.querySelector('.holidays-marquee');
    if (holidaysMarquee) {
        holidaysMarquee.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                // Prevent vertical page scroll
                e.preventDefault();
                // Scroll horizontally instead
                holidaysMarquee.scrollLeft += e.deltaY;
            }
        }, { passive: false }); // explicit non-passive to allow preventDefault
    }

});
