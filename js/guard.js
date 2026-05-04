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
        'verify': document.getElementById('verifyTab')
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

});
