export default function invoiceManager() {
  return {
    showClientModal: false,
    showDropdown: false,
    clients: [],
    styles: [],
    filteredStyles: [],
    samples: [],
    filteredSamples: [],
    selectedClient: null,
    // Invoice items - collects both styles and samples
    invoiceItems: [],
    // Search Bar
    styleSearch: "",
    sampleSearch: "",
    // Add new style for client
    showAddStyleModal: false,
    newStyle: { name: "", price: null },    
    // Add new sample for client
    showAddSampleModal: false,
    newSample: { name: "", time: null, price: null },
    // Price forming menu - final values after all operations have been added to them
    subtotal: 0,
    vat: 0,
    vatPercent: 20,
    totalBeforeDiscount: 0,
    total: 0,
    deposit: 0,
    // Use for deposits popover menu. Not YET added.  
    popoverOpenDeposit: false,
    // Discount section
    popoverOpen: false,
    // THE 4 BELOW NEED TO BE PERSISTED ACROSS THE APP TOO --> TO DO: WHEN SAVING ITEMS 
    switchOpen: false, // Controls discount types, symbol
    isDiscountPercent: true,
    isDiscountFlat: false,
    symbol: "%",
    // Temporary values
    showNewSubtotal: false,
    // Shows in discounts bubble once user starts typing which trigers showNewSubtotal that hides/shows temporary subtotal
    temporarySubtotal: 0, 
    temporaryDiscount: 0,
    temporaryVat: 0,
    temporaryTotal: 0,    
    // This is discount in  the main price forming meny. ultimate Discount value - x-model.number in the html controls the type
    discount: 0,
    
    invoiceValues:[
      // Array with objects to send over to the backend - items and prices - not sure if appropriate - Maybe get them separately though having an array would be nice :D 
    ],

    init() {
      this.fetchClients();
      this.loadSelectedClient();
    },

    /**         
        
     TO DO LIST: 
    ------------
    Saving/Reseting/Deleting Invoice State - How will this work. 
    ---------------------------------------------------------------
      Saving
        1. When user adds a new item to the invoice list to keep track of invoice items and discounts
      Reseting
        1.
      Deleting
        1. When user changes clients - or should I save the user progress
        2. When user generates an invoice - Yes

    Selecting client needs to empty all totals - Or does it? 
      Check if there is any subtotal or not if not ...do not accept anything

      Conditionals:
          If user presses confirm with no input throw error toast and return
          If user inputs negative value do not calculate 
          If user inputs negative value and presses confirm throw error   
    */

    /*-----------------------------CLIENT FETCHING LOGIC--------------------------------------*/
    async fetchClients() {
      try {
        const response = await fetch("/api/clients");
        this.clients = await response.json();
      } catch (error) {
        console.error("Error fetching clients:", error);
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Cannot get client. Try again, restart program or call support.', position: 'top-center', html: '' })
      }
    },
    selectClient(client) {
      let selectedClient = this.selectedClient.name
      if (this.subtotal != 0) {
        let result = confirm(`You are working on ${selectedClient}'s invoice. Changing clients now will erase current invoice progress. Are you sure you want to continue?`)
        if (result === false) {
          this.showDropdown = false;
          this.showClientModal = false;
          return
        }
      }
      // Reset prices and discounts
      this.invoiceItems = [];
      this.resetDiscounts()
      this.resetTemporaryDiscounts()
      this.calculateTotals()
      // Select new client
      this.selectedClient = client;
      this.showDropdown = false;
      this.showClientModal = false;
      this.saveSelectedClient(client);
      this.fetchStyles(client.id);
      this.fetchSamples(client.id);
      // Empty out the Invoice Items Table | You need to ensure that styles are saved for the client youre clearing them out of and load them when selected
      callToast({ type: 'success', message: 'Clients:', description: `Client changed to ${selectedClient}.`, position: 'top-center', html: '' })
      
    },

    saveSelectedClient(client) {
      localStorage.setItem("selectedClient", JSON.stringify(client));
    },

    loadSelectedClient() {
      const client = JSON.parse(localStorage.getItem("selectedClient"));
      if (client) {
        this.selectedClient = client;
        this.fetchStyles(client.id);
        this.fetchSamples(client.id);
      }
    },
    openModal() {
      this.showClientModal = true;
    },
    closeModal() {
      this.showClientModal = false;
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    async fetchStyles(clientId) {
      try {
        const response = await fetch(`/api/styles/client/${clientId}`);
        this.styles = (await response.json()).map((style) => ({ ...style }));
        this.filteredStyles = this.styles;
      } catch (error) {
        console.error("Error fetching styles:", error);
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Cannot get styles. Try again, restart program or call support.', position: 'top-center', html: '' })

      }
    },
    async fetchSamples(clientId) {
      try {
        const response = await fetch(`/api/samples/client/${clientId}`);
        this.samples = (await response.json()).map((sample) => ({
          ...sample,
          sampleName: sample.name,
        }));
        this.filteredSamples = this.samples;
      } catch (error) {
        console.error("Error fetching samples:", error);
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Cannot get samples. Try again, restart program or call support.', position: 'top-center', html: '' })
      }
    },
    
    /*-----------------------------PRICE FORMING LOGIC--------------------------------------*/
    addItemToInvoice(item, type) {
      console.log("Adding item to invoice");
      // Disables adding items to invoice if discount is applied
      if (this.discount != 0) {
        this.calculateTotals()
        callToast({ type: 'danger', message: 'Error!', description: 'Cannot add items when a discount is present. Remove discount and try again.', position: 'top-center', html: '' })

        console.log("I am totals if there was a discount!")
        console.log(`Subtotal: ${this.subtotal}`)
        console.log(`Vat: ${this.vat}`)
        console.log(`Total: ${this.total}`)
        console.log(`Discount${this.symbol}: ${this.discount}`)
        console.log(`Your invoiceItems array:`)
        console.log(this.invoiceItems)
        return
      }
      // 1. Unique id to identify items by an id - TODO: THIS SHOULD BE STORED TOO
      const uniqueId = `${type}-${item.id}`;
      let qty = 1;
      let itemExists = false;
      // 2. Map over the invoiceItems
      this.invoiceItems = this.invoiceItems.map((invoiceItem) => {
        // 3. if the item exists is in the lsit:
        if (invoiceItem.uniqueId === uniqueId) {
          itemExists = true;
          return {
            ...invoiceItem,
            quantity: invoiceItem.quantity + qty,
            price: 
              invoiceItem.type === "sample" 
                ? parseFloat(item.price) * parseFloat(item.time) 
                : invoiceItem.price
          }
        } 
        return invoiceItem
      });
      // 4. If the item does not exist, add it to the invoiceItems array
      if (!itemExists) {
        this.invoiceItems.push({
          ...item,
          type,
          uniqueId,
          quantity: qty,
          price: parseFloat(item.price) * (type === "sample" ? parseFloat(item.time) : 1 )
        })
      }
      
      if (this.discount === 0) {
        this.calculateTotals()
        // this.callSuccessToast()
        console.log("I am totals when there is no previous discount!")
        console.log(`Subtotal: ${this.subtotal}`)
        console.log(`Vat: ${this.vat}`)
        console.log(`Total: ${this.total}`)
        console.log(`Discount${this.symbol}: ${this.discount}`)
        return 
      } else {
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Error in adding item to invoice list.', position: 'top-center', html: '' })
        console.log("I am error if no previous discount!")
        return
      }
      // add invoice items to localstorage by calling a function bellow
    },
    
    removeItemFromInvoice(item) {
      if (this.discount != 0 ) {
        this.resetDiscounts()
        this.resetTemporaryDiscounts()
        // console.log(this.invoiceItems)
        // console.log(this.invoiceItems.length)
      }
      this.invoiceItems = this.invoiceItems.filter(
        (i) => i.uniqueId !== item.uniqueId
      );
      this.calculateTotals();
      // SEE WHAT HAPPENS TO DISCOUNT IF YOU TRY TO REMOVE ITEM WHILST DISCOUNT APPLIED PUT THIS AT THE TOP OTHERWISE CONDITION WONT TRIGGER  
    },


    // Rounds numbers to two decimal spaces. Only use after all math ops. are done. 
    roundToTwo(value) {
      return Math.round((value + Number.EPSILON) * 100) / 100
    },
    calculateSubTotal() {
      try {
        // Calculate the subtotal for samples
        let sampleTotal = this.invoiceItems
          .filter((item) => item.type === "sample")
          .reduce((total, item) => total + item.price * item.quantity, 0);
        // Calculate the subtotal for styles
        let styleTotal = this.invoiceItems
          .filter((item) => item.type === "style")
          .reduce((total, item) => total + item.price * item.quantity, 0);
        // Calculate the overall subtotal by summing both
        let subTotal = sampleTotal + styleTotal;
        console.log("Samples: ", sampleTotal);
        console.log("Styles: ", styleTotal);
        console.log("Subtotal: ", subTotal);
        return this.roundToTwo(subTotal);
      } catch (error) {
        console.error("Error calculating subtotal:", error);
        throw new Error(
          "Failed to calculate subtotal. Please check the input data."
        );
      }
    },
    calculateTotals() {
      // recalculate prices if there already is a discount present
      if (this.discount != 0) {
        let subtotal = this.calculateSubTotal()
        let discount = this.discount
        let recalcSubtotal = 0

        if(this.isDiscountPercent === true) {
          recalcSubtotal = subtotal - (discount/100) * subtotal
        }
        else if (this.isDiscountFlat === true) {
          recalcSubtotal = subtotal - discount 
        }
        let recalcVat = (this.vatPercent / 100) * recalcSubtotal
        let recalcTotal = recalcSubtotal + recalcVat

        this.subtotal = this.roundToTwo(recalcSubtotal)
        this.vat = this.roundToTwo(recalcVat)
        this.total = this.roundToTwo(recalcTotal)

        return
      }
      this.subtotal = this.calculateSubTotal();
      let noDiscountVat = (this.vatPercent / 100) * this.subtotal
      this.vat = this.roundToTwo(noDiscountVat);
      let noDiscountTotal = this.subtotal + this.vat 
      this.total = this.roundToTwo(noDiscountTotal)
       
    },
    // Helps keep discount input value to 0 
    handleTemporaryDiscountInput(event) {
      const inputValue = event.target.value;
      if (inputValue === "" || isNaN(inputValue)) {
        // Keep discount at 0 and allow the placeholder to show - does not work but function does
        this.temporaryDiscount = 0;
      } else {
        // Update discount normally based on input
        this.temporaryDiscount = parseFloat(inputValue);
      }
    },
    // Calculates temporary subtotal and VAT and Total
    calculateTemporaryValues() {
      if(this.isDiscountPercent === true) {
        this.temporarySubtotal = this.subtotal - (this.temporaryDiscount/100) * this.subtotal
      } else if(this.isDiscountFlat === true) {
        this.temporarySubtotal = this.subtotal - this.temporaryDiscount
      }
      this.temporaryVat = this.vatPercent/100 * this.temporarySubtotal
      this.temporaryTotal = this.temporarySubtotal + this.temporaryVat
    },
    // Confirms all prices to send to main screen Prices menu 
    confirmDiscount() {
      // if confirming discount when discount is 0 or subtotal is 0 or the discount > subtotal
      if(this.temporaryDiscount === 0) {
        callToast({ type: 'danger', message: 'Error!', description: 'Discount cannot be empty.', position: 'top-center', html: '' })
        return
      } else if (this.subtotal === 0 ) {
        callToast({ type: 'danger', message: 'Error!', description: 'Cannot apply discount when the subtotal is zero.', position: 'top-center', html: '' })
        return
      } else if (this.temporaryDiscount > this.subtotal) {
        callToast({ type: 'danger', message: 'Error!', description: 'Cannot apply discount bigger than the subtotal.', position: 'top-center', html: '' })
        return
      }
      // Pass temporary values to main price forming menu
      this.total = this.totalBeforeDiscount // reference to the total before calculations
      this.subtotal = this.roundToTwo(this.temporarySubtotal)
      this.discount = this.roundToTwo(this.temporaryDiscount)
      this.vat = this.roundToTwo(this.temporaryVat)
      this.total = this.roundToTwo(this.temporaryTotal) 
      // Reset temporary discount values
      this.resetTemporaryDiscounts()
      //this.callSuccessToast()
      callToast({ type: 'success', message: 'Discount Menu:', description: 'Discount applied successfully!', position: 'top-center', html: '' })
      console.log("Subtotal: " + this.subtotal)
      console.log("Vat: " + this.vat)
      console.log("Discount: " + this.discount)
      console.log("Total: " + this.total)
      console.log("Total before discount: " + this.totalBeforeDiscount)
      // HANDLE ERROR HERE
    },
    revolveSymbol() {
      const symbol = document.getElementById("symbolId");
      symbol.classList.add("revolve");

      symbol.addEventListener(
        "animationend",
        () => {
          symbol.classList.remove("revolve");
        },
        { once: true }
      );
    },
    // Important handlers for reseting discount
    resetTemporaryDiscounts() {
      const discBubbleSubTotal = document.getElementById('subtotal-discount-buble')
      this.temporaryDiscount = 0
      this.showNewSubtotal = false
      discBubbleSubTotal.classList.remove('text-md', 'line-through', 'text-gray-500')
      discBubbleSubTotal.classList.add('text-lg', 'text-white')
    },
    resetDiscounts() {
      this.discount = 0
      this.resetTemporaryDiscounts()
      this.temporaryVat = this.vat
      this.temporaryTotal = this.total

      callToast({ type: 'success', message: 'Main menu:', description: 'Discount reset successfully!', position: 'top-center', html: '' })
    },
    showTemporarySubtotalAndDiscount() {
      const discBubbleSubTotal = document.getElementById('subtotal-discount-buble')
      
      if (this.temporaryDiscount != 0 && !isNaN(this.temporaryDiscount)) {
        this.showNewSubtotal = true
        discBubbleSubTotal.classList.add('line-through', 'text-md', 'text-gray-500')
      } else if(this.temporaryDiscount === '' || isNaN(this.temporaryDiscount)) {
        alert("There is a problem with the discount. Contact your tech support.")
      } else {
        this.showNewSubtotal = false
        discBubbleSubTotal.classList.remove('line-through', 'text-gray-500', 'text-md')
        discBubbleSubTotal.classList.add('text-white', 'text-lg')
      }
      console.log("Discount is:" + this.temporaryDiscount)
    },
    // TODO: Add localstorage to set state? Maybe after fetch styles/client
    changeDiscount() {
      if (this.discount != 0) {
        this.resetTemporaryDiscounts()
        this.resetDiscounts()
        callToast({ type: 'info', message: 'Discount & Main Menu:', description: 'Cannot change discount type if it has been set. All discounts reset.', position: 'top-center', html: '' })
      }
      const icon = document.getElementById("rotateIcon");
      icon.classList.add("spin"); // Add animation class
      // Remove class after animation to reset for future clicks
      icon.addEventListener(
        "animationend",
        () => {
          icon.classList.remove("spin");
        },
        { once: true }
      );
      if (this.switchOpen === true) {
        this.symbol = "£";
        this.isDiscountPercent = false;
        this.isDiscountFlat = true;
        this.revolveSymbol();
      } 
      if (this.switchOpen === false) {
        this.symbol = "%";
        this.isDiscountPercent = true;
        this.isDiscountFlat = false;
        this.revolveSymbol();
      }
    }, 

    /*-------------------------------ADD STYLES AND SAMPLES LOGIC----------------------------*/
    // Adds new style/sample in DB and updates UI
    async invoAddStyle() {
      const style = { ...this.newStyle, client_id: this.selectedClient.id };
      try {
        const response = await fetch("/styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(style),
        });
        const newStyle = await response.json();
        newStyle.name = newStyle.name;
        this.styles.push({ ...newStyle });
        this.filteredStyles = this.styles;
        this.showAddStyleModal = false;
        this.newStyle = { name: "", price: null };
        callToast({ type: 'success', message: 'Main menu:', description: 'Successfully added style!', position: 'top-center', html: '' })
      } catch (error) {
        console.error("Error adding style:", error);
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Cannot add style. Try again, restart program or call support.', position: 'top-center', html: '' })
      }
    },
    async invoAddSample() {
      const sample = { ...this.newSample, client_id: this.selectedClient.id };
      try {
        const response = await fetch("/samples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sample),
        });
        const newSample = await response.json();
        this.samples.push({ ...newSample, isEditing: false });
        this.filteredSamples = this.samples;
        this.showAddSampleModal = false;
        this.newSample = { name: "", style: null, price: null };
        callToast({ type: 'success', message: 'Main menu:', description: 'Successfully added sample!', position: 'top-center', html: '' })

      } catch (error) {
        console.error("Error adding sample:", error);
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Cannot add sample. Try again, restart program or call support.', position: 'top-center', html: '' })
      }
    },
    searchStyles() {
      this.filteredStyles = this.styles.filter((style) =>
        style.name.toLowerCase().includes(this.styleSearch.toLowerCase())
      );
    },

    searchSamples() {
      this.filteredSamples = this.samples.filter((sample) =>
        sample.sampleName
          .toLowerCase()
          .includes(this.sampleSearch.toLowerCase())
      );
    }, 

    /*-----------------------------GENERATE INVOICE LOGIC--------------------------------------*/
    async generateInvoice() {
      const invoiceData = {
        clientId: this.selectedClient.id,
        items: this.invoiceItems,
        // need to edit this based on discounts
        discountPercent: this.discountPercent, // doesnt exist in current data itteration 
        discountFlat: this.discountFlat,  // doesnt exist in current data itteration
        vatPercent: this.vatPercent, 
        subtotal: this.subtotal,
        discount: this.discount,
        vat: this.vat,
        total: this.total,
      };

      try {
        const response = await fetch("/api/saveInvoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
        });

        if (response.ok) {
          const invoice = await response.json();
          this.generatePDF(invoice.id);
        } else {
          console.error(
            
            "Error generating invoice, data sent from invoiceData was shit:",
            await response.json()
          );
          callToast({ type: 'danger', message: 'Server Error!', description: 'Error in generating invoice. Try again restart program or call support.', position: 'top-center', html: '' })
        }
      } catch (error) {
        console.error("Error generating invoice:", error);
        callToast({ type: 'danger', message: 'Invoice Error!', description: 'Error in generating invoice. Try again restart program or call support.', position: 'top-center', html: '' })

      }
    },

    async generatePDF(invoiceId) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
          method: "GET",
        });
        console.log("Invoice id is:" + invoiceId);

        console.log(response);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        console.log(url);
        // PDF Filename - set by Content-Disposition in backend.
        a.download = `S.A.M.Creations-${invoiceId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        callToast({ type: 'success', message: 'PDF: Success!', description: `PDF generated successfully.`, position: 'top-center', html: '' })

      } catch (error) {
        console.error("Error generating PDF:", error);
        callToast({ type: 'danger', message: 'PDF Generator: Error!', description: 'Error in generating PDF. Try again restart program or call support.', position: 'top-center', html: '' })

      }
    },



   
  };
}
