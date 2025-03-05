<div
            x-data="$store.makeTable.make($store.edit.styleAndSample, 'styleAndSample')"
            class="relative p-2 border rounded border-vls/40 mb-4">
            <div class="flex justify-between w-full items-center">
              <input
                id="edit-modal-existing"
                type="text"
                placeholder="Search invoice items..."
                class="srch-style"
                x-model="searchQuery" />
              <h2 class="font-medium text-lg text-vls2 dark:text-vds underline decoration-vla dark:decoration-vda">
                Existing styles and samples
              </h2>
            </div>
            <div class="mt-4">
              <!-- Header row -->
              <div class="flex rounded bg-vls2 dark:bg-vdp text-vlp p-2">
                <div class="w-1/3 pl-4">Name</div>
                <div class="w-1/5">Type</div>
                <div class="w-1/6 text-right">Price</div>
                <div class="w-1/6 text-right">
                  Time
                  <span class="text-xs">(min)</span>
                </div>
                <div class="w-1/6 pr-4 text-center">Qty</div>
              </div>
              <!-- Body -->
              <div class="overflow-y-auto table-scrollbar" style="max-height: 25vh">
                <div class="px-0.5 mr-2 mt-4">
                  <template x-for="item in filteredItems" :key="`existing-${item.id}`">
                    <div
                      :id="item.frontendId"
                      class="w-full flex justify-between items-center rounded bg-vlp dark:bg-vds3neu700 text-vls2 dark:text-vds text-sm mb-3 border-hover-ring-efect p-0.5">
                      <div class="w-1/3 pl-4" x-text="item.name"></div>
                      <div class="w-1/5" x-text="item.type"></div>
                      <div class="w-1/6 text-right" x-text="item.price ? '£' + item.price.toFixed(2) : '£0.00'"></div>
                      <div class="w-1/6 text-right" x-text="item.type === 'sample' ? item.time + ' min' : 'N/A'"></div>
                      <!-- Updated width for Qty column to match the header -->
                      <div class="flex items-center justify-end w-1/6 text-right pr-4">
                        <button
                          @click="$store.edit.addDropdownItem(item);$nextTick(()=> $store.invo.addItemAnimation(item.frontendId));"
                          class="table-interaction-icon-blue mr-2">
                          <svg class="size-5"><use href="/icons/icons.svg#plus-circle" /></svg>
                        </button>
                        <input
                          :id="'existing' + item.frontendId"
                          type="number"
                          min="1"
                          class="table-input-standard w-14"
                          x-model.number="item.quantity" />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

TEMPLATING ALPINE!

<!-- Alpine.js Initialization -->
<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('dropdown', () => ({
    open: false,  // Dropdown state

    // Trigger property for the button
    trigger: {
      ['@click']() {
        this.open = !this.open;  // Toggles the dropdown
      },
    },

    // Dialogue property to control dropdown visibility
    dialogue: {
      ['x-show']() {
        return this.open;  // Shows the dropdown if open is true
      },
    },
  }));
});
</script>

<!-- HTML Structure -->
<div x-data="dropdown">
  <!-- Button to trigger dropdown -->
  <button x-bind="trigger" class="px-4 py-2 text-white bg-blue-500 rounded">
    Toggle Dropdown
  </button>

  <!-- Dropdown menu -->
  <div x-bind="dialogue" class="p-4 mt-2 bg-white shadow-lg">
    This is the dropdown content.
  </div>
</div>

Just use @Apply after and im on the way to simplify my code a lot

Styles removed
<button
@click="tabButtonClicked('styles')"
:class="{ 'tab-button-active': tabContentActive('styles') }"
class="tab-button flex items-center">

<div x-show="sideBar" class="flex items-center p-2">
<object data-feather="package" class="mr-1.5 w-4"></object>

                <span>Items</span>
              </div>
              <div x-show="!sideBar" class="p-2">
                <object data-feather="package"></object>
              </div>
            </button>

