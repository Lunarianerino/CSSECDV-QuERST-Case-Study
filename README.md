This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
The QuERST matchmaking system involves a Next.js stack to serve both backend and frontend code. 
Persistence goes through a MongoDB database.

### Development Software
- **BARE MINIMUM:** [Node.js](https://nodejs.org/en/download)
- [MongoDB - if you don't want to run Docker](https://www.mongodb.com/products/updates/version-release)
- [Docker - if you want to run a containerized database](https://www.docker.com)
- [WebStorm - IDE option for development (Non-commercial license available)](https://www.jetbrains.com/webstorm/)
- [Visual Studio Code - Code Editor option for development](https://code.visualstudio.com)

### Running the project with Docker
Generally, you won't need to actually do anything but install Docker before running this command:
```bash
npm run devdocker
```

This will configure a default MongoDB instance with a local user name and password for DB access.
These credentials are used by the `MONGO_DB_URI` environment variable that's configured before running `next dev`.
Drop-in replacements for `npm` can be used like `yarn`, `pnpm`, or `bun`.

### Running the project without Docker
First, check if MongoDB is configured and an environment variable for `MONGO_DB_URI` is configured before running the development server:
```bash
npm run dev
```
Drop-in replacements for `npm` can be used like `yarn`, `pnpm`, or `bun`.

### Accessing the website for local development
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. This step is the same regardless of whether you ran the project with Docker or not.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
