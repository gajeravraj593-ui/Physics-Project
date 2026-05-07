document.addEventListener('DOMContentLoaded', () => {
    const currentUser = DB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'guard') return;

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const tabs = {
        'verify': document.getElementById('verifyTab'),
        'visitors': document.getElementById('visitorsTab'),
        'parcels': document.getElementById('parcelsTab'),
        'lostfound': document.getElementById('lostfoundTab')
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            if (!tabId) return;

            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show target tab, hide others
            Object.values(tabs).forEach(tab => tab.classList.add('hidden'));
            tabs[tabId].classList.remove('hidden');

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }

            if (tabId === 'visitors') renderVisitors();
            if (tabId === 'parcels') renderParcels();
            if (tabId === 'lostfound') renderLostFound();
        });
    });

    // Verification Logic
    const verifyForm = document.getElementById('verifyForm');
    const verifyResult = document.getElementById('verifyResult');

    let currentPass = null;

    if (verifyForm) {
        verifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const passId = document.getElementById('passIdInput').value.trim().toUpperCase();
            
            const pass = DB.getPassById(passId);

            if (!pass) {
                Utils.showToast('Invalid Pass ID. No record found.', 'error');
                verifyResult.classList.add('hidden');
                return;
            }

            currentPass = pass;
            renderVerificationCard(pass);
        });
    }

    // --- QR Scanner Logic ---
    let html5QrcodeScanner = null;
    let isScanning = false;
    const toggleScannerBtn = document.getElementById('toggleScannerBtn');
    const qrReaderDiv = document.getElementById('qr-reader');

    if (toggleScannerBtn && typeof Html5QrcodeScanner !== 'undefined') {
        toggleScannerBtn.addEventListener('click', () => {
            if (isScanning) {
                if (html5QrcodeScanner) {
                    html5QrcodeScanner.clear().then(() => {
                        isScanning = false;
                        qrReaderDiv.style.display = 'none';
                        toggleScannerBtn.innerHTML = '<i class="ri-camera-lens-line"></i> Start Camera Scanner';
                        toggleScannerBtn.classList.remove('btn-danger');
                        toggleScannerBtn.classList.add('btn-outline');
                    }).catch(error => {
                        console.error('Failed to clear scanner.', error);
                    });
                }
            } else {
                qrReaderDiv.style.display = 'block';
                html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader",
                    { fps: 10, qrbox: {width: 250, height: 250} },
                    /* verbose= */ false
                );
                html5QrcodeScanner.render(onScanSuccess, onScanFailure);
                isScanning = true;
                toggleScannerBtn.innerHTML = '<i class="ri-close-line"></i> Stop Scanner';
                toggleScannerBtn.classList.remove('btn-outline');
                toggleScannerBtn.classList.add('btn-danger');
            }
        });
    }

    function onScanSuccess(decodedText, decodedResult) {
        // Set the input
        document.getElementById('passIdInput').value = decodedText;
        
        // Stop scanning
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                isScanning = false;
                qrReaderDiv.style.display = 'none';
                toggleScannerBtn.innerHTML = '<i class="ri-camera-lens-line"></i> Start Camera Scanner';
                toggleScannerBtn.classList.remove('btn-danger');
                toggleScannerBtn.classList.add('btn-outline');
            });
        }
        
        // Auto submit to verify
        if (verifyForm) {
            verifyForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    }

    function onScanFailure(error) {
        // Ignore failures as it just means no QR code is in frame yet
    }

    function renderVerificationCard(pass) {
        verifyResult.classList.remove('hidden');

        // Check if valid to use
        let isApproved = pass.status === 'approved';
        let statusHtml = '';

        if (!isApproved) {
            statusHtml = `<div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); color: var(--danger); border-radius: var(--radius); text-align: center; margin-bottom: 1rem;">
                <i class="ri-error-warning-line text-xl"></i> This pass is <strong>${pass.status.toUpperCase()}</strong> and is invalid for entry/exit.
            </div>`;
        } else if (pass.guardInTime) {
            statusHtml = `<div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: var(--radius); text-align: center; margin-bottom: 1rem;">
                <i class="ri-checkbox-circle-line text-xl"></i> This pass has already been used and returned.
            </div>`;
        }

        let actionsHtml = '';
        if (isApproved && !pass.guardInTime) {
            if (!pass.guardOutTime) {
                // Can mark OUT
                actionsHtml = `<button class="btn btn-warning btn-block" onclick="markLog('out')" style="background-color: var(--warning); color: white;"><i class="ri-logout-box-r-line"></i> Mark OUT</button>`;
            } else {
                // Can mark IN
                actionsHtml = `<button class="btn btn-success btn-block" onclick="markLog('in')"><i class="ri-login-box-line"></i> Mark IN</button>`;
            }
        }

        verifyResult.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                <h3 style="margin: 0;">Pass Verification</h3>
                <span class="badge ${pass.status === 'approved' ? 'badge-approved' : pass.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${pass.status}</span>
            </div>
            ${statusHtml}
            <div style="display:grid; gap: 0.5rem; margin-bottom: 1.5rem;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-secondary);">Student Name:</span>
                    <strong>${pass.studentName}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-secondary);">Room No:</span>
                    <strong>${pass.room}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-secondary);">Approved Out:</span>
                    <span>${Utils.formatDate(pass.outDate)}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-secondary);">Expected In:</span>
                    <span>${Utils.formatDate(pass.inDate)}</span>
                </div>
            </div>
            ${actionsHtml}
        `;
    }

    window.markLog = (type) => {
        if (!currentPass) return;

        const now = new Date().toISOString();
        if (type === 'out') {
            currentPass.guardOutTime = now;
            Utils.showToast('Student marked OUT successfully!', 'success');
        } else if (type === 'in') {
            currentPass.guardInTime = now;
            Utils.showToast('Student marked IN successfully!', 'success');
        }

        DB.updatePass(currentPass);
        renderVerificationCard(currentPass);
        document.getElementById('passIdInput').value = '';
    };

    // --- Visitor Logic ---
    const newVisitorForm = document.getElementById('newVisitorForm');
    if (newVisitorForm) {
        newVisitorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('visitorName').value.trim();
            const visiting = document.getElementById('visitingStudent').value.trim();
            const purpose = document.getElementById('visitorPurpose').value.trim();

            if (!name || !visiting || !purpose) return;

            const newVisitor = {
                id: 'VIS-' + Math.floor(Math.random() * 100000),
                name,
                visiting,
                purpose,
                timeIn: new Date().toISOString(),
                timeOut: null
            };

            DB.addVisitor(newVisitor);
            Utils.showToast('Visitor logged successfully!', 'success');
            newVisitorForm.reset();
            document.getElementById('newVisitorModal').classList.remove('show');
            renderVisitors();
        });
    }

    function renderVisitors() {
        const tbody = document.querySelector('#visitorsTable tbody');
        const noDataMsg = document.getElementById('noVisitorsMsg');
        if (!tbody) return;

        let visitors = DB.getVisitors();
        
        // Show active visitors (timeOut is null) first, then recently exited
        visitors.sort((a, b) => {
            if (!a.timeOut && b.timeOut) return -1;
            if (a.timeOut && !b.timeOut) return 1;
            return new Date(b.timeIn) - new Date(a.timeIn);
        });

        tbody.innerHTML = '';
        if (visitors.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('visitorsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('visitorsTable').style.display = 'table';

        visitors.forEach(v => {
            const tr = document.createElement('tr');
            
            let actionHtml = '';
            if (!v.timeOut) {
                actionHtml = `<button class="btn btn-warning" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="markVisitorOut('${v.id}')">Mark Out</button>`;
            } else {
                actionHtml = `<span class="badge badge-success">Completed</span>`;
            }

            tr.innerHTML = `
                <td><strong>${v.name}</strong></td>
                <td>${v.visiting}</td>
                <td>${v.purpose}</td>
                <td>${Utils.formatDate(v.timeIn)}</td>
                <td>${v.timeOut ? Utils.formatDate(v.timeOut) : '-'}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.markVisitorOut = (id) => {
        const visitors = DB.getVisitors();
        const v = visitors.find(vis => vis.id === id);
        if (v) {
            v.timeOut = new Date().toISOString();
            DB.updateVisitor(v);
            Utils.showToast(`${v.name} marked OUT.`, 'success');
            renderVisitors();
        }
    };

    // --- Parcel Logic ---
    const newParcelForm = document.getElementById('newParcelForm');
    if (newParcelForm) {
        newParcelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const trackingNo = document.getElementById('parcelTracking').value.trim();
            const courier = document.getElementById('parcelCourier').value.trim();
            const studentId = document.getElementById('parcelStudent').value.trim();

            if (!trackingNo || !courier || !studentId) return;

            const newParcel = {
                id: 'PRC-' + Date.now(),
                trackingNo,
                courier,
                studentId,
                dateReceived: new Date().toISOString(),
                status: 'Received at Gate',
                dateDelivered: null
            };

            DB.addParcel(newParcel);
            
            DB.addNotification({
                userId: studentId,
                title: 'Parcel Arrived',
                message: `A package from ${courier} (Tracking: ${trackingNo}) is waiting for you at the gate.`,
                type: 'info'
            });

            Utils.showToast('Parcel logged successfully!', 'success');
            newParcelForm.reset();
            document.getElementById('newParcelModal').classList.remove('show');
            renderParcels();
        });
    }

    function renderParcels() {
        const tbody = document.querySelector('#parcelsTable tbody');
        const noDataMsg = document.getElementById('noParcelsMsg');
        if (!tbody) return;

        let parcels = DB.getParcels();
        parcels.sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));

        tbody.innerHTML = '';
        if (parcels.length === 0) {
            noDataMsg.style.display = 'block';
            document.getElementById('parcelsTable').style.display = 'none';
            return;
        }

        noDataMsg.style.display = 'none';
        document.getElementById('parcelsTable').style.display = 'table';

        parcels.forEach(p => {
            const tr = document.createElement('tr');
            let actionHtml = '';
            let badgeClass = p.status === 'Delivered' ? 'badge-success' : 'badge-pending';
            
            if (p.status !== 'Delivered') {
                actionHtml = `<button class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="markParcelDelivered('${p.id}')">Mark Delivered</button>`;
            } else {
                actionHtml = `<span style="font-size:0.875rem; color:var(--text-secondary)">${Utils.formatDate(p.dateDelivered)}</span>`;
            }

            tr.innerHTML = `
                <td>${Utils.formatDate(p.dateReceived)}</td>
                <td><strong>${p.trackingNo}</strong></td>
                <td>${p.courier}</td>
                <td>${p.studentId}</td>
                <td><span class="badge ${badgeClass}">${p.status}</span></td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.markParcelDelivered = (id) => {
        const parcels = DB.getParcels();
        const p = parcels.find(x => x.id === id);
        if (p) {
            p.status = 'Delivered';
            p.dateDelivered = new Date().toISOString();
            DB.updateParcel(p);

            DB.addNotification({
                userId: p.studentId,
                title: 'Parcel Delivered',
                message: `Your parcel from ${p.courier} has been picked up.`,
                type: 'success'
            });

            Utils.showToast('Parcel marked as Delivered.', 'success');
            renderParcels();
        }
    };

    // --- Lost & Found Logic (Shared across roles, implemented here for Guard) ---
    const newLostFoundForm = document.getElementById('newLostFoundForm');
    if (newLostFoundForm) {
        newLostFoundForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('lfType').value;
            const item = document.getElementById('lfItem').value.trim();
            const location = document.getElementById('lfLocation').value.trim();
            const description = document.getElementById('lfDesc').value.trim();

            if (!item || !location || !description) return;

            const report = {
                id: 'LF-' + Date.now(),
                type,
                item,
                location,
                description,
                dateReported: new Date().toISOString(),
                status: 'Active',
                authorRole: currentUser.role,
                authorId: currentUser.id,
                authorName: currentUser.name
            };

            DB.addLostFound(report);
            Utils.showToast(`Item reported as ${type}!`, 'success');
            newLostFoundForm.reset();
            document.getElementById('newLostFoundModal').classList.remove('show');
            renderLostFound();
        });
    }

    function renderLostFound() {
        const container = document.getElementById('lostFoundContainer');
        const noDataMsg = document.getElementById('noLostFoundMsg');
        if (!container) return;

        let items = DB.getLostFound();
        items.sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported));

        container.innerHTML = '';
        if (items.length === 0) {
            noDataMsg.style.display = 'block';
            return;
        }

        noDataMsg.style.display = 'none';

        items.forEach(lf => {
            let badgeClass = lf.type === 'Lost' ? 'badge-rejected' : 'badge-success';
            if (lf.status === 'Resolved') badgeClass = 'badge-pending'; // Grayed out somewhat
            
            const actionHtml = (lf.status === 'Active' && (lf.authorId === currentUser.id || currentUser.role === 'warden')) 
                ? `<button class="btn btn-outline" style="width:100%; margin-top:1rem; padding:0.5rem;" onclick="resolveLostFound('${lf.id}')">Mark as Resolved</button>` 
                : '';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.opacity = lf.status === 'Resolved' ? '0.7' : '1';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                    <span class="badge ${badgeClass}">${lf.type}</span>
                    <span style="font-size:0.75rem; color:var(--text-secondary);">${Utils.formatDate(lf.dateReported)}</span>
                </div>
                <h3 style="margin-top:0; margin-bottom:0.25rem;">${lf.item}</h3>
                <div style="font-size:0.875rem; margin-bottom:0.5rem; color:var(--text-secondary);">
                    <i class="ri-map-pin-line"></i> ${lf.location}
                </div>
                <p style="font-size:0.875rem; margin-bottom:1rem; flex-grow:1;">${lf.description}</p>
                <div style="font-size:0.75rem; color:var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                    Reported by: ${lf.authorName} (${lf.authorRole})
                </div>
                ${actionHtml}
            `;
            container.appendChild(card);
        });
    }

    window.resolveLostFound = (id) => {
        const items = DB.getLostFound();
        const item = items.find(x => x.id === id);
        if (item) {
            item.status = 'Resolved';
            DB.updateLostFound(item);
            Utils.showToast('Item marked as resolved.', 'success');
            renderLostFound();
        }
    };

});