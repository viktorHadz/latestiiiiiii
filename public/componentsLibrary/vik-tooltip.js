// tooltip.js

class VikTooltip extends HTMLElement {
    constructor() {
      super();
  
      // Attach Shadow DOM
      const shadowRoot = this.attachShadow({ mode: 'open' });
  
      // Create the template for the tooltip
      const template = document.createElement('template');
      template.innerHTML = `
        <style>
          .tooltip-container {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .tooltip-trigger {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background-color: #2d2d2d;
            color: white;
            font-size: 12px;
            font-weight: bold;
          }
          .tooltip {
            position: absolute;
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            display: none;
            z-index: 10;
            transition: opacity 0.3s ease;
            opacity: 0;
            pointer-events: none; /* Prevents blocking hover events */
            bottom: 100%; /* Position above the trigger element */
            left: 50%;
            transform: translateX(-50%);
          }
          .tooltip.show {
            display: block;
            opacity: 1;
          }
          .tooltip::after {
            content: "";
            position: absolute;
            border-width: 5px;
            border-style: solid;
            border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
            top: 100%; /* Positions the arrow below the tooltip */
            left: 50%;
            transform: translateX(-50%);
          }
        </style>
  
        <div class="tooltip-container">
          <!-- Trigger element for the tooltip -->
          <div class="tooltip-trigger">?</div>
  
          <!-- Tooltip content -->
          <div class="tooltip" id="tooltip"></div>
        </div>
      `;
  
      // Attach the template content to the shadow root
      shadowRoot.appendChild(template.content.cloneNode(true));
  
      // Store a reference to the tooltip element
      this.tooltip = shadowRoot.getElementById('tooltip');
    }
  
    connectedCallback() {
      // Set the tooltip text from the attribute
      this.tooltip.textContent = this.getAttribute('tooltip-text') || 'Tooltip text';
  
      // Bind mouse events to show and hide the tooltip
      this.addEventListener('mouseenter', this.showTooltip.bind(this));
      this.addEventListener('mouseleave', this.hideTooltip.bind(this));
    }
  
    showTooltip() {
      this.tooltip.classList.add('show');
    }
  
    hideTooltip() {
      this.tooltip.classList.remove('show');
    }
  }
  
  // Define the custom element
  customElements.define('vik-tooltip', VikTooltip);
  