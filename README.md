# Thriftly: Esusu Savings Manager

Build a mobile-first, highly responsive web application named "Thriftly". This is a Financial Inclusion app designed for local market cooperative admins in Nigeria to manage "Esusu" or "Ajo" (group savings) digitally.

Design & Theme: > The UI must be clean, trustworthy, and extremely easy to use for people who are not tech-savvy. Use a color palette of deep trust-green (like money/growth), crisp white backgrounds, and soft gray cards. Use large, legible fonts and big touch-friendly buttons.

Core Pages & Features: 1. Admin Dashboard (Home):

A greeting header: "Welcome back, Admin."

A large summary card showing "Total Group Savings" (e.g., ₦450,000) and "Active Members" (e.g., 24).

A "Recent Activity" list showing the last 5 deposits (Name, Amount, Time).

A massive, floating, primary action button at the bottom saying "Record New Deposit".

2. Record Deposit Modal/Page (The Magic Feature):

When "Record New Deposit" is clicked, open a clean form.

Include a dropdown to select a "Member".

Include an input field for "Amount (₦)".

Crucial UI Element: Add a prominent "Microphone" icon button next to the amount input with the tooltip "Tap to Speak (e.g., Add 2000 for Amina)". Note: Make this button pulse or look interactive to show voice-to-text capability.

A big "Save Transaction" button.

3. Members List Page:

A searchable list of all cooperative members.

Each member card should show their Avatar/Initials, Name, Phone Number, and their "Current Balance".

Include a progress bar on each member card showing how close they are to their monthly savings goal.

Mock Data: Please populate the app with realistic Nigerian dummy data (e.g., Names like Amina Yusuf, Chinedu Okoro, Babatunde Ali) so the dashboard looks fully active and alive for a demo presentation.

Make the navigation simple, using a bottom tab bar with three icons: Dashboard, Members, and History.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thriftly-ng.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ef4a66f-9031-437d-b310-c0aac7ad6d70).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
