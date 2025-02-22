document.addEventListener('alpine:init', () => {
  Alpine.store(
    'pdfStore',
    Alpine.reactive({
      init() {
        console.log('{ pdfStore } Initialising')
      },

      // Sends to DB then receives the data sent and generates PDF after - could be optimised
      async generateInvoice() {
        const store = Alpine.store('invo').totals
        const today = new Date()
        const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
        const formattedToday = today.toLocaleDateString('en-GB')
        const formattedDue = twoWeeksLater.toLocaleDateString('en-GB')
        const invoiceData = {
          clientId: store.clientId,
          items: store.items,
          discountType: store.discountType, // 0: flat, 1: percent
          discountValue: store.discountValue,
          discValIfPercent: store.discValIfPercent,
          vatPercent: store.vatPercent,
          vat: store.vat,
          subtotal: store.subtotal,
          total: store.total,
          depositType: store.depositType, // 0: flat, 1: percent
          depositValue: store.depositValue,
          depoValIfPercent: store.depoValIfPercent,
          // depositPercentValue: 0,
          note: store.note,
          totalPreDiscount: store.totalPreDiscount,
          date: formattedToday,
          due_by_date: formattedDue,
          remaining_balance: store.remaining_balance,
        }
        console.log('generateInvoice => invoiceData: ', invoiceData)
        try {
          const response = await fetch('/invo/api/saveInvoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData),
          })

          if (response.ok) {
            const invoice = await response.json()
            this.generatePDF(invoice.id)
            // Event to notify the app of invoice generation
            document.dispatchEvent(new CustomEvent('invoice:created', { detail: { clientId: store.clientId } }))
            // Debuging location: invoiceStore ==>  resetTotals
            Alpine.store('invo').resetTotals()
          } else {
            console.error('Error generating invoice:', await response.json())
            callError('Server error.', 'Failed to generate invoice. Try again, restart or call support.')
          }
        } catch (error) {
          console.error('Error generating invoice:', error)
          callError('Unable to generate invoice', 'Try again, restart or contact support.')
        }
      },

      async generatePDF(invoiceId) {
        try {
          const response = await fetch(`/invo/api/invoices/${invoiceId}/pdf`, {
            method: 'GET',
          })
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          // PDF Filename - set by Content-Disposition in backend.
          a.download = `S.A.M.Creations-${invoiceId}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
          callSuccess('PDF successfully generated')
        } catch (error) {
          console.error('Error generating PDF:', error)
          callToast('Error generating PDF', 'Refresh the page and try again or call support.')
        }
      },

      async generateEdited() {},
    }),
  )
})
