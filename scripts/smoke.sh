#!/usr/bin/env bash
#
# Post-deploy smoke check.
#
# Exists because the most damaging failure this app has hit was invisible both
# locally and in the test suite: Netlify's CDN keyed the /api/og cache on the
# path only, so every share card served one stranger's numbers. Nothing errored.
# A unit test cannot reach a CDN, so the cache key has to be asserted against a
# real deployment.
#
# Usage:  scripts/smoke.sh [base-url]
#         scripts/smoke.sh https://rooftopsolarindia.netlify.app

set -uo pipefail

BASE="${1:-${NEXT_PUBLIC_SITE_URL:-https://rooftopsolarindia.netlify.app}}"
BASE="${BASE%/}"
FAILED=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILED=$((FAILED + 1)); }
skip() { printf '  \033[33mskip\033[0m %s\n' "$1"; }

echo "Smoke-testing $BASE"

# --- pages -----------------------------------------------------------------
echo
echo "Pages"
for path in / /tools /tools/subsidy-calculator /tools/bill-to-size \
  /tools/savings-payback /tools/loan-emi /solar-subsidy /solar-subsidy/gujarat \
  /solar-panel-price /solar-panel-price/pune /sources /privacy /terms /contact \
  /robots.txt /sitemap.xml; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$BASE$path" || echo 000)"
  if [ "$code" = "200" ]; then pass "$path"; else fail "$path returned $code"; fi
done

# --- the app, not the scaffold ---------------------------------------------
echo
echo "Serving the app"
curl -sS -o "$TMP/home.html" --max-time 30 "$BASE/" || true
if grep -q 'Create Next App' "$TMP/home.html"; then
  fail "serving the create-next-app scaffold — is the host building the right branch?"
elif grep -q 'rooftop solar' "$TMP/home.html"; then
  pass "home page is the real app"
else
  fail "home page content unrecognised"
fi

# --- OG cards: distinct inputs MUST yield distinct images -------------------
echo
echo "Share cards"
curl -sS -o "$TMP/a.png" --max-time 40 "$BASE/api/og?kind=savings&value=1838000&place=Pune&kw=3" || true
curl -sS -o "$TMP/b.png" --max-time 40 "$BASE/api/og?kind=subsidy&value=88000&place=Gujarat&kw=3" || true
curl -sS -o "$TMP/c.png" --max-time 40 "$BASE/api/og?kind=savings&value=1838000&place=Pune&kw=3&size=sq" || true

dims() {
  python3 -c "
import struct, sys
d = open(sys.argv[1], 'rb').read()
if d[:8] != b'\x89PNG\r\n\x1a\n':
    print('notpng'); raise SystemExit
w, h = struct.unpack('>II', d[16:24])
print(f'{w}x{h}')
" "$1" 2>/dev/null || echo "unreadable"
}

[ "$(dims "$TMP/a.png")" = "1200x630" ] \
  && pass "1200x630 card renders" \
  || fail "1200x630 card is $(dims "$TMP/a.png")"

[ "$(dims "$TMP/c.png")" = "1080x1080" ] \
  && pass "1080x1080 card renders" \
  || fail "1080x1080 card is $(dims "$TMP/c.png") — the size param is being dropped or cached away"

sum() { python3 -c "import hashlib,sys; print(hashlib.md5(open(sys.argv[1],'rb').read()).hexdigest())" "$1"; }

if [ "$(sum "$TMP/a.png")" = "$(sum "$TMP/b.png")" ]; then
  fail "two different cards are byte-identical — the CDN is ignoring the query string in its cache key"
else
  pass "distinct inputs produce distinct cards"
fi

