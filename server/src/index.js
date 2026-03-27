import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

const bootstrap = async () => {
  await connectDatabase(env.MONGODB_URI);

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});
