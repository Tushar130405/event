// Feedback form submission
const feedbackForm = document.getElementById('feedbackForm');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = feedbackForm.feedbackName.value.trim();
        const email = feedbackForm.feedbackEmail.value.trim();
        const rating = feedbackForm.rating.value;
        const message = feedbackForm.feedbackMessage.value.trim();

        if (!name || !email || !rating || !message) {
            alert('Please fill in all fields.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (rating < 1 || rating > 5) {
            alert('Rating must be between 1 and 5.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, rating: parseInt(rating), message }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Thank you for your feedback!');
                feedbackForm.reset();
            } else {
                alert('Error submitting feedback: ' + data.message);
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    });
}
