document.addEventListener('DOMContentLoaded', () => {
  // Selectors
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const loginSpinner = document.getElementById('login-spinner');
  
  const logoutBtn = document.getElementById('logout-btn');
  const adminUserTag = document.getElementById('admin-user-tag');

  // Tab Navigation Selectors
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Form Selectors
  const invoiceForm = document.getElementById('invoice-form');
  const billService = document.getElementById('bill-service');
  const customServiceGroup = document.getElementById('custom-service-group');
  const billServiceCustom = document.getElementById('bill-service-custom');
  const formError = document.getElementById('form-error');
  const formSuccess = document.getElementById('form-success');
  const generateSubmitBtn = document.getElementById('generate-submit-btn');
  const generateSpinner = document.getElementById('generate-spinner');

  // History Tab Selectors
  const historyTableBody = document.getElementById('history-table-body');
  const historySearch = document.getElementById('history-search');
  const historyCount = document.getElementById('history-count');

  // API base URLs (supports dev environment setup matching script.js)
  const isLiveServer = window.location.port === '5500';
  const apiLoginUrl = isLiveServer ? 'http://localhost:3000/api/admin/login' : '/api/admin/login';
  const apiBillsUrl = isLiveServer ? 'http://localhost:3000/api/admin/bills' : '/api/admin/bills';
  const apiSendEmailUrl = isLiveServer ? 'http://localhost:3000/api/admin/send-bill-email' : '/api/admin/send-bill-email';

  // State
  let bills = [];
  let searchQuery = '';

  // Set default date to today
  const billDateInput = document.getElementById('bill-date');
  if (billDateInput) {
    const today = new Date().toISOString().split('T')[0];
    billDateInput.value = today;
  }

  // 1. Initial State Check
  checkSession();

  function checkSession() {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Show dashboard
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      logoutBtn.style.display = 'inline-block';
      adminUserTag.style.display = 'inline-block';
      
      // Load History
      fetchHistory();
    } else {
      // Show login
      loginSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
      logoutBtn.style.display = 'none';
      adminUserTag.style.display = 'none';
    }
  }

  // 2. Login Flow
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      
      const usernameInput = document.getElementById('username').value.trim();
      const passwordInput = document.getElementById('password').value;

      // Loading state
      loginSpinner.classList.remove('d-none');
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.querySelector('.btn-text').classList.add('d-none');

      try {
        const response = await fetch(apiLoginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.setItem('adminToken', data.token);
          checkSession();
        } else {
          showLoginError(data.message || 'Incorrect username or password.');
        }
      } catch (err) {
        console.error('Login Error:', err);
        showLoginError('Network connection error. Please try again.');
      } finally {
        // Restore state
        loginSpinner.classList.add('d-none');
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.querySelector('.btn-text').classList.remove('d-none');
      }
    });
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.style.display = 'block';
  }

  // 3. Logout Flow
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      checkSession();
    });
  }

  // 4. Tab Navigation Management
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add('active');

      if (tabId === 'history') {
        fetchHistory();
      }
    });
  });

  // 5. Service Type "Other" Input Toggle
  if (billService) {
    billService.addEventListener('change', () => {
      if (billService.value === 'Other') {
        customServiceGroup.style.display = 'block';
        billServiceCustom.required = true;
      } else {
        customServiceGroup.style.display = 'none';
        billServiceCustom.required = false;
        billServiceCustom.value = '';
      }
    });
  }

  // 6. Invoice Form Submission
  if (invoiceForm) {
    invoiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formError.style.display = 'none';
      formSuccess.style.display = 'none';

      const token = localStorage.getItem('adminToken');
      const sendWhatsAppChecked = document.getElementById('send-whatsapp').checked;
      const sendEmailChecked = document.getElementById('send-email').checked;

      const customerEmail = document.getElementById('bill-email').value.trim();
      const customerPhone = document.getElementById('bill-phone').value.trim();

      // Simple validations based on selection
      if (sendEmailChecked && !customerEmail) {
        showFormError('Please fill in Customer Email to send invoice via mail.');
        return;
      }

      if (sendWhatsAppChecked && !customerPhone) {
        showFormError('Please fill in Customer Phone to send invoice via WhatsApp.');
        return;
      }

      // Determine final service type string
      let serviceTypeVal = billService.value;
      if (serviceTypeVal === 'Other') {
        serviceTypeVal = billServiceCustom.value.trim() || 'Other Service';
      }

      const payload = {
        customerName: document.getElementById('bill-name').value.trim(),
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        machineType: document.getElementById('bill-machine').value,
        serviceType: serviceTypeVal,
        repairDescription: document.getElementById('bill-desc').value.trim(),
        partsUsed: document.getElementById('bill-parts').value.trim(),
        amount: parseFloat(document.getElementById('bill-amount').value),
        paymentMethod: document.getElementById('bill-method').value,
        paymentStatus: document.getElementById('bill-status').value,
        serviceDate: document.getElementById('bill-date').value,
        technicianName: document.getElementById('bill-tech').value.trim(),
        notes: document.getElementById('bill-notes').value.trim()
      };

      // Loading state
      generateSpinner.classList.remove('d-none');
      generateSubmitBtn.disabled = true;
      generateSubmitBtn.querySelector('.btn-text').classList.add('d-none');

      try {
        // Step A: Save bill details in MongoDB History
        const response = await fetch(apiBillsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        const data = await response.json();
        let savedBill = null;
        let billId = new Date().getTime().toString();

        if (response.ok && data.success) {
          savedBill = data.bill;
          billId = savedBill._id;
        } else {
          console.warn('DB save failed: ' + (data.message || 'database offline'));
          savedBill = { ...payload, _id: billId, createdAt: new Date().toISOString() };
        }

        // Cache locally in localStorage
        const cached = JSON.parse(localStorage.getItem('cachedBills') || '[]');
        cached.unshift(savedBill);
        localStorage.setItem('cachedBills', JSON.stringify(cached));

        // Step B: Generate PDF in the browser and auto-trigger download
        generatePDFInvoice(savedBill, billId);

        let successMessage = 'Invoice generated and PDF downloaded.';

        // Step C: If Email selected, call SMTP endpoint
        if (sendEmailChecked) {
          try {
            const emailResponse = await fetch(apiSendEmailUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ ...payload, id: billId })
            });
            const emailData = await emailResponse.json();
            if (emailResponse.ok && emailData.success) {
              successMessage += ' Email receipt sent successfully!';
            } else {
              successMessage += ' (Warning: Email dispatch failed: ' + (emailData.message || 'SMTP offline') + ')';
            }
          } catch (mailErr) {
            successMessage += ' (Warning: Failed to connect to email server)';
          }
        }

        showFormSuccess(successMessage);
        
        // Step D: If WhatsApp selected, redirect to WhatsApp Web with pre-filled message text
        if (sendWhatsAppChecked) {
          sendWhatsAppText(savedBill || payload, billId);
        }

        // Reset form & reload history
        invoiceForm.reset();
        billServiceCustom.required = false;
        customServiceGroup.style.display = 'none';
        const today = new Date().toISOString().split('T')[0];
        billDateInput.value = today;

      } catch (err) {
        console.error('Invoice generation error:', err);
        showFormError('Server connection error. Unable to process invoice.');
      } finally {
        generateSpinner.classList.add('d-none');
        generateSubmitBtn.disabled = false;
        generateSubmitBtn.querySelector('.btn-text').classList.remove('d-none');
      }
    });
  }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.style.display = 'block';
    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showFormSuccess(msg) {
    formSuccess.textContent = msg;
    formSuccess.style.display = 'block';
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 7. jsPDF Generation Logic
  function generatePDFInvoice(bill, id) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Brand Colors
    const primaryColor = [13, 71, 161]; // Deep navy
    const secondaryColor = [0, 184, 212]; // Cyan

    // Company Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Advanced AC Repair & Services", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Surat, Gujarat, India | Phone: +91 9005341723 | Email: yadavbrahamdev635@gmail.com | Web: https://advancedac.in/", 14, 26);

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, 196, 30);

    // Customer Info Column
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("INVOICE TO:", 14, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Customer Name: ${bill.customerName}`, 14, 46);
    doc.text(`Phone Number:  ${bill.customerPhone}`, 14, 52);
    doc.text(`Email Address: ${bill.customerEmail || 'N/A'}`, 14, 58);

    // Invoice Details Column (Right side)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("INVOICE SUMMARY:", 120, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const displayId = id.length > 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
    doc.text(`Invoice ID:   #${displayId}`, 120, 46);
    doc.text(`Service Date: ${bill.serviceDate}`, 120, 52);
    const createdStr = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    doc.text(`Issued Date:  ${createdStr}`, 120, 58);

    // AutoTable details
    doc.autoTable({
      startY: 66,
      head: [['Job Detail Parameter', 'Service Specification Details']],
      body: [
        ['Machine / Appliance Type', bill.machineType],
        ['Service Categories', bill.serviceType],
        ['Repair Job Description', bill.repairDescription || 'Regular diagnostic inspection and general checkup.'],
        ['Parts & Consumables Replaced', bill.partsUsed || 'No replacement parts required.'],
        ['Technician / Engineer Assigned', bill.technicianName || 'Certified Engineer']
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9.5,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 12;

    // Billing Summary section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TRANSACTION:", 14, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(45, 45, 45);
    doc.text(`Method of Payment: ${bill.paymentMethod}`, 14, finalY + 6);
    doc.text(`Transaction Status: ${bill.paymentStatus.toUpperCase()}`, 14, finalY + 12);

    // Grand Total Box
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(115, finalY - 4, 81, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL AMOUNT:", 119, finalY + 2);
    doc.setFontSize(13);
    doc.text(`Rs. ${parseFloat(bill.amount).toLocaleString('en-IN')}/-`, 119, finalY + 10);

    // Notes banner if exists
    let noteY = finalY + 24;
    if (bill.notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("SPECIAL NOTE / WARRANTY REMARKS:", 14, noteY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(bill.notes, 14, noteY + 5);
      noteY += 12;
    }

    // Professional Footer
    doc.setDrawColor(230, 230, 230);
    doc.line(14, noteY + 5, 196, noteY + 5);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text("This is an electronically generated invoices. Thank you for choosing Advanced AC Repair Services!", 14, noteY + 11);

    // Save and Trigger auto-download
    const safeName = bill.customerName.replace(/\s+/g, '_');
    doc.save(`Invoice_${safeName}.pdf`);
  }

  // 8. WhatsApp Redirect Builder
  function sendWhatsAppText(bill, id) {
    const downloadLink = id ? `\n\n*Download PDF Invoice*: https://advancedac.in/bill?id=${id}` : '';
    const message = `Hello *${bill.customerName}*,\n` +
      `Thank you for choosing *Advanced AC Repair & Home Services*.\n\n` +
      `Here is a summary of your invoice receipt:\n` +
      `-----------------------------------------\n` +
      `*Appliance*: ${bill.machineType}\n` +
      `*Service Type*: ${bill.serviceType}\n` +
      `*Service Date*: ${bill.serviceDate}\n` +
      `*Hired Technician*: ${bill.technicianName || 'Certified Engineer'}\n` +
      `*Description*: ${bill.repairDescription || 'Checkup'}\n` +
      `*Parts Replaced*: ${bill.partsUsed || 'None'}\n` +
      `*Grand Total*: *Rs. ${parseFloat(bill.amount).toLocaleString('en-IN')}/-*\n` +
      `*Method*: ${bill.paymentMethod}\n` +
      `*Status*: *${bill.paymentStatus.toUpperCase()}*\n` +
      `-----------------------------------------${downloadLink}\n\n` +
      `Visit our website: https://advancedac.in/\n\n` +
      `If you have any questions, call us at *9005341723*. We appreciate your business!`;

    const encodedText = encodeURIComponent(message);
    const cleanPhone = bill.customerPhone.replace(/\D/g, ''); // numeric chars only
    
    // Open in WhatsApp Web / Mobile app
    window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedText}`, '_blank');
  }

  // 9. Fetch History Tab
  async function fetchHistory() {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(apiBillsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        bills = data.bills || [];
        // Sync local cache
        localStorage.setItem('cachedBills', JSON.stringify(bills));
        renderHistoryTable();
      } else {
        showHistoryError(data.message || 'Failed to fetch invoice history.');
        loadCachedHistory();
      }
    } catch (err) {
      console.error('Fetch History Error:', err);
      loadCachedHistory();
    }
  }

  function loadCachedHistory() {
    const cached = JSON.parse(localStorage.getItem('cachedBills') || '[]');
    bills = cached;
    renderHistoryTable();
    if (cached.length > 0) {
      historyCount.innerHTML = `Total: ${bills.length} Invoices (Local Cache)`;
    }
  }

  function showHistoryError(msg) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 40px; color: #dc2626;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 2.2rem; margin-bottom: 10px;"></i>
          <p>${msg}</p>
        </td>
      </tr>
    `;
  }

  function handleSessionExpired() {
    alert('Session expired. Please log in again.');
    localStorage.removeItem('adminToken');
    checkSession();
  }

  // 10. History Rendering & Live Search
  if (historySearch) {
    historySearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderHistoryTable();
    });
  }

  function renderHistoryTable() {
    let filteredBills = bills;

    if (searchQuery) {
      filteredBills = filteredBills.filter(b => 
        (b.customerName && b.customerName.toLowerCase().includes(searchQuery)) ||
        (b.customerPhone && b.customerPhone.includes(searchQuery)) ||
        (b.machineType && b.machineType.toLowerCase().includes(searchQuery)) ||
        (b.serviceType && b.serviceType.toLowerCase().includes(searchQuery))
      );
    }

    historyCount.textContent = `Total: ${filteredBills.length} Invoices`;

    if (filteredBills.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted" style="padding: 40px;">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 10px; color:#cbd5e1;"></i>
            <p>No invoice records found matching search query.</p>
          </td>
        </tr>
      `;
      return;
    }

    historyTableBody.innerHTML = filteredBills.map(b => {
      const dateStr = b.serviceDate ? new Date(b.serviceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : 'N/A';

      const statusBadge = b.paymentStatus === 'Paid' ? 'paid' : 'pending';

      return `
        <tr data-id="${b._id}">
          <td><strong>${dateStr}</strong></td>
          <td>
            <strong>${escapeHTML(b.customerName)}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${escapeHTML(b.customerPhone)}</span>
          </td>
          <td>
            <span style="font-weight:600; color:var(--deep-navy);">${escapeHTML(b.machineType)}</span> - 
            <span style="font-size:0.9rem; color:var(--text-muted);">${escapeHTML(b.serviceType)}</span>
          </td>
          <td><strong>₹ ${parseFloat(b.amount).toLocaleString('en-IN')}</strong></td>
          <td><span class="badge ${statusBadge}">${b.paymentStatus}</span></td>
          <td>
            <div class="btn-action-group">
              <button class="action-icon-btn preview" data-id="${b._id}" title="Preview Invoice (View)">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="action-icon-btn view" data-id="${b._id}" title="Re-download PDF Invoice">
                <i class="fa-solid fa-file-pdf"></i>
              </button>
              <button class="action-icon-btn delete" data-id="${b._id}" title="Delete Invoice from History">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach preview triggers (opens bill.html in new tab)
    document.querySelectorAll('.action-icon-btn.preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.open(`/bill?id=${id}`, '_blank');
      });
    });

    // Attach PDF view triggers
    document.querySelectorAll('.action-icon-btn.view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const selectedBill = bills.find(b => b._id === id);
        if (selectedBill) {
          generatePDFInvoice(selectedBill, id);
        }
      });
    });

    // Attach delete triggers
    document.querySelectorAll('.action-icon-btn.delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Permanently delete this invoice receipt from history records?')) {
          await deleteBill(id);
        }
      });
    });
  }

  // 11. Delete Invoice from History
  async function deleteBill(id) {
    const token = localStorage.getItem('adminToken');
    
    // Always remove from local cache first
    let cached = JSON.parse(localStorage.getItem('cachedBills') || '[]');
    cached = cached.filter(b => b._id !== id);
    localStorage.setItem('cachedBills', JSON.stringify(cached));

    try {
      const response = await fetch(apiBillsUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        bills = bills.filter(b => b._id !== id);
        renderHistoryTable();
      } else {
        // Fallback: sync from cached list if server delete failed but local cache is updated
        bills = bills.filter(b => b._id !== id);
        renderHistoryTable();
      }
    } catch (err) {
      console.error('Delete Bill Error:', err);
      bills = bills.filter(b => b._id !== id);
      renderHistoryTable();
    }
  }

  // Utility HTML Escape
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});
