# LinkedIn Outreach Example

Goal: open LinkedIn, navigate to a target profile list, and send outreach with stable page interactions.

Suggested flow:

1. `browsecraft status`
2. `browsecraft start --type roxy --roxy-window-id <dirId>`
3. `browsecraft open https://www.linkedin.com`
4. `browsecraft snapshot`
5. Use `click-ref` / `fill-ref` to move through search, profile, and connect/message flows
6. `browsecraft screenshot linkedin-outreach.png`
7. Report completed actions and any blocked profiles
