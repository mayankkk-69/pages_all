function initTable() {
    const refreshBtn = document.querySelector('.btn-icon[title="Refresh"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            icon.style.transition = 'transform 0.6s ease';
            icon.style.transform  = 'rotate(360deg)';
            setTimeout(() => {
                icon.style.transition = 'none';
                icon.style.transform  = 'rotate(0deg)';
            }, 620);
            
            // Actually fetch live records on clicking refresh
            fetchTableData();
        });
    }
    
    // Automatically perform initial data fetch on setup
    fetchTableData();
}

async function fetchTableData() {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;
    
    try {
        // Prevent browser caching using a timestamp so updates always show instantly
        const response = await fetch('api_overtime.php?v=' + Date.now(), { cache: "no-store" });
        const json = await response.json();
        
        if (json.status === 'success' && json.data.length > 0) {
            tbody.innerHTML = ''; // Wipe out "Empty state"
            
            let pendingRequests = 0;
            let approvedHours = 0;
            let rejectedRequests = 0;
            
            json.data.forEach(record => {
                const tr = document.createElement('tr');
                
                // Cleanly format SQL DATE string to readable format
                const fancyDate = new Date(record.submission_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric'});
                
                // Truncate SQL TIME seconds ("18:00:00" -> "18:00")
                const formatTime = (timeStr) => timeStr.substring(0, 5);
                
                // Determine Badge styling and accumulate calculated stats based on UI logic
                let badgeClass = 'badge-pending';
                let statusName = 'Pending';
                
                if (record.status === 'approved') { 
                    badgeClass = 'badge-approved'; 
                    statusName = 'Approved';
                    approvedHours += parseFloat(record.accepted_ot || record.calculated_ot);
                }
                else if (record.status === 'rejected') { 
                    badgeClass = 'badge-rejected'; 
                    statusName = 'Rejected';
                    rejectedRequests++;
                } 
                else {
                    pendingRequests++;
                }
                
                const displayAccepted = (record.accepted_ot !== null) ? record.accepted_ot : '-';

                // Construct Row
                tr.innerHTML = `
                    <td>${fancyDate}</td>
                    <td>${formatTime(record.end_time)}</td>
                    <td>${formatTime(record.punch_out_time)}</td>
                    <td style="font-weight: 600;">${record.calculated_ot}h</td>
                    <td style="color: ${record.status === 'approved' ? '#059669' : 'inherit'}; font-weight: 600;">${displayAccepted}${displayAccepted !== '-' ? 'h' : ''}</td>
                    <td><div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${record.work_report}</div></td>
                    <td><div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${record.overtime_report}</div></td>
                    <td><span class="badge ${badgeClass}">${statusName}</span></td>
                    <td>
                        <div class="action-icons">
                            <button class="icon-btn view-btn"><i class="ph ph-eye"></i></button>
                            ${record.status === 'pending' ? `<button class="icon-btn edit-btn"><i class="ph ph-pencil-simple"></i></button>
                            <button class="icon-btn delete-btn"><i class="ph ph-trash"></i></button>` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // INSTANT SYNC PREVIOUSLY STATIC TOP STAT CARDS USING THE DYNAMIC DB SUMMARY
            const pS = document.querySelector('.blue-card .stat-value'); 
            if(pS) { pS.dataset.value = pendingRequests; pS.textContent = pendingRequests; }
            
            const aS = document.querySelector('.green-card .stat-value'); 
            if(aS) { aS.dataset.value = approvedHours.toFixed(1); aS.textContent = approvedHours.toFixed(1); }
            
            const rS = document.querySelector('.red-card .stat-value'); 
            if(rS) { rS.dataset.value = rejectedRequests; rS.textContent = rejectedRequests; }

        } else if (json.status === 'error') {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-cell" style="padding:40px;"><div style="color:var(--text-muted);"><i>Database error: You need to run setup_database.php first!</i></div></td></tr>`;
        }
        
    } catch (err) {
        console.error("Could not fetch API successfully. Is MySQL offline?", err);
    }
}
