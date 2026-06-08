document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const applicantIdInput = document.getElementById('applicant-id');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const resultsSection = document.getElementById('results-section');
    const bidBtn = document.getElementById('bid-btn');

    // Result Fields
    const resName = document.getElementById('res-name');
    const resAddress = document.getElementById('res-address');
    const resDeposit = document.getElementById('res-deposit');
    const resCategory = document.getElementById('res-category');
    const resReg = document.getElementById('res-reg');
    const resDate = document.getElementById('res-date');
    const resStartDate = document.getElementById('res-start-date');
    const resStartingBid = document.getElementById('res-starting-bid');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = applicantIdInput.value.trim();
        if (!id) return;

        // Reset UI
        resultsSection.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const response = await fetch(`/api/applicant?id=${id}`);
            const data = await response.json();

            if (data.success) {
                // Populate fields
                const app = data.data;
                const vehicleImg = document.getElementById('res-vehicle-img');
                
                if (app.vehicle_image) {
                    vehicleImg.src = app.vehicle_image;
                    vehicleImg.style.display = 'inline-block';
                } else {
                    vehicleImg.style.display = 'none';
                    vehicleImg.src = '';
                }

                resName.textContent = app.name;
                resAddress.textContent = app.address;
                resDeposit.textContent = `LKR ${Number(app.refundable_deposit).toLocaleString()}`;
                document.getElementById('res-vehicle-cat').textContent = app.vehicle_category;
                document.getElementById('res-reg-no').textContent = app.vehicle_registration_number;
                
                // Mileage display
                const resMileage = document.getElementById('res-mileage');
                if (app.mileage) {
                    resMileage.textContent = `${Number(app.mileage).toLocaleString()} km`;
                } else {
                    resMileage.textContent = '-';
                }

                // Format date for display
                const auctionDateObj = new Date(app.auction_date);
                resDate.textContent = auctionDateObj.toLocaleString();
                resStartDate.textContent = app.auction_category_start_date;
                resStartingBid.textContent = `LKR ${Number(app.starting_bid).toLocaleString()}`;

                // Live Countdown timer
                if (window.auctionCountdown) {
                    clearInterval(window.auctionCountdown);
                }

                const updateCountdown = () => {
                    const now = new Date().getTime();
                    const distance = auctionDateObj.getTime() - now;
                    const resRemainingDays = document.getElementById('res-remaining-days');

                    if (distance < 0) {
                        clearInterval(window.auctionCountdown);
                        resRemainingDays.textContent = 'Auction Passed';
                        resRemainingDays.style.background = 'rgba(239, 68, 68, 0.2)';
                        resRemainingDays.style.color = '#ef4444'; // red
                        return;
                    }

                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    resRemainingDays.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
                    
                    if (days === 0 && hours < 24) {
                        resRemainingDays.style.background = 'rgba(245, 158, 11, 0.2)';
                        resRemainingDays.style.color = '#f59e0b'; // amber
                    } else {
                        resRemainingDays.style.background = 'rgba(16, 185, 129, 0.2)';
                        resRemainingDays.style.color = '#10b981'; // green
                    }
                };

                updateCountdown();
                window.auctionCountdown = setInterval(updateCountdown, 1000);

                // Show results with animation
                setTimeout(() => {
                    loading.classList.add('hidden');
                    resultsSection.classList.remove('hidden');
                    resultsSection.classList.add('fade-in');
                }, 500); // Simulate network delay for UX
            } else {
                showError(data.message || 'Applicant not found');
            }
        } catch (err) {
            showError('Failed to connect to the server');
        }
    });

    const cancelBidBtn = document.getElementById('cancel-bid-btn');

    bidBtn.addEventListener('click', () => {
        // Implement bidding logic or popup
        alert('Bid action triggered! Proceeding to bidding portal...');
    });

    cancelBidBtn.addEventListener('click', () => {
        // Implement cancel bid logic
        alert('Bid cancelled successfully.');
    });

    function showError(msg) {
        loading.classList.add('hidden');
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }
});
