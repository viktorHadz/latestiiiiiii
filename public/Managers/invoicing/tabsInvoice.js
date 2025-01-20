export default function tabsInvoice() {
  return {
    invoicingTabSelected: '1',
    invoicingTabId: 'taab',

    styleSearch: '',

    search: '',

    init() {
      console.log('TabsInvoice initialized')
      this.invoicingTabId = this.$id('invoicingTabId')
    },
    get filteredStyles() {
      return Alpine.store('items').styles.filter(style => style.name.toLowerCase().includes(this.search.toLowerCase()))
    },
    get filteredSamples() {
      return Alpine.store('items').samples.filter(sample =>
        sample.name.toLowerCase().includes(this.search.toLowerCase()),
      )
    },

    invoicingTabButtonClicked(tabButton) {
      this.invoicingTabSelected = tabButton.id.replace(this.invoicingTabId + '-', '')
      this.tabRepositionMarker(tabButton)
    },

    tabRepositionMarker(tabButton) {
      this.$refs.tabMarker.style.width = tabButton.offsetWidth + 'px'
      this.$refs.tabMarker.style.height = tabButton.offsetHeight + 'px'
      this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px'
    },

    invoicingTabContentActive(tabContent) {
      return this.invoicingTabSelected == tabContent.id.replace(this.invoicingTabId + '-content-', '')
    },

    invoicingTabButtonActive(tabContent) {
      const invoicingTabId = tabContent.id.split('-').slice(-1)
      return this.invoicingTabSelected == invoicingTabId
    },
  }
}
