# Notion to ICS

A SvelteKit-based site to export a Notion database to an ICS calendar, suitable for importing into Google Calendar.

## Configuring

For more information on the first 4 steps, see the [Notion docs](https://developers.notion.com/docs/getting-started).

1. Create a new Notion integration by visiting https://www.notion.so/my-integrations. We only need the "Read content" and "No user information" capabilities. This should be an internal integration.
2. Copy your internal integration token into `.env` as `NOTION_TOKEN`.
3. Share the database(s) you want with the integration by opening your database as a page, going to "Share", and selecting your integration.
4. Save your database's ID by copying the database URL and selecting the part between the slash and the question mark. The ID is 32 characters.
5. Configure a secret key (you can use `node -e "require('crypto').randomBytes(48, function(ex, buf) { console.log(buf.toString('base64')) });"` to generate one) in `.env` as `ACCESS_KEYS`.
6. Update `CONFIG_JSON` in your env file.
   1. First, add a correct filter. You can use the default configuration as a guide, see the Notion docs for the [filter schema reference](https://developers.notion.com/reference/post-database-query#post-database-query-filter). Be careful to use double quotes for JSON and single quotes for `CONFIG_JSON`.
   2. Then, add your `dateProperty` (the property that will be used to generate the event's start time) and `titleProperty`, and `titleProperty` (the property that will be used to generate the event's title). You must use the property's name (in th Notion UI).
7. Build and deploy the site! For example, on [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) with the correct [adapter](https://kit.svelte.dev/docs#adapters). Your calendar will be accessable at `/<database id>.ics?secret=<generated secret>` (don't forget to expose all environment variables to your build).

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then:

```bash
npm run build
```

> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.
