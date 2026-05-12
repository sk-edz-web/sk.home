document.addEventListener('DOMContentLoaded', () => {

    // 1. Subscription Button Logic
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');

    subscribeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Get data attributes from the clicked button
            const planName = e.target.getAttribute('data-plan');
            const planPrice = e.target.getAttribute('data-price');
            
            // In a real full-stack app, this would redirect to a checkout page (e.g., Stripe/Razorpay)
            // Example: window.location.href = `/checkout?plan=${planName}`;
            
            const confirmSubscription = confirm(`You are about to subscribe to the ${planName} Plan for ₹${planPrice}. Proceed to payment gateway?`);
            
            if (confirmSubscription) {
                alert(`Redirecting to secure payment gateway for ${planName} Membership...`);
                // Backend integration goes here
            }
        });
    });
// 0. Mobile Hamburger Menu Logic
    const menuToggle = document.querySelector('#mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu ul li a');

    // Toggle menu open/close
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('is-active');
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('is-active');
            navMenu.classList.remove('active');
        });
    });
    // 2. Contact Form Submission Logic
    const contactForm = document.getElementById('contactForm');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        
        // In a full-stack app, we would send this data using fetch() to our Node/PHP backend.
        /*
        fetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify({ name, email, message }),
            headers: { 'Content-Type': 'application/json' }
        });
        */

        alert(`Thank you, ${name}! Your message has been received. Our team will contact you at ${email} shortly.`);
        contactForm.reset(); // Clear the form
    });

});