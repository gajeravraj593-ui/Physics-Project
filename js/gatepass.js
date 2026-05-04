document.addEventListener('DOMContentLoaded', () => {
    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const passId = urlParams.get('id');

    if (!passId) {
        document.body.innerHTML = '<h2 style="color:var(--danger); text-align:center;">Error: No Pass ID provided.</h2>';
        return;
    }

    const pass = DB.getPassById(passId);

    if (!pass) {
        document.body.innerHTML = '<h2 style="color:var(--danger); text-align:center;">Error: Pass not found.</h2>';
        return;
    }

    if (pass.status !== 'approved') {
        document.body.innerHTML = '<h2 style="color:var(--danger); text-align:center;">Error: Pass is not approved.</h2>';
        return;
    }

    // Populate data
    document.getElementById('passIdDisplay').textContent = pass.id;
    document.getElementById('studentName').textContent = pass.studentName;
    document.getElementById('roomNo').textContent = pass.room;
    document.getElementById('outDate').textContent = Utils.formatDate(pass.outDate);
    document.getElementById('inDate').textContent = Utils.formatDate(pass.inDate);
    document.getElementById('destination').textContent = pass.destination;

    // Generate QR Code
    document.getElementById('qrcode').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(pass.id)}" alt="QR Code">`;

    // Handle PDF Export
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const element = document.getElementById('passToExport');
            const opt = {
                margin:       1,
                filename:     `Gatepass-${pass.id}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            // Change button state
            downloadBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Generating...';
            downloadBtn.disabled = true;

            html2pdf().set(opt).from(element).save().then(() => {
                downloadBtn.innerHTML = '<i class="ri-download-line"></i> Download PDF';
                downloadBtn.disabled = false;
            });
        });
    }
});
