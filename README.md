# ezlisten-backend

## Local Development

Install dependencies:

```sh
npm install
```

Create a `.env` file in the root directory. See `.env.example` for the supported variables.

Start MongoDB outside this repo, then run the API:

```sh
npm run dev
```

The backend checks `MONGO_URL`, `MONGODB_URL`, and `MONGODB_URI`, matching the YAS backend convention. In development, it falls back to `mongodb://localhost:27017/ezlisten`.