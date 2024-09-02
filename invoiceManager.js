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
    
    init() {
      this.fetchClients();
      this.loadSelectedClient();
    },

    /**  
     * 
     * RIGHT NOW IT CANT ADD ITEMS IN INVOICE AFTER DISCOUNT HAS BEEN ADDED - NOT SURE WHY! BEFORE IT JUST BUGGED - HANDLE IT GRACEFULY        
     !!!!!!!!!!!BIG TODO - 
    1. WHEN CONFIRMING DISCOUNT IT RESETS MY SUBTOTALS - AVOID THIS
    2. WHAT TO DO IF THE USER TRIES MORE THAN ONE DISCOUNT
    -------


    Selecting client needs to empty all totals
            Check if there is any subtotal or not if not ...do not accept anything

              wHEN 
                close the discounts menu 
                create a cross next to discount append it with a symbol % or £ depending on invoice value

            Conditionals:
                If user presses confirm with no input throw error toast and return
                If user inputs negative value do not calculate 
                If user inputs negative value and presses confirm throw error   
    */

    
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
        return subTotal;
      } catch (error) {
        console.error("Error calculating subtotal:", error);
        throw new Error(
          "Failed to calculate subtotal. Please check the input data."
        );
      }
    },

    calculateTotals(recalculateDiscount = false) {
      // recalculate prices if there already is a discount present
      if (recalculateDiscount || this.discount != 0) {
        
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

        this.subtotal = recalcSubtotal
        this.vat = recalcVat
        this.total = recalcTotal

        return
      }
      
      this.subtotal = this.calculateSubTotal();
      this.vat = (this.vatPercent / 100) * this.subtotal;
      this.total = this.subtotal + this.vat; 
       
    },


    handleTemporaryDiscountInput(event) {
      const inputValue = event.target.value;
      if (inputValue === "" || isNaN(inputValue)) {
        // Keep discount at 0 and allow the placeholder to show
        this.temporaryDiscount = 0;
      } else {
        // Update discount normally based on input
        this.temporaryDiscount = parseFloat(inputValue);
      }
    },

    // YUU NEED LOGIC TO HANDLE WHAT HAPPENS IF USER ADS MORE DISCOUNT
    // Calculates temporary subtotal and VAT 
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
      // if you confirm while temp discount is 0 it will delete your things MAYBE RETURN AND DO NOTHING? 
      if(this.temporaryDiscount === 0) {
        alert("Discount is already applied! Can't add multiple discounts.")
        return
      }
      // Pass temporary values to main price forming menu
      this.total = this.totalBeforeDiscount // reference to the total before calculations
      this.subtotal = this.temporarySubtotal
      this.discount = this.temporaryDiscount
      this.vat = this.temporaryVat
      this.total = this.temporaryTotal 

      // Reset temporary discount values
      this.resetTemporaryDiscounts()
      this.callSuccessToast()
      console.log("Subtotal: " + this.subtotal)
      console.log("Vat: " + this.vat)
      console.log("Discount: " + this.discount)
      console.log("Total: " + this.total)
      console.log("Total before discount: " + this.totalBeforeDiscount)
    },

    resetTemporaryDiscounts() {
      const discBubbleSubTotal = document.getElementById('subtotal-discount-buble')
      this.temporaryDiscount = 0
      this.showNewSubtotal = false
      discBubbleSubTotal.classList.remove('text-md', 'line-through', 'text-gray-500')
      discBubbleSubTotal.classList.add('text-lg', 'text-white')
      this.callSuccessToast()
    },

    resetDiscounts() {
      let tempDiscount = this.discount 
      let tempSubtotal = this.subtotal
      let tempVat = this.vat
      let tempTotal = this.total
      
      // put htis invoice items [] to reset properly everything 
      
      this.discount = 0
      console.log("reset Discounts called")
      console.log("---------------------------------------")
      console.log("These are the values before totals get calculated:")
      console.log("---------------------------------------")
      console.log(this.subtotal + " " + "is type:" + (typeof this.subtotal))
      console.log(this.vat + " " + "is type:" + (typeof this.vat))
      console.log(this.total + " " + "is type:" + (typeof this.total))
      console.log(this.discount + " " + "is type:" + (typeof this.discount))
      console.log("---------------------------------------")
      this.calculateTotals()
      console.log("This is after totals get recalculated")
      console.log("---------------------------------------")
      console.log(this.subtotal + " " + "is type:" + (typeof this.subtotal))
      console.log(this.vat + " " + "is type:" + (typeof this.vat))
      console.log(this.total + " " + "is type:" + (typeof this.total))
      console.log(this.discount + " " + "is type:" + (typeof this.discount))
      this.callSuccessToast
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
      this.resetTemporaryDiscounts()
      this.resetDiscounts()
      this.callWarningToastDelete()
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
      console.log("Our discount:");
      console.log(this.temporaryDiscount);
      console.log("Our discount type:");
      console.log(typeof this.temporaryDiscount);
    }, 

    


    async fetchClients() {
      try {
        const response = await fetch("/api/clients");
        this.clients = await response.json();
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    },

    selectClient(client) {
      this.selectedClient = client;
      this.showDropdown = false;
      this.showClientModal = false;
      this.saveSelectedClient(client);
      this.fetchStyles(client.id);
      this.fetchSamples(client.id);
      // Empty out the Invoice Items Table | You need to ensure that styles are saved for the client youre clearing them out of and load them when selected
      this.invoiceItems = [];
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
      }
    },
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
      } catch (error) {
        console.error("Error adding style:", error);
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
      } catch (error) {
        console.error("Error adding sample:", error);
      }
    },
    

    addItemToInvoice(item, type) {
      console.log("Adding item to invoice");
      if (this.discount != 0) {
        this.calculateTotals()
        this.callSuccessToast()
        console.log("I am totals if there was a discount!")
        console.log(`Subtotal: ${this.subtotal}`)
        console.log(`Vat: ${this.vat}`)
        console.log(`Total: ${this.total}`)
        console.log(`Discount${this.symbol}: ${this.discount}`)
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
        this.callSuccessToast()
        console.log("I am totals when there is no previous discount!")
        console.log(`Subtotal: ${this.subtotal}`)
        console.log(`Vat: ${this.vat}`)
        console.log(`Total: ${this.total}`)
        console.log(`Discount${this.symbol}: ${this.discount}`)
        return 
      } else {
        this.callDangerToast()
        console.log("I am error in no previous discount!")
        return
      }
      // add invoice items to localstorage by calling a function bellow
    },
    
    removeItemFromInvoice(item) {
      this.invoiceItems = this.invoiceItems.filter(
        (i) => i.uniqueId !== item.uniqueId
      );
      this.calculateTotals();
      
      // THis is great but removing for now to debug
      // if (this.invoiceItems.length === 0) {
      //   this.resetDiscounts()
      // }
    },

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
        }
      } catch (error) {
        console.error("Error generating invoice:", error);
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
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
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
    // toasts 
    callToast() {
            window.toast('MASDA', {type: 'success', description: 'Wawawewa description', })
            console.log("clicked")
        },

    callSuccessToast() {
        window.dispatchEvent(new CustomEvent('toast-show', { 
            detail: { type: 'success', message: 'Success!', description: 'Client added successfully.' }
        }));
    },

    callDangerToast() {
        window.dispatchEvent(new CustomEvent('toast-show', { 
            detail: { type: 'danger', message: 'Error!', description: 'Error adding item. Call IT support.' }
        }));
    },

    callWarningToastDelete() {
        window.dispatchEvent(new CustomEvent('toast-show', { 
            detail: { type: 'warning', message: 'Warning', description: 'XXXX XXXX.' }
        }));
    }
    // create a counter each time an item/sample gets added in the added items table
    // Remove each item getting added in its own row. Instead another item with the same name needs to be counted
    // Price then needs to properly update
  };
}


