# JebDekho Vendor Web

This app is deprecated. Do not add new vendor-facing implementation here.

Use the merchant web app for current partner operations:

- Production destination: https://merchant.jebdekho.com
- Recommended edge behavior: return a safe 404 or 301 redirect vendor routes to the merchant app.
- PM2/nginx entries for this app should be disabled during production cleanup after manual deploy review.
