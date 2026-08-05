# 🌱 How to publish your own Commit Garden (no coding needed)

This guide is for you if you've never used GitHub beyond having an
account, and want your own copy of the garden page live on the internet,
for free, in a few minutes. No software to install, no code to write.

## What you'll end up with

A link of your own, something like:

```
https://your-username.github.io/git-flowers/?user=your-username
```

that you can send to anyone, showing a pixel garden that grows based on
your real GitHub activity.

## Step 1 — Get your own copy of the project

1. Go to this project's repository page on GitHub (the URL you were
   given).
2. Top right, you'll see a button that says **"Fork"**. Click it.
3. GitHub will ask which account to create the copy in — pick yours.
4. Wait a few seconds: now you have your own copy of the project, at the
   same address but with your username in front.

> "Fork" just means "copy this project to my account." You don't break
> anything in the original and you don't need to ask anyone's permission.

## Step 2 — Turn on GitHub Pages (so it's live on the internet)

1. In **your copy** of the repository, find the **"Settings"** tab (top,
   next to "Code", "Issues", etc.).
2. In the left menu, click **"Pages"**.
3. Where it says **"Build and deployment"**, in the **"Source"**
   dropdown, choose **"Deploy from a branch"**.
4. Two dropdowns will show up below: pick the **`main`** branch (or
   `master`, whichever shows by default) and the **`/ (root)`** folder.
5. Click **"Save"**.
6. Wait 1-2 minutes. If you go back into **Settings → Pages**, a green
   banner will show up at the top with your site's link, something like:

   ```
   Your site is live at https://your-username.github.io/git-flowers/
   ```

## Step 3 — Check out your garden

Open that link. You'll see a box to type a GitHub username. Type the
username of the garden you want to see (yours, or anyone with a public
profile) and click **"Grow 🌼"**.

To build a direct link to a specific garden, add `?user=` plus the
username at the end, for example:

```
https://your-username.github.io/git-flowers/?user=torvalds
```

## Step 4 — Share it

Once the garden loads, a **"Share garden"** button appears. Clicking it
automatically copies the link to your clipboard, ready to paste wherever
you want (WhatsApp, Twitter/X, anywhere).

## FAQ

**Does this ask for my GitHub password or a token?**
No. The page only reads information that's already public on any GitHub
profile (the same green squares grid you see on your profile). It never
asks for a username, password, or access token.

**Does it cost anything?**
No, GitHub Pages is free for public repositories.

**I entered my username and nothing shows up / there's an error**
- Check that the username is spelled correctly.
- If your GitHub profile has its contribution history hidden in privacy
  settings, the page won't be able to show it (since it's precisely not
  public).
- Wait a minute and try again: the data source might be momentarily busy.

**Can I change the site's name or colors?**
Yes, but that means "touching code." For that, check the other project
file, [`README.md`](./README.md), written for people who code.

**How do I stop showing the garden / delete my copy?**
In your repository (your fork), go to **Settings**, scroll down to the
red **"Danger Zone"** section, and choose **"Delete this repository"**.
This deletes your copy and the site stops being available.

## Credits and license

This project is open source under the MIT license (see
[`LICENSE`](./LICENSE)): you can use, copy, and modify it freely, even
for commercial purposes, as long as you keep the original license notice.
