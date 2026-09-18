// --- Mobile menu toggle ---
  // 1. Select the button and the menu
  const menuToggle = document.querySelector('#menuToggle');
  const navLinksMobile = document.querySelector('#navLinksMobile');

  // 2. Listen for a click
  menuToggle.addEventListener('click', function() {
    // 3. React: flip the 'open' class, which the CSS max-height rule keys off
    navLinksMobile.classList.toggle('open');

    // Keep the icon and accessibility state in sync with whether it's open
    const isOpen = navLinksMobile.classList.contains('open');
    menuToggle.textContent = isOpen ? '✕' : '☰';
    menuToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close the mobile menu automatically after tapping a link
  navLinksMobile.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navLinksMobile.classList.remove('open');
      menuToggle.textContent = '☰';
      menuToggle.setAttribute('aria-expanded', false);
    });
  });

  // --- Form validation ---
  const form = document.querySelector('#enquiryForm');
  const nameInput = document.querySelector('#name');
  const phoneInput = document.querySelector('#phone');
  const nameError = document.querySelector('#nameError');
  const phoneError = document.querySelector('#phoneError');
  const formSuccess = document.querySelector('#formSuccess');

  // A very simple check: at least 7 digits, allowing spaces/dashes/plus
  function isValidPhone(value) {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    return digitsOnly.length >= 7;
  }

  form.addEventListener('submit', function(event) {
    // Stop the browser's default "reload the page" behavior so we can
    // check the fields ourselves first
    event.preventDefault();

    let isValid = true;

    if (nameInput.value.trim() === '') {
      nameError.textContent = 'Please enter your name.';
      nameInput.classList.add('invalid');
      isValid = false;
    } else {
      nameError.textContent = '';
      nameInput.classList.remove('invalid');
    }

    if (!isValidPhone(phoneInput.value)) {
      phoneError.textContent = 'Please enter a valid phone number.';
      phoneInput.classList.add('invalid');
      isValid = false;
    } else {
      phoneError.textContent = '';
      phoneInput.classList.remove('invalid');
    }

    if (isValid) {
      // In a real deployment, this is where you'd let the form actually
      // submit to Formspree/Web3Forms rather than just showing this message.
      formSuccess.classList.add('visible');
      form.reset();
    } else {
      formSuccess.classList.remove('visible');
    }
  });
  // --- Animated stat counters ---
  // Grab every <b> that has a data-target attribute — that's how we mark
  // "this number should count up" without hardcoding a list of IDs.
  const statNumbers = document.querySelectorAll('.stat b[data-target]');

  // This function animates ONE element from 0 to its target over `duration` ms.
  function animateCount(el, duration) {
    const target = parseFloat(el.getAttribute('data-target'));
    const decimals = parseInt(el.getAttribute('data-decimals') || '0');
    const suffix = el.getAttribute('data-suffix') || '';
    const start = performance.now(); // timestamp for when the animation begins

    function frame(now) {
      // How far through the animation are we, from 0 to 1?
      let progress = (now - start) / duration;
      if (progress > 1) progress = 1;

      // Ease-out: fast at first, slower as it approaches the target.
      // Without this the count-up feels mechanical/linear.
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = (target * eased).toFixed(decimals);
      el.textContent = current + suffix;

      if (progress < 1) {
        // requestAnimationFrame asks the browser to call `frame` again
        // right before the next repaint — this is how you get a smooth
        // ~60fps animation loop instead of a janky setInterval.
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  // We only want this to fire once, when the stats scroll into view —
  // not on page load (they might be off-screen) and not every time you
  // scroll past them. IntersectionObserver watches an element and tells
  // you when it enters/exits the viewport, without you having to listen
  // to the 'scroll' event yourself (which fires constantly and is
  // expensive to react to directly).
  const statObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        statNumbers.forEach(function(el) {
          animateCount(el, 1200);
        });
        // Stop watching after it's triggered once — we don't want it
        // to re-animate every time the user scrolls back up and down.
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 }); // fire when 50% of the element is visible

  const statRow = document.querySelector('.stat-row');
  statObserver.observe(statRow);
  // --- Data-driven listings ---
  //
  // Instead of hand-writing each `.listing` card in HTML, we keep the
  // data as an array of plain objects and generate the cards from it.
  // This is the array you'd swap for a real fetch() call once the
  // agency is updating listings via a spreadsheet — see the comment
  // at the bottom of this block for exactly how that swap looks.
  const listingsData = [
    {
      title: "Terrace Duplex, Lekki Phase 1",
      location: "Lekki, Lagos",
      tag: "FOR SALE",
      beds: "4 bed",
      baths: "4 bath",
      extra: "350 sqm",
      price: "₦185,000,000"
    },
    {
      title: "2-Bed Apartment, Old Ikoyi",
      location: "Ikoyi, Lagos",
      tag: "FOR RENT",
      beds: "2 bed",
      baths: "2 bath",
      extra: "Serviced",
      price: "₦6,500,000 / yr"
    },
    {
      title: "Waterfront Land Plot",
      location: "Victoria Island, Lagos",
      tag: "FOR SALE",
      beds: "900 sqm",
      baths: "C of O",
      extra: "Cleared",
      price: "₦420,000,000"
    }
  ];

  // Takes ONE listing object and returns the HTML string for its card.
  // Template literals (backticks) let us mix plain text and variables
  // like ${listing.title} without clunky string concatenation.
  function renderListingCard(listing) {
    return `
      <div class="listing">
        <div class="listing-photo"><span class="tag">${listing.tag}</span></div>
        <h3>${listing.title}</h3>
        <div class="loc">${listing.location}</div>
        <div class="meta"><span>${listing.beds}</span><span>${listing.baths}</span><span>${listing.extra}</span></div>
        <div class="price">${listing.price}</div>
      </div>
    `;
  }

  function renderAllListings(data) {
    const container = document.querySelector('#listingsContainer');

    if (data.length === 0) {
      container.innerHTML = '<p class="listings-status">No listings available right now — check back soon.</p>';
      return;
    }

    // .map() turns the array of objects into an array of HTML strings,
    // then .join('') glues them into one big string to inject at once.
    // This is the same .map() from the JS refresher — here it's doing
    // real work instead of a toy example.
    container.innerHTML = data.map(renderListingCard).join('');
  }

  // For now we render the local array directly. The moment the agency
  // wants to manage listings themselves in a Google Sheet, this becomes:
  //
  //   fetch('https://sheetdb.io/api/v1/YOUR_SHEET_ID')
  //     .then(response => response.json())
  //     .then(data => renderAllListings(data))
  //     .catch(error => {
  //       document.querySelector('#listingsContainer').innerHTML =
  //         '<p class="listings-status">Couldn\'t load listings right now.</p>';
  //     });
  //
  // fetch() sends a request to that URL and returns a Promise — an
  // object representing "this will resolve eventually, not immediately."
  // The first .then() converts the raw response into usable JSON data;
  // the second .then() is where you do something with it (render the
  // cards). .catch() runs if the network request fails, so the page
  // degrades gracefully instead of showing a blank section.
  renderAllListings(listingsData);

  // --- Reveal listing cards on scroll ---
  // Cards start hidden (opacity: 0, shifted down) via CSS. We add a
  // '.visible' class to each one right as it scrolls into view, which
  // triggers the CSS transition on .listing.visible to fade/slide it in.
  // This must run AFTER renderAllListings() above, since the cards
  // don't exist in the page yet until that function creates them.
  const listingCards = document.querySelectorAll('.listing');

  const cardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Once revealed, stop watching it — no need to keep checking.
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  listingCards.forEach(function(card, index) {
    // Stagger each card's transition by 0.1s more than the last, so
    // they cascade in one after another instead of all popping in
    // at the exact same instant. transitionDelay is set here in JS
    // (rather than hardcoded in CSS) because the delay depends on
    // each card's position in the list.
    card.style.transitionDelay = (index * 0.1) + 's';
    cardObserver.observe(card);
  });