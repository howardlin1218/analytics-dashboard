document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // 2. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the visible class to trigger the CSS transition
                entry.target.classList.add('visible');
                
                // Optional: Stop observing once animated
                // observer.unobserve(entry.target); 
            } else {
                // Optional: remove visible class to animate out when scrolling away
                // entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    // Get all elements that should animate on scroll
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => scrollObserver.observe(el));

    // 3. Parallax Effect on Hero
    const heroElements = document.querySelectorAll('.hero h1, .hero p, .hero-buttons');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Simple parallax for hero elements
        heroElements.forEach((el, index) => {
            const speed = 0.05 + (index * 0.02);
            el.style.transform = `translateY(${scrolled * speed}px)`;
            el.style.opacity = 1 - (scrolled * 0.002);
        });
    });

    // 4. Number Counter Animation for Stats
    const statsObserverOptions = {
        threshold: 0.5
    };
    
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + (obj.dataset.suffix || '');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numberEl = entry.target.querySelector('.stat-number');
                if (numberEl && !numberEl.classList.contains('counted')) {
                    const text = numberEl.innerText;
                    
                    // Basic parsing to extract final number and suffix (like % or ms, or +)
                    const match = text.match(/([0-9\.]+)(.*)/);
                    if (match) {
                        const endValue = parseFloat(match[1]);
                        const suffix = match[2];
                        numberEl.dataset.suffix = suffix;
                        animateValue(numberEl, 0, endValue, 1500);
                        numberEl.classList.add('counted');
                    }
                }
            }
        });
    }, statsObserverOptions);

    document.querySelectorAll('.stat-item').forEach(el => statsObserver.observe(el));
});