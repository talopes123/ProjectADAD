
   import express from 'express'
   import cors from "cors"

   import books from "./routes/books.js"
   import users from "./routes/users.js"
   import livrarias from "./routes/livrarias.js"
   import comments from "./routes/comments.js"



   const app = express()
   const port = 3000

   app.use(cors());
   app.use(express.json());

   // Load the /movies routes
   app.use("/books", books);

   // Load the /users routes
   app.use("/users", users);

   // Load the /comments routes
   app.use("/comments", comments);

   // Load the /livrarias routes
   app.use("/livrarias", livrarias);

   app.listen(port, () => {
     console.log(`backend listening on port ${port}`)
})