<div
  x-data="totalsInvoice"
  class="p-2 text-xs rounded-md bg-vlp text-vls3 outline outline-1 outline-offset-8 outline-vls/80 dark:bg-vdp dark:text-vds dark:outline-vdp3">
  <div class="grid items-end grid-cols-4">
    <!--MARK: MAIN PRICE MENU COL 1 -->
    <div class="flex-col self-center text-lg font-medium align-middle">
      <h3>
        Subtotal:
        <span x-text="'£' + staticSubtotal"></span>
      </h3>
      <!-- MARK: Discount -->
      <div class="flex">
        <h3 class="flex">
          <span class="mr-1">Discount:</span>
          <span x-show="discount !== 0">-</span>
          <span x-text="symbol === '%' ? discount + '%' : '£' + discount"></span>
          <span x-show="discount !== 0 && isDiscountPercent === true" x-text="(`(£${discountValue})`)"></span>
        </h3>
        <button
          x-show="discount != 0"
          x-transition.duration.300
          @click="resetDiscounts();"
          class="table-interaction-icon-red">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#trash" />
          </svg>
        </button>
      </div>
      <!-- MARK: Vat -->
      <h3 class="text-lg font-medium">
        VAT:
        <span>£</span>
        <span x-text="vat"></span>
      </h3>
      <!-- MARK: Total -->
      <div class="flex w-full">
        <h3 class="flex">
          Total:
          <span class="ml-1">£</span>
          <span x-text="total"></span>
        </h3>
        <h3 x-show="discount !== 0" x-transition.duration.300 class="ml-1 line-through text-vls dark:text-neutral-400">
          <span x-text="preDiscountTotal"></span>
        </h3>
      </div>
      <!-- MARK: Deposit -->
      <div class="flex w-full">
        <div x-show="deposit != 0" x-transition.opacity.duration.300>
          <h3 class="flex">
            <span class="mr-1">Deposit:</span>
            <!-- Display deposit as either percentage + numeric value or just numeric value -->
            <span x-text="depositSymbol === '%' ? depositDisplay : '£' + deposit"></span>
          </h3>
        </div>
        <button
          x-show="deposit !== 0"
          x-transition.opacity.duration.300
          @click="resetDeposit();"
          class="table-interaction-icon-red">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#trash" />
          </svg>
        </button>
      </div>
    </div>
    <!-- MARK: DISCOUNT MODAL -->
    <div class="flex justify-center">
      <div class="relative inline-block">
        <button
          @click="popoverOpen = !popoverOpen; if(popoverOpen) $nextTick(() => $refs.discountInput.focus())"
          class="flex self-center gap-2 butt-style">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#trending-down" />
          </svg>
          Discount
        </button>
        <div
          x-cloak
          x-show="popoverOpen"
          x-transition:enter="transition ease-out duration-300"
          @click.outside="popoverOpen = false"
          @keyup.esc="popoverOpen = false"
          x-transition:enter-start="opacity-0 translate-y-2"
          x-transition:enter-end="opacity-100 translate-y-0"
          x-transition:leave="transition ease-in duration-145"
          x-transition:leave-start="opacity-100 translate-y-0"
          x-transition:leave-end="opacity-0 -translate-y-10"
          class="absolute z-10 flex flex-col items-center justify-center origin-bottom bottom-full start-1/2 -ms-32 w-52 will-change-transform">
          <div class="modal-bg-and-borders overflow-hidden !p-6">
            <div class="relative">
              <div class="flex flex-col items-center justify-center mb-2">
                <h3 class="modal-title mb-4 !text-xl">Discount</h3>
                <!-- Input Value Discount -->
                <div class="relative mb-2">
                  <!-- 0 SYMBOL CONTROL WITH PADDING -->
                  <input
                    id="discount-input"
                    type="number"
                    placeholder="0"
                    x-model.number="tempDiscount"
                    x-ref="discountInput"
                    class="modal-input-style w-full !py-2 !pl-12" />
                  <!-- PERCENT SYMBOL CONTROL WITH PADDING -->
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span
                      x-text="symbol"
                      id="symbolIdDiscount"
                      class="text-lg text-vls2/80 hover:text-gray-200 focus:text-gray-200 dark:text-vds"></span>
                    <!-- PIPE SYMBOL CONTROL WITH MARGIN -->
                    <span class="absolute h-4 mx-2 ml-6 border-l border-gray-300"></span>
                  </div>
                </div>
              </div>

              <div class="flex justify-between mb-4">
                <button
                  id="toggle-discount-btn"
                  @click="switchOpen = !switchOpen; changeDiscount(); revolveSymbol('symbolIdDiscount')"
                  :class="switchOpen ? ' rounded bg-gray-100 text-gray-950 text-sm hover:bg-gray-300 transition duration-300 font-semibold' : ' rounded bg-vla2 text-white text-sm hover:bg-vla3 transition duration-300 font-semibold'"
                  class="px-1.5 py-1 transition duration-300">
                  <svg id="rotateIcon" width="20" height="20">
                    <use href="/icons/icons.svg#rotate" />
                  </svg>
                </button>
                <button
                  id="confirm-discount"
                  @click="confirmDiscount()"
                  x-transition
                  class="ml-4 rounded bg-vls2 dark:bg-vds2 px-1.5 py-1 text-sm font-semibold text-white dark:text-vds transition duration-300 hover:bg-gray-300"
                  :class="discount !== 0 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 hover:bg-gray-300 text-gray-950'">
                  <svg width="20" height="20">
                    <use href="/icons/icons.svg#check" />
                  </svg>
                </button>
                <button
                  @click="resetDiscounts()"
                  class="ml-4 rounded bg-gray-600 px-1.5 py-1 text-white transition duration-300 hover:bg-gray-700">
                  <svg width="20" height="20">
                    <use href="/icons/icons.svg#xmark" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div
            class="relative z-10 flex-none w-0 h-0 -mt-px border-t-8 border-e-8 border-s-8 border-e-transparent border-s-transparent border-t-vlp dark:border-t-zinc-900"
            aria-hidden="true"></div>
          <div
            class="relative z-0 -mt-[7px] h-0 w-0 flex-none border-e-8 border-s-8 border-t-8 border-e-transparent border-s-transparent border-t-vls2 dark:border-t-vds2"
            aria-hidden="true"></div>
        </div>
      </div>
    </div>
    <!-- MARK: DEPOSIT  MODAL-->
    <!-- DEPOSIT MENU COL 3-->
    <div class="flex justify-center">
      <div class="relative inline-block">
        <button
          @mouseenter="(trigger === 'hover focus') ? depositOpen = true : null"
          @click="(trigger === 'click') ? depositOpen = !depositOpen : null; if (depositOpen) { $nextTick(() => { $refs.tempDeposit.focus()}); }"
          type="button"
          class="flex self-center gap-2 butt-style">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#cash-bill" />
          </svg>
          Deposit
        </button>
        <div
          x-cloak
          x-show="depositOpen"
          x-transition:enter="transition ease-out duration-300"
          @click.outside="depositOpen = false"
          @keyup.esc="depositOpen = false"
          x-transition:enter-start="opacity-0 translate-y-2"
          x-transition:enter-end="opacity-100 translate-y-0"
          x-transition:leave="transition ease-in duration-145"
          x-transition:leave-start="opacity-100 translate-y-0"
          x-transition:leave-end="opacity-0 -translate-y-10"
          class="absolute z-10 flex flex-col items-center justify-center origin-bottom bottom-full start-1/2 -ms-32 w-52 will-change-transform">
          <div class="modal-bg-and-borders overflow-hidden !p-6">
            <h3 class="modal-title mb-4 text-center !text-xl">Deposit</h3>
            <div class="relative my-4">
              <input
                x-ref="tempDeposit"
                class="modal-input-style w-full !py-2 !pl-12"
                type="number"
                min="0"
                placeholder="Enter deposit..."
                x-model="tempDeposit"
                :value="tempDeposit === 0 ? 0 : tempDeposit"
                :placeholder="tempDeposit === 0 ? 'Enter deposit...' : 0"
                @input="handleDepositInput(event)" />
              <!-- PERCENT SYMBOL CONTROL WITH PADDING -->
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span
                  x-text="depositSymbol"
                  id="symbolIdDeposit"
                  class="text-lg text-vls2/80 hover:text-gray-200 focus:text-gray-200 dark:text-vds"></span>
                <!-- PIPE SYMBOL CONTROL WITH MARGIN -->
                <span class="absolute h-6 mx-2 ml-6 border-l border-gray-300"></span>
              </div>
            </div>
            <div class="flex justify-between mb-4">
              <button
                id="toggle-deposit"
                @click="isDepositPercent = ! isDepositPercent; handleDepositType(); revolveSymbol('symbolIdDeposit')"
                :class="!isDepositPercent ? ' rounded bg-gray-100 text-gray-950 text-sm hover:bg-gray-300 transition duration-300 font-semibold' : ' rounded bg-vla2 text-white text-sm hover:bg-vla3 transition duration-300 font-semibold'"
                class="px-1.5 py-1 transition duration-300">
                <svg id="toggle-deposit-btn" width="20" height="20">
                  <use href="/icons/icons.svg#rotate" />
                </svg>
              </button>
              <button
                id="confirm-deposit"
                @click="calculateDeposit()"
                x-transition
                class="ml-4 rounded bg-gray-100 px-1.5 py-1 text-sm font-semibold text-gray-950 transition duration-300 hover:bg-gray-300">
                <svg width="20" height="20">
                  <use href="/icons/icons.svg#check" />
                </svg>
              </button>
              <button
                @click="depositOpen = false"
                class="ml-4 rounded bg-gray-600 px-1.5 py-1 text-white transition duration-300 hover:bg-gray-700">
                <svg width="20" height="20">
                  <use href="/icons/icons.svg#xmark" />
                </svg>
              </button>
            </div>
          </div>
          <div
            class="relative z-10 flex-none w-0 h-0 -mt-px border-t-8 border-e-8 border-s-8 border-e-transparent border-s-transparent border-t-vlp dark:border-vds2"
            aria-hidden="true"></div>
          <div
            class="relative z-0 -mt-[7px] h-0 w-0 flex-none border-e-8 border-s-8 border-t-8 border-e-transparent border-s-transparent border-t-vls2 dark:border-t-vds2"
            aria-hidden="true"></div>
        </div>
      </div>
    </div>

    <!-- MARK: COL 4 NOTE PDF -->
    <div class="flex justify-between h-full">
      <!-- MARK: NOTE BUTTON -->
      <div>
        <div :class="invoiceNote !== '' ? 'hidden' : 'block'"></div>
        <div
          class="relative"
          @mouseover="hoverCardEnter()"
          @mouseleave="hoverCardLeave()"
          :class="invoiceNote !== '' ? 'fade-in-visible' : 'fade-out-hidden'"
          x-show="invoiceNote != ''">
          <div
            class="flex align-top transition-colors duration-300 text-vls hover:fill-vls hover:text-vla dark:text-vds dark:hover:fill-vred-300 dark:hover:text-vred-300"
            :class="invoiceNote !== '' ? 'fade-in-visible' : 'fade-out-hidden'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="feather feather-file-text">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <button
              @click="removeMessage()"
              class="flex transition duration-300 fade-in-hidden fade-out-hidden justify-items-end text-vls hover:text-vla dark:text-vred-300"
              x-ref="removeBtn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-x-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>

          <div
            x-show="hoverCardHovered"
            class="absolute top-0 mt-5 translate-y-3 left-1/2 -z-50 w-72 max-w-72 -translate-x-3/4"
            x-cloak>
            <div
              x-show="hoverCardHovered"
              class="flex h-auto w-[full] items-start space-x-3 rounded-md border border-slate-300 bg-vlp p-4 shadow-sm dark:border-neutral-600 dark:bg-zinc-900"
              x-transition>
              <div class="flex w-full h-full text-vls dark:text-vds">
                <div class="flex items-center justify-center text-sm">
                  <p
                    x-text="invoiceNote"
                    class="font-normal fade-in-hidden fade-out-hidden text-wrap"
                    :class="invoiceNote !== '' ? 'fade-in-visible' : 'fade-out-hidden'"
                    x-ref="noteText"
                    x-show="invoiceNote != ''"></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-end justify-between h-full">
        <!-- MARK:NOTE POPOVER -->
        <div class="relative inline-block">
          <button
            @click=" invoiceNoteOpen = !invoiceNoteOpen; if (invoiceNoteOpen) { $nextTick(() => { $refs.invoiceNotePopover.focus()}); }"
            type="button"
            class="flex self-center gap-2 butt-style">
            <svg width="20" height="20">
              <use href="/icons/icons.svg#clipboard" />
            </svg>
            Invoicing Note
          </button>
          <div
            x-cloak
            x-show="invoiceNoteOpen"
            x-transition:enter="transition ease-out duration-300"
            @click.outside="invoiceNoteOpen = false"
            @keyup.esc="invoiceNoteOpen = false"
            x-transition:enter-start="opacity-0 translate-y-2"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-in duration-145"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 -translate-y-10"
            class="absolute z-10 flex flex-col items-center justify-center origin-bottom bottom-full start-1/2 -ms-32 w-52 will-change-transform">
            <div class="modal-bg-and-borders overflow-hidden !p-6">
              <!-- TOOLTIP QUESTIONMARK -->
              <!-- MARK: INVOICE MESSAGE -->
              <!-- Custom Message for Deposit -->
              <div>
                <h3 class="modal-title mb-4 text-center !text-xl">Client Note</h3>
                <textarea
                  x-model="invoiceNotePopover"
                  x-ref="invoiceNotePopover"
                  @input="trackLength()"
                  rows="4"
                  class="modal-input-style w-full !p-2"
                  placeholder="Invoice note..."
                  style="resize: vertical; min-height: 100px; max-height: 300px"></textarea>
              </div>
              <div class="mb-4">
                <h1 x-transition.duration.300 class="mt-2 text-center text-small text-vls dark:text-vds">
                  Characters:
                  <span x-text="noteMaxLength"></span>
                  /
                  <span x-text="noteMaxLength - noteLength"></span>
                </h1>
              </div>
              <!-- Confirm Button -->
              <div class="flex justify-center">
                <button
                  @click="handleMessageSubmit()"
                  class="rounded bg-gray-100 px-1.5 py-1 text-sm font-semibold text-gray-950 transition duration-300 hover:bg-gray-300">
                  <svg width="20" height="20" class="">
                    <use href="/icons/icons.svg#check" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              class="relative z-10 flex-none w-0 h-0 -mt-px border-t-8 border-e-8 border-s-8 border-e-transparent border-s-transparent border-t-vlp dark:border-t-zinc-900"
              aria-hidden="true"></div>
            <div
              class="relative z-0 -mt-[7px] h-0 w-0 flex-none border-e-8 border-s-8 border-t-8 border-e-transparent border-s-transparent border-t-vls2 dark:border-t-vds2"
              aria-hidden="true"></div>
          </div>
        </div>
        <!-- GENERATE PDF  -->
        <div>
          <button @click="generateInvoice" class="butt-style">
            <svg width="20" height="20" class="mr-1.5">
              <use href="/icons/icons.svg#download-document" />
            </svg>

            Generate PDF
          </button>
        </div>
      </div>
    </div>

  </div>
</div>
