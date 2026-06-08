document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('admin-form');
    const notification = document.getElementById('notification');
    const submitBtn = document.getElementById('submit-btn');

    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('vehicle_image_file');
        
        const formData = new FormData();
        formData.append('applicant_id', document.getElementById('applicant_id').value.trim());
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('address', document.getElementById('address').value.trim());
        formData.append('refundable_deposit', document.getElementById('refundable_deposit').value);
        formData.append('vehicle_category', document.getElementById('vehicle_category').value);
        formData.append('vehicle_registration_number', document.getElementById('vehicle_registration_number').value.trim());
        formData.append('mileage', document.getElementById('mileage').value.trim());
        formData.append('vehicle_image', document.getElementById('vehicle_image').value.trim());
        formData.append('auction_date', document.getElementById('auction_date').value);
        formData.append('auction_category_start_date', document.getElementById('auction_category_start_date').value);
        formData.append('starting_bid', document.getElementById('starting_bid').value);

        if (fileInput.files.length > 0) {
            formData.append('vehicle_image_file', fileInput.files[0]);
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const response = await fetch('/api/applicant', {
                method: 'POST',
                body: formData // No Content-Type header, browser will set it to multipart/form-data with boundary
            });

            const result = await response.json();
            
            if (result.success) {
                alert(`Applicant ${result.action || 'saved'} successfully! ID: ${result.id}`);
                adminForm.reset();
                fetchRecords(); // Refresh the table
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            alert('Failed to connect to the server.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Applicant Details';
        }
    });

    // Fetch and display all records
    async function fetchRecords() {
        const tbody = document.getElementById('records-tbody');
        if (!tbody) return;
        
        try {
            const response = await fetch('/api/applicant');
            const result = await response.json();
            
            if (result.success) {
                tbody.innerHTML = '';
                result.data.forEach(app => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                    tr.innerHTML = `
                        <td style="padding: 1rem;">${app.applicant_id}</td>
                        <td style="padding: 1rem;">${app.name}</td>
                        <td style="padding: 1rem;">${app.vehicle_category}</td>
                        <td style="padding: 1rem;">${app.vehicle_registration_number}</td>
                        <td style="padding: 1rem;">
                            <button onclick="editRecord('${app.applicant_id}')" style="background: #f59e0b; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: 5px;">Edit</button>
                            <button onclick="deleteRecord('${app.applicant_id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error('Failed to load records', err);
        }
    }

    // Load record into form for editing
    window.editRecord = async function(id) {
        try {
            const response = await fetch(`/api/applicant?id=${id}`);
            const result = await response.json();
            
            if (result.success) {
                const app = result.data;
                document.getElementById('applicant_id').value = app.applicant_id;
                document.getElementById('name').value = app.name;
                document.getElementById('address').value = app.address;
                document.getElementById('refundable_deposit').value = app.refundable_deposit;
                document.getElementById('vehicle_category').value = app.vehicle_category;
                document.getElementById('vehicle_registration_number').value = app.vehicle_registration_number;
                document.getElementById('mileage').value = app.mileage || '';
                document.getElementById('vehicle_image').value = app.vehicle_image || '';
                
                // Format datetime-local string (remove Z or seconds if necessary, usually YYYY-MM-DDThh:mm works)
                if (app.auction_date) {
                    document.getElementById('auction_date').value = app.auction_date.substring(0, 16);
                }
                document.getElementById('auction_category_start_date').value = app.auction_category_start_date;
                document.getElementById('starting_bid').value = app.starting_bid;
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            alert('Failed to fetch record details.');
        }
    };

    // Delete record
    window.deleteRecord = async function(id) {
        if (!confirm(`Are you sure you want to delete applicant ID: ${id}?`)) return;
        
        try {
            const response = await fetch(`/api/applicant?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Record deleted successfully.');
                fetchRecords();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err) {
            alert('Failed to connect to the server.');
        }
    };

    // Initial load
    fetchRecords();

    function showNotification(msg, type) {
        notification.textContent = msg;
        notification.className = type;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
});
