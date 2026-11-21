# Quabbin PC Repair website

A lightweight, responsive single-page website for Quabbin PC Repair (Barre, MA).
Plain HTML, CSS and JavaScript. No build step, no frameworks, no backend, no paid services.

## Folder structure

```
quabbin-pc-repair/
├── index.html            Page content (all sections, price list, form)
├── 404.html              "Page not found" page (used by GitHub Pages / Cloudflare Pages)
├── site.webmanifest      Icon + theme info for phones
├── robots.txt
├── css/
│   └── styles.css        All styles: tokens, components, sections, responsive rules
├── js/
│   ├── config.js         ← YOUR SETTINGS (email, phone, optional form service)
│   └── main.js           Menu, scroll effects, form validation and sending
└── assets/
    ├── favicon.svg, favicon-32.png, apple-touch-icon.png, icon-512.png
    ├── og-image.png      Preview image for links shared on social media / messages
    ├── fonts/            Zilla Slab, Kalam (handwriting), IBM Plex Sans, IBM Plex Mono (SIL OFL)
    └── icons/            Lucide license (the few icons used are inlined in index.html)
```

Where to edit things:

| To change…                         | Edit                                                    |
|-----------------------------------|---------------------------------------------------------|
| Email, phone, form service        | `js/config.js`                                          |
| Services, descriptions, prices    | the price list in `index.html` (search `data-service`). The form's service dropdown updates itself from this list. |
| Towns in the service area         | the `towns` list in `index.html`                        |
| Colors, fonts, spacing            | the `:root` tokens at the top of `css/styles.css`       |
| Page title / description (SEO)    | the `<head>` of `index.html`                            |
| Business details for search engines | the `ld+json` block in the `<head>` (a `LocalBusiness` with service-area towns and no street address). Keep its town list in step with the visible one. |
| Privacy notice, repair authorization | the "The fine print" section near the bottom of `index.html` (`id="privacy"`, `id="authorization"`) |

## Run it locally

Option A: double-click `index.html`. Everything works from the file, including the menu and form.

Option B (closer to real hosting): run a tiny local server from this folder, then open http://localhost:8000

```
python3 -m http.server 8000
# or
npx serve .
```

## How the repair form works

The form never pretends to send something it didn't. It has three modes, picked automatically from `js/config.js`:

1. **Demo mode** (nothing configured, the default). A notice says the form isn't connected. Pressing the button shows a preview of the request and clearly says nothing was sent.
2. **Email mode** (`contactEmail` set, `formEndpoint` empty). Pressing "Continue in email" opens the visitor's email app with the request filled in and addressed to you. The confirmation tells them it is only sent when they press Send, and offers a "Copy request text" button for people who use webmail.
3. **Form service mode** (`formEndpoint` set). The form posts in the background and only shows "Request sent" if the service answers with success. On failure it says so and offers to send by email instead.

Free form services that work with mode 3 (no code changes needed): Formspree (free tier), Basin, Getform, or a Cloudflare Pages Function / Worker if you want to self-host later. With Formspree: create a form, copy its URL (`https://formspree.io/f/xxxxxxx`) into `formEndpoint`, and confirm your email the first time a submission arrives.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `quabbin-pc-repair`) and upload the contents of this folder to it (so `index.html` is at the top level).
2. In the repository go to **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/quabbin-pc-repair/`.
5. Optional custom domain: add it under Settings → Pages → Custom domain and follow GitHub's DNS instructions.

The 404 page works out where the site lives on its own, so its "Back" link goes to `/quabbin-pc-repair/` on a project URL and to `/` on a custom domain. If you'd rather hard-code it, set `SITE_BASE` near the bottom of `404.html`.

## Deploy to Cloudflare Pages

1. Sign in at dash.cloudflare.com → **Workers & Pages → Create → Pages**.
2. Either **Connect to Git** (pick the GitHub repo) or **Upload assets** (drag in this folder).
3. Build settings: Framework preset **None**, build command **empty**, output directory **`/`** (or blank).
4. Deploy. You get a `https://<project>.pages.dev` URL, and can add a custom domain under the project's **Custom domains** tab.

## Checklist before publishing

### Things only you can do

- [x] **Business email:** `quabbinrepair@gmail.com` is set as `contactEmail` in `js/config.js`, and also written into the contact links and the `ld+json` block in `index.html` (so it shows even if JavaScript is off). If it ever changes, update all three. With it set, the form is in email mode.
- [ ] **Choose how the form sends**, then **test it**:
  - *Email mode:* just set `contactEmail`. Test on a phone and a computer: the email app should open with the request filled in.
  - *Form service:* create a free Formspree (or similar) form, paste its URL into `formEndpoint`, submit a test request, confirm the address when Formspree asks, and check it lands in your inbox. Also try it with the network switched off to see the "didn't go through" message.
  - If you use a form service, name it in the privacy notice ("How it gets to me") so it's accurate, e.g. "…through Formspree, a form-handling service that forwards it to my inbox".
- [ ] **Deploy** (GitHub Pages or Cloudflare Pages, steps above), then click through every link on the live site, including a made-up address to see the 404 page.

### Check the wording matches how you work

- [ ] **Policies.** The privacy notice and repair authorization were written from what you've decided so far: diagnostics is $10 and credited toward an approved repair, nothing beyond diagnosis without approval, extra work quoted first, no marketing use of personal data, no cookies or analytics. Read them through. In particular, confirm you're happy to commit to "kept only as long as needed" and "I don't look through your personal files".
- [ ] **Policies you haven't decided yet, which aren't on the site:** how people pay, whether you ask for payment up front for parts, what happens to computers left uncollected, and whether you offer any guarantee on your work. Add them to the repair authorization list once you decide. Leave them out rather than guessing.
- [ ] **If you ever add analytics or cookies**, update the "This website" line in the privacy notice.
- [ ] This is plain-language information, not legal advice. If the business grows or registers, it's worth having someone check the policies.

### Other settings

- [ ] **Phone (optional):** set `phone` only if you want it public. It stays hidden while empty.
- [ ] **Check the town list** in the Service area section. It currently lists the towns that border Barre (Hardwick, Petersham, Phillipston, Templeton, Hubbardston, Rutland, Oakham, New Braintree). Trim or extend to where you're actually willing to serve, and update `areaServed` in the `ld+json` block to match.
- [ ] **Review the wording and prices.** The copy is written in the first person ("I fix…"). Check the price list, the handwritten notes, the About section and the FAQ so everything matches how you actually work.
- [ ] **Once you have a domain:** in `index.html`'s `<head>`, add `<link rel="canonical" href="https://yourdomain/">`, add `<meta property="og:url" content="https://yourdomain/">`, and change `og:image` to the full URL `https://yourdomain/assets/og-image.png` (social sites need absolute URLs).
- [ ] **Business registration:** if you later register the business, you can add the legal name to the footer. Don't add a street address unless you want it public; the site currently says the drop-off location is shared after an appointment is set.

## Credits & licenses

- Icons: [Lucide](https://lucide.dev), ISC license (`assets/icons/LICENSE-lucide.txt`).
- Fonts: Zilla Slab, Kalam, IBM Plex Sans, IBM Plex Mono, SIL Open Font License 1.1, via Fontsource.
- Favicon and preview image were made for this site.
