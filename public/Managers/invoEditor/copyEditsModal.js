export default function copyEditsModal() {
  return {
    html: '',
    init() {
      console.log('[copyEditsModal] Initialising')
      fetch('../../html/editor/copyEdits.html')
        .then(res => {
          if (!res.ok) throw new Error(`Bad html fetch ${res.status}`)
          return res.text()
        })
        .then(html => {
          this.html = html
        })
        .catch(err => console.error(err))
    },
  }
}
