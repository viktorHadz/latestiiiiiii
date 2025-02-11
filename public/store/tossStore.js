document.addEventListener('alpine:init', () => {
  Alpine.store('toss', {
    hoveredIndex: null,
    cards: [],

    /* Basic config for different toast types */
    toast: {
      title: '',
      body: '',
      svg: ``,
      type: '',
      colors: {
        error: 'from-red-300 to-red-600',
        warning: 'from-yellow-300 to-orange-500',
        info: 'from-blue-300 to-blue-600',
        success: 'from-green-300 to-green-600',
      },
    },

    /*
     * Called when you want to remove a toast
     * (after the leave animation ends).
     */
    destroyCard(cardId) {
      const index = this.cards.findIndex(c => c.id === cardId)
      if (index !== -1) {
        this.cards.splice(index, 1)
      }
    },

    /* Helper to add any new toast to the store */
    addCard(card) {
      this.cards.unshift(card)
      if (this.cards.length > 4) this.cards.pop()

      setTimeout(() => {
        const el = document.getElementById('toast-' + card.id)
        if (el) {
          el.classList.add('toast-animate-leave')
        }
      }, 4000)
    },

    callError(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'error',
        svg: `<svg class="size-5 m-1"><use href="/icons/icons.svg#error-msg" /></svg>`,
        title,
        body,
        colors: this.toast.colors.error,
      })
    },

    callSuccess(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'success',
        svg: `<svg class="size-5 m-1"><use href="/icons/icons.svg#check-circle" /></svg>`,
        title,
        body,
        colors: this.toast.colors.success,
      })
    },

    callWarning(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'warning',
        svg: `<svg class="size-5 m-1"><use href="/icons/icons.svg#warning-msg" /></svg>`,
        title,
        body,
        colors: this.toast.colors.warning,
      })
    },

    callInfo(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'info',
        svg: `<svg class="size-5 m-1"><use href="/icons/icons.svg#info-msg" /></svg>`,
        title,
        body,
        colors: this.toast.colors.info,
      })
    },
  })
  // Hoist methods to the window object
  window.callError = (...args) => Alpine.store('toss').callError(...args)
  window.callSuccess = (...args) => Alpine.store('toss').callSuccess(...args)
  window.callWarning = (...args) => Alpine.store('toss').callWarning(...args)
  window.callInfo = (...args) => Alpine.store('toss').callInfo(...args)
})
