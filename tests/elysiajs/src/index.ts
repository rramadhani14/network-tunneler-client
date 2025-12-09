import { Elysia } from "elysia";

const app = new Elysia()
.get("/", () => {
  return {"message": "Hello Elysia"}
})
.post("/", (context) => {
  console.log(context.body);
})
.listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
