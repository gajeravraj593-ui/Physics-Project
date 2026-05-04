document.addEventListener('DOMContentLoaded', () => {
    const currentUser = DB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    // Tab Navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const tabs = {
        'dashboard': document.getElementById('dashboardTab'),
        'food': document.getElementById('foodTab'),
        'laundry': document.getElementById('laundryTab'),
        'fees': document.getElementById('feesTab'),
        'complaints': document.getElementById('complaintsTab'),
        'notices': document.getElementById('noticesTab'),
        'attendance': document.getElementById('attendanceTab')
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            if (!tabId || !tabs[tabId]) return;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            Object.values(tabs).forEach(tab => tab.classList.add('hidden'));
            tabs[tabId].classList.remove('hidden');

            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('show');
            }

            // Load data for specific tabs
            if (tabId === 'dashboard') loadRequests();
            if (tabId === 'food') loadFoodMenu();
            if (tabId === 'laundry') loadLaundry();
            if (tabId === 'fees') loadFees();
            if (tabId === 'complaints') loadComplaints();
            if (tabId === 'notices') loadNotices();
            if (tabId === 'attendance') loadAttendance();
        });
    });

    // --- Gatepass Logic ---
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const outDateStr = document.getElementById('outDate').value;
            const inDateStr = document.getElementById('inDate').value;
            
            if (new Date(inDateStr) <= new Date(outDateStr)) {
                Utils.showToast('In Date must be after Out Date', 'error');
                return;
            }

            const newPass = {
                id: Utils.generateId(),
                studentId: currentUser.id,
                studentName: currentUser.name,
                room: currentUser.room,
                applyDate: new Date().toISOString(),
                outDate: outDateStr,
                inDate: inDateStr,
                destination: document.getElementById('destination').value,
                reason: document.getElementById('reason').value,
                status: 'pending',
                remarks: '',
                guardOutTime: null,
                guardInTime: null
            };

            DB.addPass(newPass);
            Utils.showToast('Gatepass request submitted!', 'success');
            applyForm.reset();
            document.getElementById('applyPassModal').classList.remove('show');
            loadRequests();
        });
    }

    function loadRequests() {
        const tbody = document.querySelector('#requestsTable tbody');
        const noDataMsg = document.getElementById('noRequestsMsg');
        const passes = DB.getPasses().filter(p => p.studentId === currentUser.id);

        tbody.innerHTML = '';
        if (passes.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('requestsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('requestsTable').style.display = 'table';
        passes.sort((a, b) => new Date(b.applyDate) - new Date(a.applyDate));

        passes.forEach(pass => {
            const tr = document.createElement('tr');
            let badgeClass = pass.status === 'approved' ? 'badge-approved' : (pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending');

            let actionBtn = `<button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="viewPassDetails('${pass.id}')">View</button>`;
            if (pass.status === 'approved') {
                actionBtn += ` <a href="gatepass.html?id=${pass.id}" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" target="_blank">Digital Pass</a>`;
            }

            tr.innerHTML = `
                <td>${Utils.formatDate(pass.applyDate)}</td>
                <td>${Utils.formatDate(pass.outDate)}</td>
                <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pass.reason}</td>
                <td><span class="badge ${badgeClass}">${pass.status}</span></td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.viewPassDetails = (id) => {
        const pass = DB.getPassById(id);
        if (!pass) return;
        const modalBody = document.getElementById('modalBody');
        let badgeClass = pass.status === 'approved' ? 'badge-approved' : (pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending');

        modalBody.innerHTML = `
            <div style="display:grid; gap: 1rem;">
                <div style="display:flex; justify-content: space-between;"><strong>Pass ID:</strong> <span>${pass.id}</span></div>
                <div style="display:flex; justify-content: space-between;"><strong>Status:</strong> <span class="badge ${badgeClass}">${pass.status}</span></div>
                <hr style="border-top: 1px solid var(--border-color);">
                <div style="display:flex; justify-content: space-between;"><strong>Out:</strong> <span>${Utils.formatDate(pass.outDate)}</span></div>
                <div style="display:flex; justify-content: space-between;"><strong>In:</strong> <span>${Utils.formatDate(pass.inDate)}</span></div>
                <div style="display:flex; justify-content: space-between;"><strong>Destination:</strong> <span>${pass.destination}</span></div>
                <div><strong style="display:block;">Reason:</strong><p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin-top:0.5rem;">${pass.reason}</p></div>
                ${pass.remarks ? `<div><strong style="display:block; color:var(--warning);">Warden Remarks:</strong><p style="background:var(--bg-main); padding:0.75rem; border-radius:var(--radius); margin-top:0.5rem;">${pass.remarks}</p></div>` : ''}
            </div>
        `;
        document.getElementById('passModal').classList.add('show');
    };

    // --- Laundry Logic ---
    function loadLaundry() {
        const tbody = document.querySelector('#laundryTable tbody');
        const laundry = DB.getLaundry().filter(l => l.studentId === currentUser.id);
        tbody.innerHTML = '';
        laundry.forEach(item => {
            const tr = document.createElement('tr');
            let badgeClass = item.status === 'Ready' || item.status === 'Delivered' ? 'badge-approved' : 'badge-pending';
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${Utils.formatDate(item.date)}</td>
                <td>${item.items}</td>
                <td>${item.weight}</td>
                <td><span class="badge ${badgeClass}">${item.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
        if (laundry.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No laundry history.</td></tr>';
        }
    }

    // --- Fees Logic ---
    function loadFees() {
        const allFees = DB.getFees();
        let myFees = allFees.find(f => f.studentId === currentUser.id);
        
        if (!myFees) {
            // Initialize mock fees if missing
            myFees = { studentId: currentUser.id, totalDue: 5000, paid: 0, history: [] };
            allFees.push(myFees);
            DB.saveFees(allFees);
        }

        const balance = myFees.totalDue - myFees.paid;
        document.getElementById('totalFeeDisplay').textContent = `₹${myFees.totalDue}`;
        document.getElementById('paidFeeDisplay').textContent = `₹${myFees.paid}`;
        document.getElementById('dueFeeDisplay').textContent = `₹${balance}`;

        const tbody = document.querySelector('#feeHistoryTable tbody');
        tbody.innerHTML = '';
        const history = [...myFees.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        history.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${Utils.formatDate(h.date)}</td><td>₹${h.amount}</td><td>${h.method}</td>`;
            tbody.appendChild(tr);
        });
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No payments made yet.</td></tr>';
        }
    }

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseInt(document.getElementById('payAmount').value, 10);
            const method = document.getElementById('payMethod').value;
            
            const allFees = DB.getFees();
            let myFees = allFees.find(f => f.studentId === currentUser.id);
            const balance = myFees.totalDue - myFees.paid;

            if (amount > balance) {
                Utils.showToast(`Cannot pay more than balance due (₹${balance})`, 'error');
                return;
            }

            DB.updateStudentFee(currentUser.id, amount, method);
            Utils.showToast('Payment successful!', 'success');
            paymentForm.reset();
            loadFees();
        });
    }

    // --- Complaints Logic ---
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newComplaint = {
                id: 'CMP-' + Math.floor(Math.random() * 100000),
                studentId: currentUser.id,
                studentName: currentUser.name,
                room: currentUser.room,
                date: new Date().toISOString(),
                type: document.getElementById('compType').value,
                title: document.getElementById('compTitle').value,
                description: document.getElementById('compDesc').value,
                status: 'Pending',
                remarks: ''
            };
            DB.addComplaint(newComplaint);
            Utils.showToast('Complaint submitted successfully.', 'success');
            complaintForm.reset();
            document.getElementById('complaintModal').classList.remove('show');
            loadComplaints();
        });
    }

    function loadComplaints() {
        const tbody = document.querySelector('#complaintsTable tbody');
        const noDataMsg = document.getElementById('noComplaintsMsg');
        const complaints = DB.getComplaints().filter(c => c.studentId === currentUser.id);

        tbody.innerHTML = '';
        if (complaints.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('complaintsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('complaintsTable').style.display = 'table';
        complaints.sort((a, b) => new Date(b.date) - new Date(a.date));

        complaints.forEach(cmp => {
            const tr = document.createElement('tr');
            let badgeClass = cmp.status === 'Resolved' ? 'badge-approved' : 'badge-pending';
            
            tr.innerHTML = `
                <td>${Utils.formatDate(cmp.date)}</td>
                <td><strong>${cmp.type}</strong></td>
                <td>${cmp.title}</td>
                <td><span class="badge ${badgeClass}">${cmp.status}</span></td>
                <td>${cmp.remarks || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- Food Menu Logic ---
    function loadFoodMenu() {
        const tbody = document.getElementById('foodMenuTableBody');
        if (!tbody) return;

        const menu = DB.getFoodMenu();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        tbody.innerHTML = '';
        days.forEach(day => {
            if (menu[day]) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-transform: capitalize;"><strong>${day}</strong></td>
                    <td>${menu[day].breakfast || '-'}</td>
                    <td>${menu[day].lunch || '-'}</td>
                    <td>${menu[day].dinner || '-'}</td>
                `;
                tbody.appendChild(tr);
            }
        });
    }

    // --- Notices Logic ---
    function loadNotices() {
        const container = document.getElementById('studentNoticesContainer');
        if (!container) return;

        const notices = DB.getNotices().sort((a,b) => new Date(b.date) - new Date(a.date));
        
        if (notices.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No notices posted yet.</div>';
            return;
        }

        container.innerHTML = notices.map(notice => `
            <div class="card" style="padding: 1rem;">
                <h3 style="margin-top: 0; margin-bottom: 0.5rem;">${notice.title}</h3>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${Utils.formatDate(notice.date)}</div>
                <p style="margin: 0; white-space: pre-wrap;">${notice.content}</p>
            </div>
        `).join('');
    }

    // --- Attendance Logic ---
    function loadAttendance() {
        const tbody = document.querySelector('#studentAttendanceTable tbody');
        if (!tbody) return;

        const allAttendance = DB.getAttendance().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = '';
        let hasRecords = false;

        allAttendance.forEach(record => {
            if (record.records.hasOwnProperty(currentUser.id)) {
                hasRecords = true;
                const isPresent = record.records[currentUser.id];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${Utils.formatDate(record.date)}</td>
                    <td><span class="badge ${isPresent ? 'badge-approved' : 'badge-rejected'}">${isPresent ? 'Present' : 'Absent'}</span></td>
                `;
                tbody.appendChild(tr);
            }
        });

        if (!hasRecords) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No attendance records found.</td></tr>';
        }
    }

    // --- Notifications Logic ---
    function loadNotifications() {
        const container = document.getElementById('notificationsContainer');
        const badge = document.getElementById('notifBadge');
        if (!container || !badge) return;

        const notifications = DB.getNotifications(currentUser.id);
        const unreadCount = notifications.filter(n => !n.read).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        if (notifications.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-secondary);">No notifications</div>';
            return;
        }

        container.innerHTML = notifications.map(n => `
            <div style="padding: 1rem; background: ${n.read ? 'var(--bg-main)' : 'rgba(79, 70, 229, 0.1)'}; border-radius: var(--radius); border-left: 3px solid ${n.read ? 'transparent' : 'var(--primary)'};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong style="display:block; margin-bottom:0.25rem;">${n.title}</strong>
                    ${!n.read ? `<button class="btn btn-outline" style="padding:0.1rem 0.3rem; font-size:0.6rem;" onclick="markNotificationRead('${n.id}')">Mark Read</button>` : ''}
                </div>
                <div style="font-size:0.875rem;">${n.message}</div>
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:0.5rem;">${Utils.formatDate(n.date)}</div>
            </div>
        `).join('');
    }

    window.markNotificationRead = (id) => {
        DB.markNotificationRead(id);
        loadNotifications();
    };

    // Initial load
    loadRequests();
    loadFoodMenu();
    loadNotifications();
});
