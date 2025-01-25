document.addEventListener('alpine:init', () => {
  Alpine.store(
    'pdfStore',
    Alpine.reactive({
      init() {
        console.log('{ pdfStore } Initialising')
      },
      // get the totals from invoice
      // Do I check em for anything? Numbers for numbers note for length
      // totals: {
      //   clientId: null,
      //   items: [],
      //   discountType: 0, // 0: flat, 1: percent
      //   discountValue: 0,
      //   vatPercent: 20,
      //   vat: 0,
      //   // staticSubtotal: 0,
      //   subtotal: 0,
      //   total: 0,
      //   depositType: 0, // 0: flat, 1: percent
      //   depositValue: 0,
      //   // depositPercentValue: 0,
      //   note: '',
      //   totalPreDiscount: 0,
      //   date: new Date().toLocaleDateString(), // tochangeToo!!!!!!!!!!
      // },
      // Sends to DB then receives the data sent and generates PDF after - could be optimised
      async generateInvoice() {
        const store = Alpine.store('invo').totals
        const invoiceData = {
          clientId: store.clientId,
          items: store.items,
          discountType: store.discountType, // 0: flat, 1: percent
          discountValue: store.discountValue,
          // discountPercentValue
          vatPercent: store.vatPercent,
          vat: store.vat,
          subtotal: store.subtotal,
          total: store.total,
          depositType: store.depositType, // 0: flat, 1: percent
          depositValue: store.depositValue,
          // depositPercentValue: 0,
          note: store.note,
          totalPreDiscount: store.totalPreDiscount,
          date: new Date().toLocaleDateString(),
        }
        console.log('generateInvoice => invoiceData: ', invoiceData)
        try {
          const response = await fetch('/api/saveInvoice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData),
          })

          if (response.ok) {
            const invoice = await response.json()
            this.generatePDF(invoice.id)
          } else {
            console.error('Error generating invoice:', await response.json())
            callError('Server error.', 'Failed to generate invoice. Try again, restart or call support.')
          }
        } catch (error) {
          console.error('Error generating invoice:', error)
          callError('Unable to generate invoice. Try again, restart or contact support.')
        }
      },

      async generatePDF(invoiceId) {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
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
          callToast({
            type: 'success',
            message: 'PDF generated successfully.',
            position: 'top-center',
          })
        } catch (error) {
          console.error('Error generating PDF:', error)
          callToast({
            type: 'danger',
            message: 'PDF Generation Error!',
            description: 'Failed to generate PDF. Try again or contact support.',
            position: 'top-center',
          })
        }
      },
    }),
  )
})
