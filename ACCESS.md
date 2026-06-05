# Accessing HUMAIN Create Studio

**Live URL:** https://cms.34-14-150-134.sslip.io/login

The platform is hosted on a GCP VM (`34.14.150.134`) and is open to the whole
internet over HTTPS. If you can't reach it, it's almost always your **local
network's DNS blocking the `sslip.io` domain** (a common corporate/ISP security
filter) — not the server being down. The fix below points your machine straight
at the server, bypassing the broken DNS lookup.

---

## Quick fix — add one line to your hosts file

The line to add:

```
34.14.150.134   cms.34-14-150-134.sslip.io
```

### macOS / Linux

```bash
echo "34.14.150.134   cms.34-14-150-134.sslip.io" | sudo tee -a /etc/hosts
# flush DNS cache:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder   # macOS
# (Linux: skip the line above; if needed) sudo systemd-resolve --flush-caches
```

### Windows

1. Open **Notepad as Administrator** (right-click → *Run as administrator*).
2. File → Open → `C:\Windows\System32\drivers\etc\hosts`
3. Add the line above at the bottom, then Save.
4. Open Command Prompt as Administrator and run: `ipconfig /flushdns`

### Then

Fully quit and reopen your browser, then go to
**https://cms.34-14-150-134.sslip.io/login**

It will load with a valid HTTPS padlock (the TLS certificate is issued for that
exact hostname, so there's no security warning).

---

## Why this works

- The server is up and reachable from anywhere (firewall open on ports 80/443,
  public DNS resolves the name correctly).
- Some corporate networks and ISPs block the whole `sslip.io` domain at the DNS
  layer because wildcard-DNS services are sometimes abused. When that happens the
  browser shows *"This site can't be reached"* (`DNS_PROBE_FINISHED_NXDOMAIN`).
- The hosts-file entry gives your browser the server's IP directly, so it never
  needs to ask the (blocked) DNS resolver.

## If it still doesn't open

Then the network is filtering deeper than DNS (e.g. SNI/proxy inspection of
`sslip.io`, which is rarer). The hosts trick won't be enough in that case —
contact the platform owner to set up an alternate link (a real domain or a
Cloudflare tunnel).

---

## Login

Ask the platform owner for credentials. Roles available: viewer, author,
reviewer, publisher, brand, admin.
