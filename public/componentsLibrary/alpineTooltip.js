// Reusable components using shadow dom
// Closed shadowRoot vs Open - when it is closed the element can be accessed into the environtment. When it is open it cannot. Guess it depends on what you need. 
// Alpine.initTree(this.shadowRoot) allows setting alpine data atributes

// components/vik-tooltip.js

class VikTooltip extends HTMLElement {
  constructor() {
    super();
    // Attach open Shadow DOM (change to 'open' for debugging purposes)
    const shadowRoot = this.attachShadow({ mode: 'open' });

    // Create the template with Alpine.js integration
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .tooltip-container {
          position: relative;
          display: inline-block;
          cursor: pointer;
        }
        .tooltip {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 5px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          display: none;
          z-index: 10;
        }
        .tooltip::after {
          content: "";
          position: absolute;
          border-width: 5px;
          border-style: solid;
        }
      </style>

      <div x-data="{ tooltipVisible: false, tooltipText: 'Tooltip text', tooltipPosition: 'top' }"
           x-init="
             $refs.content.addEventListener('mouseenter', () => tooltipVisible = true);
             $refs.content.addEventListener('mouseleave', () => tooltipVisible = false);
           "
           class="tooltip-container">
        
        <div x-ref="tooltip"
             x-show="tooltipVisible"
             :class="{
               'top-0 left-1/2 -translate-x-1/2 -mt-0.5 -translate-y-full': tooltipPosition === 'top',
               'top-1/2 -translate-y-1/2 -ml-0.5 left-0 -translate-x-full': tooltipPosition === 'left',
               'bottom-0 left-1/2 -translate-x-1/2 -mb-0.5 translate-y-full': tooltipPosition === 'bottom',
               'top-1/2 -translate-y-1/2 -mr-0.5 right-0 translate-x-full': tooltipPosition === 'right'
             }"
             class="tooltip">
          <span x-text="tooltipText"></span>
        </div>

        <div x-ref="content" class="content">
          <slot>Hover me</slot>
        </div>
      </div>
    `;

    // Attach the template content to the shadow root
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    // Check if Alpine is ready before initializing
    if (window.Alpine) {
      Alpine.initTree(this.shadowRoot);
    } else {
      // Wait for Alpine to be ready, then initialize
      document.addEventListener('alpine:init', () => {
        Alpine.initTree(this.shadowRoot);
      });
    }
  }
}

// Define the custom element
customElements.define('vik-tooltip', VikTooltip);

