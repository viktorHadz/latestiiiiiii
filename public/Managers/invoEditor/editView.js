export default function editView() {
  return {
    html: '',
    init() {
      console.log('[EditView] Initialising.')
      fetch('/html/editor/editView.html')
        .then(res => {
          if (!res.ok) throw new Error(`editView fetch error: ${res.status}`)
          return res.text()
        })
        .then(html => {
          this.html = html
        })
        .catch(err => console.error(err))
    },
  }
}
