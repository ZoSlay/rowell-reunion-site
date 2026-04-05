(function () {
    var STORAGE_KEY = 'rowellRsvp';
    var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx9YibTmYq-TbiNUvm-fpPzw6GT6BV52A04Iy5yKdGIhHkT8Isk9dOv-_rKcXCf0N-eMg/exec';

    var form = document.getElementById('rsvp-form');
    var confirmation = document.getElementById('rsvp-confirmation');
    var summary = document.getElementById('rsvp-summary');
    var editBtn = document.getElementById('rsvp-edit');

    var fields = {
        name:      document.getElementById('rsvp-name'),
        email:     document.getElementById('rsvp-email'),
        adults:    document.getElementById('rsvp-adults'),
        children:  document.getElementById('rsvp-children'),
        dietary:   document.getElementById('rsvp-dietary'),
        attending: document.getElementById('rsvp-attending')
    };

    function loadSaved() {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function prefill(data) {
        if (!data) return;
        fields.name.value = data.name || '';
        fields.email.value = data.email || '';
        fields.adults.value = data.adults != null ? data.adults : 1;
        fields.children.value = data.children != null ? data.children : 0;
        fields.dietary.value = data.dietary || '';
        fields.attending.checked = !!data.attending;
    }

    function clearErrors() {
        var msgs = form.querySelectorAll('.error-msg');
        for (var i = 0; i < msgs.length; i++) {
            msgs[i].textContent = '';
        }
        var inputs = form.querySelectorAll('.input-error');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].classList.remove('input-error');
        }
    }

    function showError(fieldId, message) {
        var el = document.getElementById('error-' + fieldId);
        if (el) el.textContent = message;
        var input = fields[fieldId];
        if (input) input.classList.add('input-error');
    }

    function validate() {
        clearErrors();
        var valid = true;

        var name = fields.name.value.trim();
        if (!name) {
            showError('name', 'Name is required.');
            valid = false;
        }

        var email = fields.email.value.trim();
        if (!email) {
            showError('email', 'Email is required.');
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('email', 'Please enter a valid email address.');
            valid = false;
        }

        var adults = parseInt(fields.adults.value, 10);
        if (isNaN(adults) || adults < 0) {
            showError('adults', 'Must be 0 or more.');
            valid = false;
        }

        var children = parseInt(fields.children.value, 10);
        if (isNaN(children) || children < 0) {
            showError('children', 'Must be 0 or more.');
            valid = false;
        }

        return valid;
    }

    function getData() {
        return {
            name:      fields.name.value.trim(),
            email:     fields.email.value.trim(),
            adults:    parseInt(fields.adults.value, 10) || 0,
            children:  parseInt(fields.children.value, 10) || 0,
            dietary:   fields.dietary.value.trim(),
            attending: fields.attending.checked
        };
    }

    function showConfirmation(data) {
        var html = '<p><strong>Name:</strong> ' + escapeHtml(data.name) + '</p>' +
            '<p><strong>Email:</strong> ' + escapeHtml(data.email) + '</p>' +
            '<p><strong>Adults:</strong> ' + data.adults + '</p>' +
            '<p><strong>Children:</strong> ' + data.children + '</p>';
        if (data.dietary) {
            html += '<p><strong>Dietary Restrictions:</strong> ' + escapeHtml(data.dietary) + '</p>';
        }
        html += '<p><strong>Attending:</strong> ' + (data.attending ? 'Yes' : 'No') + '</p>';
        summary.innerHTML = html;
        form.hidden = true;
        confirmation.hidden = false;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // On load: prefill if saved, show confirmation view
    var saved = loadSaved();
    if (saved) {
        prefill(saved);
        showConfirmation(saved);
    }

    // Submit
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;
        var data = getData();

        // POST to Google Sheets (fire-and-forget, silent failure)
        fetch(SHEETS_URL, {
            method: 'POST',
            body: JSON.stringify({
                type: 'rsvp',
                name: data.name,
                email: data.email,
                num_adults: data.adults,
                num_children: data.children,
                dietary_restrictions: data.dietary,
                attending: data.attending ? 'yes' : 'no'
            })
        }).catch(function () { /* Sheets write failed — silent per REUNION-011 */ });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        showConfirmation(data);
    });

    // Edit
    editBtn.addEventListener('click', function () {
        confirmation.hidden = true;
        form.hidden = false;
    });
})();
