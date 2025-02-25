document.addEventListener('alpine:init', () => {
  // 1. Helpers to get/set nested values
  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  function setNestedValue(obj, path, value) {
    const parts = path.split('.')
    const last = parts.pop()
    let ref = obj
    for (const key of parts) {
      if (ref[key] === undefined) ref[key] = {}
      ref = ref[key]
    }
    ref[last] = value
  }

  // 2. Define store
  Alpine.store('datePicker', {
    /**
     * createNew:
     *   @param {HTMLElement} inputEl  - The <input> element
     *   @param {string} storeName     - Name of the Alpine store
     *   @param {string} targetPath    - Dot-path to the date property
     *   @param {Object} options       - Additional Flatpickr options
     */
    createNew(inputEl, storeName, targetPath, options = {}) {
      if (!inputEl) {
        console.warn('[datePicker] No inputEl provided.')
        return
      }

      const storeRef = Alpine.store(storeName)
      if (!storeRef) {
        console.warn(`[datePicker] Store "${storeName}" not found!`)
        return
      }

      // 1) Read the existing ISO date from the store
      const isoDate = getNestedValue(storeRef, targetPath)
      // e.g. "2025-03-10"

      // 2) Initialize Flatpickr with proper dateFormat
      const fp = flatpickr(inputEl, {
        // *** CRITICAL: match the store's ISO format (YYYY-MM-DD) ***
        dateFormat: 'Y-m-d',

        // Show user-friendly format in an alternate input
        altInput: true,
        altFormat: 'd/M/Y', // US style: month/day/year

        // If you only want one input field, you can set "altInput: false"
        // but be sure dateFormat is 'Y-m-d' so it parses your store value properly.

        // The default date must match the 'Y-m-d' format
        defaultDate: isoDate || null,

        // Make sure user changes are stored back in 'Y-m-d' (ISO)
        onChange: selectedDates => {
          if (!selectedDates[0]) {
            setNestedValue(storeRef, targetPath, null)
            return
          }
          // Because dateFormat is 'Y-m-d', fp.input.value will also be 'YYYY-MM-DD'
          // We can just grab that from the real input if we like:
          const newVal = fp.input.value // e.g. "2025-03-10"
          setNestedValue(storeRef, targetPath, newVal)
        },
        ...options,
      })

      // 3) Watch store changes -> update Flatpickr
      Alpine.effect(() => {
        const newVal = getNestedValue(storeRef, targetPath)
        if (!newVal) {
          fp.clear()
        } else {
          // If the stored value changed externally, re-set the date
          // This will be a "YYYY-MM-DD" string (matching 'Y-m-d')
          fp.setDate(newVal, true)
        }
      })
    },
  })
})
