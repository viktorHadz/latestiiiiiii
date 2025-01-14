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

    // Example shortcuts
    callError(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'error',
        svg: `<svg class="size-7 m-1"><use href="/icons/icons.svg#error-msg" /></svg>`,
        title,
        body,
        colors: this.toast.colors.error,
      })
    },

    callSuccess(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'success',
        svg: `<svg class="size-7 m-1"><use href="/icons/icons.svg#check-circle" /></svg>`,
        title,
        body,
        colors: this.toast.colors.success,
      })
    },

    callWarning(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'warning',
        svg: `<svg class="size-7 m-1"><use href="/icons/icons.svg#warning-msg" /></svg>`,
        title,
        body,
        colors: this.toast.colors.warning,
      })
    },

    callInfo(title, body) {
      this.addCard({
        id: Date.now(),
        type: 'info',
        svg: `<svg class="size-7 m-1"><use href="/icons/icons.svg#info-msg" /></svg>`,
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

// export default function tosterMan() {
//   window.toast = function (message, options = {}) {
//     let type = options.type || 'default'
//     let description = options.description || ''

//     window.dispatchEvent(
//       new CustomEvent('toastEvent', {
//         detail: {
//           type,
//           message,
//           description,
//         },
//       }),
//     )
//   }
//   return {
//     toasts: [],
//     paddingBetweenToasts: 15,
//     htmlToster: '',

//     async init() {
//       console.log('@@TosterMan@@ initializing')

//       await this.loadHtml()
//     },

//     async loadHtml() {
//       try {
//         const response = await fetch('/components/toasts/toster3.html')
//         if (response.ok) {
//           this.htmlToster = await response.text()
//         } else {
//           throw new Error(`Failed to fetch: ${response.status}`)
//         }
//       } catch (error) {
//         console.error('Error loading HTML SlideOver:', error)
//       }
//     },
//     callToast({ type = 'info', message = '', description = '', position = 'top-center', html = '' }) {
//       window.toast(message, { type, description, position, html })
//     },
//     toastError(message, description = '') {
//       this.callToast({
//         type: 'danger',
//         message: message,
//         description: description,
//         position: 'top-center',
//       })
//     },
//     toastSuccess(message, description = '') {
//       this.callToast({
//         type: 'success',
//         message: message,
//         description: description,
//         position: 'top-center',
//       })
//     },
//     toastWarning(message, description = '') {
//       this.callToast({
//         type: 'warning',
//         message: message,
//         description: description,
//         position: 'top-center',
//       })
//     },
//     toastInfo(message, description = '') {
//       this.callToast({
//         type: 'info',
//         message: message,
//         description: description,
//         position: 'top-center',
//       })
//     },

//     deleteToastWithId(id) {
//       this.toasts = this.toasts.filter(t => t.id !== id)
//     },

//     burnToast(id) {
//       const toastObj = this.toasts.find(t => t.id === id)
//       const toastEl = document.getElementById(id)
//       if (!toastEl) return

//       // Slide/fade out
//       toastEl.classList.add('opacity-0', '-translate-y-full')
//       setTimeout(() => {
//         this.deleteToastWithId(id)
//         setTimeout(() => this.stackToasts(), 1)
//       }, 300)
//     },

//     // Positions the top three toasts (the rest are removed)
//     stackToasts() {
//       if (this.toasts.length === 0) return

//       this.positionToasts()
//     },

//     positionToasts() {
//       // Stack up to 3 toasts with some scale/transform
//       // The code references the first three toasts in `this.toasts`.
//       const topToast = this.toasts[0] && document.getElementById(this.toasts[0].id)
//       if (!topToast) return

//       // The top-most toast
//       topToast.style.zIndex = 100
//       topToast.style.top = '0px'
//       topToast.style.scale = '100%'
//       topToast.style.transform = 'translateY(0px)'

//       // If there's only one toast, we're done
//       if (this.toasts.length < 2) return

//       // The second toast
//       const second = document.getElementById(this.toasts[1].id)
//       second.style.zIndex = 90
//       // behind the first with a smaller scale
//       second.style.top = `${topToast.getBoundingClientRect().height - second.getBoundingClientRect().height}px`
//       second.style.scale = '94%'
//       second.style.transform = 'translateY(16px)'

//       if (this.toasts.length < 3) return

//       // The third toast
//       const third = document.getElementById(this.toasts[2].id)
//       third.style.zIndex = 80
//       third.style.top = `${topToast.getBoundingClientRect().height - third.getBoundingClientRect().height}px`
//       third.style.scale = '88%'
//       third.style.transform = 'translateY(32px)'

//       // If there's a 4th toast, remove it (the toasts array is unshifted from top)
//       if (this.toasts.length > 3) {
//         const fourth = document.getElementById(this.toasts[3].id)
//         if (fourth) {
//           fourth.style.zIndex = 70
//           fourth.style.opacity = 0 // quick fade
//         }
//         setTimeout(() => {
//           this.toasts.pop() // remove extra
//         }, 300)
//       }
//     },
//   }
// }
// // window.addEventListener('toastEvent', event => {
// //   console.log('Event listening \n')
// //   let { type, message, description } = event.detail
// //   let callError = () => {
// //     tosterMan({ message, description })
// //     type = 'danger'
// //   }
// //   callError('sh', 'avei')
// // })
// // console.log('initializing toasterMan')
// // window.tosterMan = tosterMan()
// // console.log(tosterMan())
// // callError(message, description) {
// //   window.toast({
// //     type: 'danger',
// //     message: message,
// //     description: description,
// //   })
// // },
// // callSuccess(message, description) {
// //   window.toast({
// //     type: 'success',
// //     message: message,
// //     description: description,
// //   })
// // },
// // callWarning(message, description) {
// //   window.toast({
// //     type: 'warning',
// //     message: message,
// //     description: description,
// //   })
// // },
// // callInfo(message, description) {
// //   window.toast({
// //     type: 'info',
// //     message: message,
// //     description: description,
// //   })
// // },

// /**
//  *
//    document.addEventListener('alpine:init', () => {
//     Alpine.data('toster', () => ({
//       toasts: [],
//       paddingBetweenToasts: 15,

//       deleteToastWithId(id) {
//         this.toasts = this.toasts.filter(t => t.id !== id)
//       },

//       burnToast(id) {
//         const toastObj = this.toasts.find(t => t.id === id)
//         const toastEl = document.getElementById(id)
//         if (!toastEl) return

//         // Slide/fade out
//         toastEl.classList.add('opacity-0', '-translate-y-full')
//         setTimeout(() => {
//           this.deleteToastWithId(id)
//           setTimeout(() => this.stackToasts(), 1)
//         }, 300)
//       },

//       // Positions the top three toasts (the rest are removed)
//       stackToasts() {
//         if (this.toasts.length === 0) return

//         this.positionToasts()
//       },

//       positionToasts() {
//         // We'll stack up to 3 toasts with some scale/transform
//         // The code references the first three toasts in `this.toasts`.
//         const topToast = this.toasts[0] && document.getElementById(this.toasts[0].id)
//         if (!topToast) return

//         // The top-most toast
//         topToast.style.zIndex = 100
//         topToast.style.top = '0px'
//         topToast.style.scale = '100%'
//         topToast.style.transform = 'translateY(0px)'

//         // If there's only one toast, we're done
//         if (this.toasts.length < 2) return

//         // The second toast
//         const second = document.getElementById(this.toasts[1].id)
//         second.style.zIndex = 90
//         // We stack it behind the first with a smaller scale
//         second.style.top = `${topToast.getBoundingClientRect().height - second.getBoundingClientRect().height}px`
//         second.style.scale = '94%'
//         second.style.transform = 'translateY(16px)'

//         if (this.toasts.length < 3) return

//         // The third toast
//         const third = document.getElementById(this.toasts[2].id)
//         third.style.zIndex = 80
//         third.style.top = `${topToast.getBoundingClientRect().height - third.getBoundingClientRect().height}px`
//         third.style.scale = '88%'
//         third.style.transform = 'translateY(32px)'

//         // If there's a 4th toast, remove it (the toasts array is unshifted from top)
//         if (this.toasts.length > 3) {
//           const fourth = document.getElementById(this.toasts[3].id)
//           if (fourth) {
//             fourth.style.zIndex = 70
//             fourth.style.opacity = 0 // quick fade
//           }
//           setTimeout(() => {
//             this.toasts.pop() // remove extra
//           }, 300)
//         }
//       },
//     }))
//   })
//  */
