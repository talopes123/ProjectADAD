import express from "express";
import db from "../db/config.js";

const router = express.Router();


//GET´s
// Lista de users com paginacao
router.get("/", async (req, res) => {
  try {
    // Extrai os parametros de paginacao da query string
    const page = parseInt(req.query.page) || 1; // Pagina atual (default: 1)
    const limit = parseInt(req.query.limit) || 20; // Numero de itens por pagina (default: 10)

    // Calcula o numero de documentos a saltar
    const skip = (page - 1) * limit;

    // Pesquisa os users com paginacao
    const results = await db.collection('users')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // Conta o total de documentos na colecao
    const totalUsers = await db.collection('users').countDocuments();

    // Calcula o numero total de paginas
    const totalPages = Math.ceil(totalUsers / limit);

    // Envia a resposta com os dados e metadados de paginacao
    res.status(200).json({
      data: results,
      currentPage: page,
      totalPages,
      totalUsers,
      limit
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao pesquisar users", error });
  }
});


// Pesquisar user pelo _id  e incluir top 3 livros
router.get("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10); // Converte o ID para numero
  
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
      }
  
      // Pesquisa o user pelo _id numerico
      const user = await db.collection('users').findOne({ _id: id });
  
      if (!user) {
        return res.status(404).json({ message: "Usuario nao encontrado" });
      }
  
      // Ordena os livros por pontuacao e pesquisa os top 3
      const topBooksReviews = user.reviews
        .sort((a, b) => b.score - a.score) // Ordena por pontuacao decrescente
        .slice(0, 3); // pesquisa os top 3
  
      // Pesquisa os detalhes dos top 3 livros na colecao 'books'
      const bookIds = topBooksReviews.map(review => review.book_id);
      const topBooks = await db.collection('books')
        .find({ _id: { $in: bookIds } })
        .toArray();
  
      // Mapeia os livros com as suas respectivas pontuacoes
      const topBooksWithScores = topBooks.map(book => {
        const review = topBooksReviews.find(r => r.book_id === book._id);
        return { ...book, score: review.score };
      });
  
      // Resposta
      res.status(200).json({
        user: { _id: user._id, name: user.name },
        topBooks: topBooksWithScores
      });
    } catch (error) {
      console.error("Erro ao pesquisar usuario:", error);
      res.status(500).json({ message: "Erro ao pesquisar usuario", error: error.message || error });
    }
  });


//POST
// Adicionar 1 ou vários users
router.post("/", async (req, res) => {
  try {
    let users = req.body; // Recebe os users do corpo da requisição

    // Verifica se o corpo da requisição contém um único user ou uma lista de users
    if (!Array.isArray(users)) {
      users = [users]; // Se for um único user, transforma em um array
    }

    // Verifica se todos os users possuem os campos obrigatórios
    for (const user of users) {
      if (!user.first_name || !user.last_name ) {
        return res.status(400).json({ message: "Todos os users devem ter 'first_name', 'last_name'." });
      }
    }

    // Obtém o maior _id atualmente na coleção
    const lastUser = await db.collection('users')
      .find({})
      .sort({ _id: -1 }) // Ordena pelo _id em ordem decrescente
      .limit(1) 
      .toArray();

    const nextId = lastUser.length ? lastUser[0]._id + 1 : 1; // Se não houver users, começa do 1

    // Atribui o _id incremental aos novos users
    users = users.map((user, index) => ({
      ...user,
      _id: nextId + index // Garante IDs consecutivos se mais de um user for adicionado
    }));

    // Insere os livros na coleção 'books'
    const result = await db.collection('users').insertMany(users);

    res.status(201).json({
      message: `${result.insertedCount} user(s) adicionado(s) com sucesso.`,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error("Erro ao adicionar user(s):", error);
    res.status(500).json({ message: "Erro ao adicionar user(s)", error: error.message || error });
  }
});


//DELETE
// Remover user pelo _id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Converte o _id para número inteiro

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido. O ID deve ser um número." });
    }

    // Tenta remover o user pelo _id
    const result = await db.collection('users').deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User não encontrado." });
    }

    res.status(200).json({ message: "User removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover user:", error);
    res.status(500).json({ message: "Erro ao remover user.", error: error.message || error });
  }
});

//PUT 
// Atualizar user pelo _id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Converte o _id para número inteiro

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido. O ID deve ser um número." });
    }

    const updateData = req.body;

    // Verifica se o corpo da requisição contém dados para atualizar
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nenhum dado fornecido para atualização." });
    }

    // Atualiza o user na coleção
    const result = await db.collection('users').updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User não encontrado." });
    }

    res.status(200).json({ message: "User atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar livro:", error);
    res.status(500).json({ message: "Erro ao atualizar user.", error: error.message || error });
  }
});


export default router;
