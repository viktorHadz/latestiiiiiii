document.addEventListener('alpine:init', () => {
  Alpine.store('effs', {
    addEff(el, animation, duration) {
      if (!el) return
      // Add the animation class
      el.classList.add(animation)
      // Remove the animation class after the duration
      setTimeout(() => {
        el.classList.remove(animation)
      }, duration)
    },
  })
})
