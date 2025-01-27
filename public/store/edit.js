document.addEventListener('alpine:init', () => {
  Alpine.store(
    'edit',
    Alpine.reactive({
      // Use to manage editing state and for overal global variabnles local to edit.
      editing: false,
      invoiceItems: [],
      showEditorItems: false,
      init() {
        console.log('{ Edit store } Initialized')
      },
    }),
  )
})
