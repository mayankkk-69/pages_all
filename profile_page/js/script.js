document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. First, load all the HTML fragments from the tabs/ folder
    const tabsToLoad = [
        { id: 'personal-info', src: 'tabs/personal-info.html' },
        { id: 'security', src: 'tabs/security.html' },
        { id: 'notifications', src: 'tabs/notifications.html' },
        { id: 'activity-log', src: 'tabs/activity-log.html' },
        { id: 'hr-documents', src: 'tabs/hr-documents.html' }
    ];
    
    try {
        await Promise.all(tabsToLoad.map(async tab => {
            const container = document.getElementById(tab.id);
            if (container) {
                const response = await fetch(tab.src);
                if (response.ok) {
                    container.innerHTML = await response.text();
                } else {
                    console.error('Failed to fetch', tab.src);
                }
            }
        }));
    } catch(err) {
        console.error('Error loading tab components:', err);
    }

    // 2. Initialize all dynamic components AFTER HTML is safely injected
    initCustomSelects();
    initTabs();
    initSubTabs();
    initFileInputs();
    initButtons();
    initModals();
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const pages = document.querySelectorAll('.tab-page');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.getAttribute('data-target');
            pages.forEach(page => {
                page.classList.toggle('active', page.id === target);
            });
        });
    });
}

function initSubTabs() {
    const subTabs = document.querySelectorAll('.sub-tab-btn');
    const subPages = document.querySelectorAll('.sub-tab-page');

    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            subTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.getAttribute('data-subtarget');
            subPages.forEach(page => {
                page.classList.toggle('active', page.id === target);
            });
        });
    });
}

function initFileInputs() {
    document.querySelectorAll('.file-drop-area').forEach(area => {
        const fileInput = area.querySelector('input[type="file"]');
        const fileMsg = area.querySelector('.file-msg');

        if (!fileInput || !fileMsg) return;

        fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name;
            if (fileName) {
                fileMsg.textContent = fileName;
                fileMsg.style.color = "var(--accent-color)";
                console.log(`File selected: ${fileName}`);
            } else {
                fileMsg.textContent = "Choose file or drag & drop";
                fileMsg.style.color = "var(--text-muted)";
            }
        });
    });
}

// Toasts function block
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✓</span> ${message}`;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function initButtons() {
    const actionButtons = document.querySelectorAll('.btn-primary');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(!btn.hasAttribute('data-modal')) {
               e.preventDefault(); 
               if(btn.textContent.includes('Save') || btn.textContent.includes('Add')) {
                   showToast("Success! Your profile data has been updated.");
                   
                   const innerModal = btn.closest('.modal-overlay');
                   if(innerModal) {
                       innerModal.classList.remove('active');
                   }
               }
            }
        });
    });
}

function initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal-overlay');
    const closeButtons = document.querySelectorAll('.modal-close');

    modalTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
            }
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// --- Custom Select Dropdown Implementation ---
function initCustomSelects() {
    var x = document.querySelectorAll("select:not(.custom-select-initialized)");
    for (var i = 0; i < x.length; i++) {
        var selElmnt = x[i];
        selElmnt.classList.add("custom-select-initialized");
        
        var wrapper = document.createElement("div");
        wrapper.setAttribute("class", "custom-select");
        selElmnt.parentNode.insertBefore(wrapper, selElmnt);
        wrapper.appendChild(selElmnt);

        var a = document.createElement("div");
        a.setAttribute("class", "select-selected");
        a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        wrapper.appendChild(a);
        
        var b = document.createElement("div");
        b.setAttribute("class", "select-items select-hide");
        for (var j = 0; j < selElmnt.length; j++) {
            var c = document.createElement("div");
            c.innerHTML = selElmnt.options[j].innerHTML;
            if (j === selElmnt.selectedIndex) {
                c.setAttribute("class", "same-as-selected");
            }
            c.addEventListener("click", function(e) {
                var s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                var h = this.parentNode.previousSibling;
                for (var i = 0; i < s.length; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        var y = this.parentNode.getElementsByClassName("same-as-selected");
                        for (var k = 0; k < y.length; k++) {
                            y[k].removeAttribute("class");
                        }
                        this.setAttribute("class", "same-as-selected");
                        break;
                    }
                }
                h.click();
                const event = new Event("change");
                s.dispatchEvent(event);
            });
            b.appendChild(c);
        }
        wrapper.appendChild(b);
        a.addEventListener("click", function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }
}

function closeAllSelect(elmnt) {
    var x = document.getElementsByClassName("select-items");
    var y = document.getElementsByClassName("select-selected");
    var arrNo = [];
    for (var i = 0; i < y.length; i++) {
        if (elmnt == y[i]) {
            arrNo.push(i)
        } else {
            y[i].classList.remove("select-arrow-active");
        }
    }
    for (var i = 0; i < x.length; i++) {
        if (arrNo.indexOf(i) === -1) {
            x[i].classList.add("select-hide");
        }
    }
}

document.addEventListener("click", closeAllSelect);
