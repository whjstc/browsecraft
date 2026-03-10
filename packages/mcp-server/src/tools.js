/**
 * MCP 工具定义
 */

export const tools = [
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Get accessibility snapshot of the page with clickable refs (e1, e2, e3...). Use refs with browser_click_ref and browser_fill_ref.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_click',
    description: 'Click an element by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to click' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'browser_click_ref',
    description: 'Click an element by ref from snapshot (e.g., e2)',
    inputSchema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'Element ref from snapshot (e.g., e2)' },
      },
      required: ['ref'],
    },
  },
  {
    name: 'browser_fill',
    description: 'Fill text into an input field by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of input field' },
        text: { type: 'string', description: 'Text to fill' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'browser_fill_ref',
    description: 'Fill text into an input field by ref from snapshot',
    inputSchema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'Element ref from snapshot (e.g., e3)' },
        text: { type: 'string', description: 'Text to fill' },
      },
      required: ['ref', 'text'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page. Returns base64 encoded image.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Optional file path to save screenshot' },
      },
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the browser and return the result',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'JavaScript expression to evaluate' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'browser_info',
    description: 'Get current page URL and title',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_back',
    description: 'Navigate back in browser history',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_forward',
    description: 'Navigate forward in browser history',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_wait',
    description: 'Wait for an element to appear on the page',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for' },
        timeout: { type: 'number', description: 'Timeout in milliseconds (default 30000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'browser_dismiss_cookies',
    description: 'Automatically dismiss cookie consent banners',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
]
