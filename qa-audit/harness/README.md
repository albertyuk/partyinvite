# Audit harness

Scripts used to capture the evidence behind these reports. Kept for reproducibility.

## Why request interception?
This environment routes outbound HTTPS through a TLS-re-terminating egress proxy that rejects
Chromium's TLS ClientHello (so `page.goto` fails with `ERR_CONNECTION_CLOSED`). Node's `fetch`
works through the proxy, so the harness renders pages in Chromium but fulfills **every** request
via Node `fetch` — which also yields precise per-request status/size/failure evidence.

## Run
```bash
npm install playwright axe-core lighthouse chrome-launcher   # browsers pre-installed at /opt/pw-browsers
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
export NODE_USE_ENV_PROXY=1                      # Node fetch -> egress proxy
export NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
export REPO_DIR=/path/to/repo                    # evidence written to $REPO_DIR/qa-audit/evidence
node audit.mjs <company>     # flick|uplane|scalarfield|dex|yondu|contrario|naive
node verify.mjs <company>    # independent curl re-verification (real sizes, favicon, 404 probe)
```
`report-workflow.mjs` is the multi-agent draft→verify orchestration that produced `audit-*.md`.

## Accuracy discipline
- Only **first-party** (same registrable domain) failures are treated as reliable; third-party
  failures can be egress/UA artifacts.
- Findings are re-verified with `curl` before being reported. See the top-level README's
  _Method & caveats_ for the full exclusion list.
