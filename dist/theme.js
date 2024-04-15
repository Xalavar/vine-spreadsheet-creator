"use strict";

(function () {
  "use strict";

  // Start of use strict
  console.log('THIS IS VISIBLE');
  var sidebar = document.querySelector('.sidebar');
  var sidebarToggles = document.querySelectorAll('#sidebarToggle, #sidebarToggleTop');
  if (sidebar) {
    var collapseEl = sidebar.querySelector('.collapse');
    var collapseElementList = [].slice.call(document.querySelectorAll('.sidebar .collapse'));
    var sidebarCollapseList = collapseElementList.map(function (collapseEl) {
      return new bootstrap.Collapse(collapseEl, {
        toggle: false
      });
    });
    for (var toggle of sidebarToggles) {
      // Toggle the side navigation
      toggle.addEventListener('click', function (e) {
        document.body.classList.toggle('sidebar-toggled');
        sidebar.classList.toggle('toggled');
        if (sidebar.classList.contains('toggled')) {
          for (var bsCollapse of sidebarCollapseList) {
            bsCollapse.hide();
          }
        }
        ;
      });
    }

    // Close any open menu accordions when window is resized below 768px
    window.addEventListener('resize', function () {
      var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      if (vw < 768) {
        for (var bsCollapse of sidebarCollapseList) {
          bsCollapse.hide();
        }
      }
      ;
    });
  }

  // Prevent the content wrapper from scrolling when the fixed side navigation hovered over

  var fixedNaigation = document.querySelector('body.fixed-nav .sidebar');
  if (fixedNaigation) {
    fixedNaigation.on('mousewheel DOMMouseScroll wheel', function (e) {
      var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      if (vw > 768) {
        var e0 = e.originalEvent,
          delta = e0.wheelDelta || -e0.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
      }
    });
  }
  var scrollToTop = document.querySelector('.scroll-to-top');
  if (scrollToTop) {
    // Scroll to top button appear
    window.addEventListener('scroll', function () {
      var scrollDistance = window.pageYOffset;

      //check if user is scrolling up
      if (scrollDistance > 100) {
        scrollToTop.style.display = 'block';
      } else {
        scrollToTop.style.display = 'none';
      }
    });
  }

  /* Column Order Dropdowns */

  /* Delete Data Modal */
  $('#erasure-type').change(function () {
    // Check if the selected value is "picked-years"
    if ($(this).val() === 'individual-years') {
      // Show the grid of checkboxes for specific years
      $('#year-selection').show();
    } else {
      // Hide the grid of checkboxes for specific years
      $('#year-selection').hide();
    }
  });

  // Load settings from local storage
  localStorage.getItem('VSE_settings') ? null : localStorage.setItem('VSE_settings', JSON.stringify({}));
  function getFormVal(elem) {
    //console.log(elem.tagName)
    if (elem.tagName === "SELECT") {
      return elem.value;
    } else {
      return elem.checked;
    }
  }
  function deepMerge(target, source) {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /* Checks for making sure settings exist */
  // Loop through each list group
  document.querySelectorAll('.list-group-item').forEach(function (column) {
    const listGroupHead = column.closest('.list-group').id;
    column.querySelectorAll('select, input').forEach(function (options) {
      var storedSettings = JSON.parse(localStorage.getItem('VSE_settings'));
      // Get the corresponding setting from stored settings
      const itemId = options.closest('.list-group-item').id; //options.id; // Assuming column id is the setting name
      //const listGroupHead = options.parentElement.id;
      const keyName = options.dataset.lsRef;
      const localValue = storedSettings && storedSettings[listGroupHead] && (storedSettings[listGroupHead][itemId] && storedSettings[listGroupHead][itemId][keyName] || storedSettings[listGroupHead][keyName]);
      // If it exists, set the dropdown to the stored setting
      if (localValue !== undefined) {
        if (options.tagName === "SELECT") {
          options.value = localValue;
        } else {
          options.checked = localValue;
        }
      } else {
        // otherwise use the value currently selected
        var settingsToUpdate = {};
        settingsToUpdate[listGroupHead] = {};
        if (itemId !== '') {
          // the list group item has no name; intended for 2-layer object nesting instead of 3
          settingsToUpdate[listGroupHead][itemId] = {};
          settingsToUpdate[listGroupHead][itemId][keyName] = getFormVal(options);
        } else {
          settingsToUpdate[listGroupHead][keyName] = getFormVal(options);
        }

        // Merge new settings with existing stored settings
        const updatedSettings = deepMerge(storedSettings, settingsToUpdate);
        localStorage.setItem('VSE_settings', JSON.stringify(updatedSettings));
      }
      // Add event listener to update stored settings when selection changes
      options.addEventListener('change', function () {
        console.log('something changed.');
        var storedSettings = JSON.parse(localStorage.getItem('VSE_settings'));
        var settingsToUpdate = {};
        settingsToUpdate[listGroupHead] = {};
        var optionValue = getFormVal(options);
        if (itemId !== '') {
          // the list group item has no name; intended for 2-layer object nesting instead of 3
          settingsToUpdate[listGroupHead][itemId] = {};
          settingsToUpdate[listGroupHead][itemId][keyName] = optionValue;
        } else {
          settingsToUpdate[listGroupHead][keyName] = optionValue;
        }

        // Merge new settings with existing stored settings
        const updatedSettings = deepMerge(storedSettings, settingsToUpdate);
        console.log(settingsToUpdate);
        console.log(storedSettings);
        console.log(updatedSettings);
        localStorage.setItem('VSE_settings', JSON.stringify(updatedSettings));
        console.log('god');
      });
    });
  });
})(); // End of use strict
//# sourceMappingURL=theme.js.map