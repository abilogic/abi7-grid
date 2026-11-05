# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 1.0.x | Yes |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Report it privately via https://abi7.com `[security contact e-mail — TO BE COMPLETED]`, or use GitHub's private vulnerability reporting for https://github.com/abilogic/abi7-grid if it is enabled.

Include: the affected version, a minimal reproduction, and the impact. You will get an acknowledgement; there is no guaranteed response time for the free Community Edition.

## Scope notes

The standard card is built with the DOM API (`textContent`, `setAttribute`) and URLs are filtered (`http(s):`, `blob:`, `data:image/*`, relative). The `allowHTML` option and a custom `renderItem` that returns HTML disable that protection: sanitizing the data is then your responsibility.
