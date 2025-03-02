export default function primaryEditsModal() {
  return {
    html: '',
    init() {
      console.log('[primaryEditsModal] Initialising')
      fetch('/html/editor/primaryEdits.html')
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
