import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";


   const router = express.Router();
  
//GET

   router.get("/", async (req, res) => {
     let results = await db.collection('comments').find({})
       .toArray();
     res.send(results).status(200);
   });


   
   //POST
   // Adicionar novo comentário a um livro
   router.post("/", async (req, res) => {
     try {
       const { book_id, comment, user_id } = req.body;
   
       // Validação de campos obrigatórios
       if (!book_id || !comment || !user_id) {
         return res.status(400).json({ message: "Os campos 'user_id', 'book_id' e 'comment'  são obrigatórios." });
       }
   
       // Verifica se o livro existe
       const bookExists = await db.collection('books').findOne({ _id: parseInt(book_id, 10) });
       if (!bookExists) {
         return res.status(404).json({ message: "Livro não encontrado." });
       }
   
       // Verifica se o usuário existe
       const userExists = await db.collection('users').findOne({ _id: parseInt(user_id, 10) });
       if (!userExists) {
         return res.status(404).json({ message: "User não encontrado." });
       }
   
       // Busca o último _id existente na coleção de comentários
       const lastComment = await db.collection('comments')
         .find({})
         .sort({ _id: -1 }) // Ordena em ordem decrescente por _id
         .limit(1)
         .toArray();
   
       const nextId = lastComment.length ? lastComment[0]._id + 1 : 1; // Incrementa o _id ou começa com 1 se vazio
   
       // Insere o novo comentário na coleção 'comments'
       const newComment = {
         _id: nextId,
         user_id: parseInt(user_id, 10),
         book_id: parseInt(book_id, 10),
         comment,
         date: Date.now()
       };
   
       await db.collection('comments').insertOne(newComment);
   
       res.status(201).json({
         message: "Comentário adicionado com sucesso.",
         commentId: nextId
       });
     } catch (error) {
       console.error("Erro ao adicionar comentário:", error);
       res.status(500).json({ message: "Erro ao adicionar comentário.", error: error.message || error });
     }
   });


   //DELETE
   // Remover livro pelo _id
  router.delete("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10); // Converte o _id para número inteiro

      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido. O ID deve ser um número." });
    } 

      // Tenta remover o comentario pelo _id
      const result = await db.collection('comments').deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Comentario não encontrado." });
    }

      res.status(200).json({ message: "Comentario removido com sucesso." });
  }   catch (error) {
      console.error("Erro ao remover comentario:", error);
      res.status(500).json({ message: "Erro ao remover comentario.", error: error.message || error });
  }
});


   export default router;