# --- short links ------------------------------------------------------------
echo
echo "Short links"
token="$(python3 -c "
import base64, json
print(base64.urlsafe_b64encode(json.dumps({'t':'savings','s':'maharashtra','c':'pune','k':3}).encode()).decode().rstrip('='))
")"
target="$(curl -sS -o /dev/null -w '%{redirect_url}' --max-time 30 "$BASE/r/$token" || true)"
case "$target" in
  *"/tools/savings-payback?"*"city=pune"*) pass "/r/{token} reopens the tool prefilled" ;;
  *) fail "/r/{token} redirected to '${target:-nothing}'" ;;
esac

# --- lead API: the consent gate is a product rule, not a nicety ------------
echo
echo "Lead capture"
# /api/lead rate-limits to 5 requests per minute per IP, and it counts rejected
# attempts too — deliberately, so the endpoint cannot be probed for free. That
# means these checks can trip the limiter, either because the script ran twice
# inside a minute or because someone was testing by hand. A 429 is the limiter
# working, not a defect, so it is reported as a skip rather than a failure.
check_lead() {
  local label="$1" expected="$2" payload="$3"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -X POST \
    -H 'Content-Type: application/json' -d "$payload" "$BASE/api/lead" || echo 000)"
  case "$code" in
    "$expected") pass "$label ($expected)" ;;
    429) skip "$label — rate limited (429). The limiter is working; wait a minute and re-run." ;;
    *) fail "$label returned $code, expected $expected" ;;
  esac
}

check_lead "rejects a lead with no consent" 422 \
  '{"name":"Smoke Test","phone":"9876543210","tool":"smoke","sourcePage":"/","consentGiven":false}'

check_lead "rejects a malformed phone number" 400 \
  '{"name":"Smoke Test","phone":"12345","tool":"smoke","sourcePage":"/","consentGiven":true,"consentText":"smoke"}'

# --- consent notice reachable at the point of consent ----------------------
echo
echo "Consent notice"
if grep -q 'href="/privacy"' "$TMP/home.html"; then
  pass "the consent form links the privacy policy"
else
  fail "no /privacy link on the page carrying the consent checkbox"
fi

# --- indexing: robots.txt, the page meta and the sitemap must agree ---------
echo
echo "Indexing"
robots="$(curl -sS --max-time 30 "$BASE/robots.txt" || true)"
meta="$(grep -oE '<meta name="robots" content="[^"]*"' "$TMP/home.html" | head -1)"
# grep -c prints "0" and exits 1 when there are no matches, so an `|| echo 0`
# fallback appends a second line and breaks the arithmetic below.
locs="$(curl -sS --max-time 30 "$BASE/sitemap.xml" | grep -c '<loc>')"

if printf '%s' "$robots" | grep -qE '^Disallow: /$'; then
  # Closed: all three must be shut, or a crawler gets contradictory signals.
  case "$meta" in
    *noindex*)
      [ "$locs" -eq 0 ] \
        && pass "closed to crawlers — robots.txt, page meta and empty sitemap agree" \
        || fail "robots.txt disallows everything but the sitemap still lists $locs URLs" ;;
    *) fail "robots.txt disallows everything but the page meta says '$meta'" ;;
  esac
else
  # Open: the sitemap has to actually contain the inventory.
  case "$meta" in
    *noindex*) fail "robots.txt allows crawling but the page meta says noindex — inconsistent" ;;
    *)
      if [ "$locs" -lt 50 ]; then
        fail "open to crawlers but the sitemap only lists $locs URLs — expected the full page inventory"
      else
        pass "open to crawlers — robots.txt, page meta and $locs sitemap URLs agree"
      fi ;;
  esac
fi

# --- schema must not advertise endpoints that do not exist ------------------
echo
echo "Structured data"
if grep -q 'SearchAction' "$TMP/home.html"; then
  fail "WebSite schema still declares a SearchAction, but there is no /search page"
else
  pass "no SearchAction pointing at a missing /search page"
fi

echo
if [ "$FAILED" -eq 0 ]; then
  echo "All checks passed."
else
  echo "$FAILED check(s) failed."
fi
exit "$FAILED"