/**

<!-- DISCOUNTS SECTION -->
                <div class="flex items-center justify-center">
                    <div class="relative inline-block">
                        <div x-show="popoverOpen" @click.outside="popoverOpen = false"
                            x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0"
                            x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-150"
                            x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"
                            class="popover-container shadow-lg">
                            <div class="popover bg-gray-800 p-4 w-96 shadow-lg rounded-md text-white z-20">
                                <div class="grid grid-cols-3 mb-4">
                                    <div>
                                        <span></span>
                                    </div>
                                    <div>
                                        <h1 class="text-center font-bold text-2xl">Discounts</h1>
                                    </div>
                                    <div class="flex justify-end mr-10">
                                        <div class="circle">
                                            <div class="tick"></div>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <div class="grid grid-cols-2 my-4">
                                    <div>
                                        <!-- Input Value Discount -->
                                        <div class="relative h-full ml-8">
                                            <input x-model.number="temporaryDiscount" id="discount-input" type="number"
                                                class="w-full pl-12 pr-4 py-2 border bg-gray-200 hover:bg-gray-100 border-gray-300 rounded focus:bg-gray-100 focus:outline-none focus:ring focus:border-blue-500 transition duration-300 text-gray-600 text-md p-0.5"
                                                :value="temporaryDiscount === 0 ? '' : temporaryDiscount"
                                                :placeholder="temporaryDiscount === 0 ? 'Enter value' : ''" @input="
                                                            handleDiscountInput(event); 
                                                            calculatetemporaryValues()
                                                            showtemporarySubtotalAndDiscount()
                                                            " />
                                            <div
                                                class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <span x-text="symbol" id="symbolId"
                                                    class="text-gray-600 text-lg"></span>
                                                <!-- Vertical line separator -->
                                                <span class="h-7 border-l border-gray-300 mx-2"></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex ml-8 align-middle">
                                        <button id="toggle-discount-btn mr-4" @click="
                                                    switchOpen = !switchOpen;
                                                    changeDiscount();
                                                    calculatetemporaryValues()
                                                    "
                                            :class="switchOpen ? ' rounded bg-gray-100 text-gray-950 text-sm hover:bg-gray-300 transition duration-300 font-bold' : ' rounded bg-blue-800 text-white text-sm hover:bg-blue-900 transition duration-300 font-bold'"
                                            class="transition duration-300 px-3 py-2">
                                            <svg id="rotateIcon" xmlns="http://www.w3.org/2000/svg" width="20"
                                                height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="feather feather-rotate-cw">
                                                <polyline points="23 4 23 10 17 10"></polyline>
                                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                            </svg>
                                        </button>
                                        <button id="confirm-discount" @click="confirmDiscount()"
                                            class="rounded ml-4 px-3 py-2 bg-gray-100 text-gray-950 text-sm hover:bg-gray-300 transition duration-300 font-bold">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round"
                                                class="feather feather-check">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <hr>
                                <!-- Bubble price menu -->
                                <div class="flex justify-between align-bottom p-4 ml-4">

                                </div>
                            </div>
                            <!-- Arrow -->
                            <div class="arrow"></div>
                        </div>

                        <button @click="popoverOpenDeposit = !popoverOpenDeposit"
                            class="border rounded bg-gray-600 text-white hover:bg-gray-700 transition duration-300 font-bold px-4 mt-1">
                            Discounts
                        </button>

                    </div>
                </div>
 */