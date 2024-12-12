import express from "express";
import db from "../db/config.js";

const router = express.Router();


//GET´s
// Lista de livros com paginacao
router.get("/", async (req, res) => {
  try {
    // Extrai os parametros de paginacao da query string
    const page = parseInt(req.query.page) || 1; // Pagina atual 
    const limit = parseInt(req.query.limit) || 20; // Numero de itens por pagina 

    // Calcula o numero de documentos a saltar
    const skip = (page - 1) * limit;

    // Pesquisa os livros com paginacao
    const results = await db.collection('books')
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // Conta o total de documentos na colecao
    const totalBooks = await db.collection('books').countDocuments();

    // Calcula o numero total de paginas
    const totalPages = Math.ceil(totalBooks / limit);

    // Envia a resposta com os dados e metadados de paginacao
    res.status(200).json({
      data: results,
      currentPage: page,
      totalPages,
      totalBooks,
      limit
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao pesquisar livros", error });
  }
});


// Lista de livros com mais reviews de 5 estrelas
router.get("/star", async (req, res) => {
  try {
    // Agregação para contar o número de reviews com 5 estrelas por livro
    const bookFiveStarReviews = await db.collection('users').aggregate([
      { $unwind: "$reviews" }, // Desestrutura o array de reviews
      { $match: { "reviews.score": 5 } }, // Filtra apenas os reviews com 5 estrelas
      {
        $group: {
          _id: "$reviews.book_id", // Agrupa por book_id
          fiveStarReviews: { $sum: 1 } // Conta o número de reviews com 5 estrelas
        }
      },
      { $sort: { fiveStarReviews: -1 } } // Ordena pelo número de reviews com 5 estrelas em ordem decrescente
    ]).toArray();

    // Extrai os IDs dos livros com 5 estrelas
    const bookIds = bookFiveStarReviews.map(book => book._id);

    // Pesquisa os detalhes dos livros na coleção 'books'
    const books = await db.collection('books')
      .find({ _id: { $in: bookIds } })
      .toArray();

    // Combina os livros com o número de reviews de 5 estrelas
    const response = books.map(book => {
      const fiveStarData = bookFiveStarReviews.find(r => r._id === book._id);
      return { ...book, fiveStarReviews: fiveStarData.fiveStarReviews };
    });

    // Ordena a resposta final por número de reviews de 5 estrelas em ordem decrescente
    response.sort((a, b) => b.fiveStarReviews - a.fiveStarReviews);

    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao pesquisar livros com 5 estrelas:", error);
    res.status(500).json({ message: "Erro ao pesquisar livros", error: error.message || error });
  }
});


// Lista de livros que têm comentários, ordenados pelo número total de comentários
router.get("/comments", async (req, res) => {
  try {
    // Agregação para contar o número de comentários por livro
    const booksWithComments = await db.collection('comments').aggregate([
      {
        $group: {
          _id: "$book_id", // Agrupa pelos IDs dos livros comentados
          totalComments: { $sum: 1 } // Conta o número total de comentários por livro
        }
      }
    ]).toArray();

    // Extrai os IDs dos livros comentados
    const bookIds = booksWithComments.map(book => book._id);

    // Pesquisa os detalhes dos livros na coleção 'books'
    const books = await db.collection('books')
      .find({ _id: { $in: bookIds } })
      .toArray();

    // Combina os livros com o número total de comentários
    const response = books.map(book => {
      const commentData = booksWithComments.find(c => c._id === book._id);
      return { ...book, totalComments: commentData.totalComments };
    });

    // Ordena a resposta final por número total de comentários em ordem decrescente
    response.sort((a, b) => b.totalComments - a.totalComments);

    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao pesquisar livros com comentários:", error);
    res.status(500).json({ message: "Erro ao pesquisar livros com comentários.", error: error.message || error });
  }
});

// Número total de reviews por "job"
router.get("/job", async (req, res) => {
  try {
    // Agregação para contar o número total de reviews por job
    const reviewsByJob = await db.collection('users').aggregate([
      { $unwind: "$reviews" }, // Desestrutura o array de reviews
      {
        $group: {
          _id: "$job", // Agrupa pelo campo "job"
          totalReviews: { $sum: 1 } // Conta o número total de reviews para cada job
        }
      },
      { $sort: { totalReviews: -1 } } // Ordena pelo número total de reviews em ordem decrescente
    ]).toArray();

    // Formata a resposta
    const response = reviewsByJob.map(jobData => ({
      job: jobData._id,
      totalReviews: jobData.totalReviews
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao pesquisar reviews por job:", error);
    res.status(500).json({ message: "Erro ao pesquisar reviews por job.", error: error.message || error });
  }
});


// Lista de livros filtrada por preco, categoria e/ou autor
router.get("/filter", async (req, res) => {
  try {
    const { priceMin, priceMax, category, author } = req.query;

    // Filtro inicial
    const filter = {};

    // Filtro de preco (se existirem valores válidos)
    if (!isNaN(priceMin)) {
      filter.price = { ...filter.price, $gte: parseFloat(priceMin) };
    }
    if (!isNaN(priceMax)) {
      filter.price = { ...filter.price, $lte: parseFloat(priceMax) };
    }

    // Filtro de categoria
    if (category) {
      filter.categories = { $in: [category] };
    }

    // Filtro de autor
    if (author) {
      filter.authors = { $in: [author] };
    }

    // Pesquisa os livros com base nos filtros
    const books = await db.collection('books')
      .find(filter)
      .toArray();

    if (books.length === 0) {
      return res.status(404).json({ message: "Nenhum livro encontrado com os critérios especificados." });
    }

    res.status(200).json(books);
  } catch (error) {
    console.error("Erro ao pesquisar livros com filtro:", error);
    res.status(500).json({ message: "Erro ao pesquisar livros.", error: error.message || error });
  }
});


// Pesquisar livro por _id e incluir media de pontuacao e comentarios
router.get("/:id", async (req, res) => {
  try {
    const id  = parseInt(req.params.id,10);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID invalido" });
    }
  
    // Pesquisa o livro pelo _id
    const book = await db.collection('books').findOne({ _id: id });

    if (!book) {
      return res.status(404).json({ message: "Livro nao encontrado" });
    }

    // Pesquisa os comentarios relacionados ao livro
    const comments = await db.collection('comments').find({ book_id: id }).toArray();

    // Pesquisa todas as pontuacoes relacionadas ao livro na colecao de usuarios
    const scoresData = await db.collection('users').aggregate([
      { $unwind: "$reviews" }, // Desestrutura o array de scores
      { $match: { "reviews.book_id": id } }, // Filtra pelos scores do livro especifico
      { $project: { _id: 0, score: "$reviews.score" } } // Retem apenas os valores de score
    ]).toArray();

    // Calcula a media das pontuacoes
    const scores = scoresData.map(data => data.score);
    const averageScore = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

    // Resposta completa
    res.status(200).json({
      book,
      averageScore,
      comments
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao pesquisar o livro", error });
  }
});

// Lista de livros com maior média de score, ordenados por ordem decrescente
router.get("/top/:limit", async (req, res) => {
  try {
    const limit = parseInt(req.params.limit, 10);

    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ message: "O parâmetro 'limit' deve ser um número positivo." });
    }

    // Agregação para calcular a média de score por livro
    const bookScores = await db.collection('users').aggregate([
      { $unwind: "$reviews" }, // Desestrutura o array de reviews
      {
        $group: {
          _id: "$reviews.book_id", // Agrupa pelo book_id
          averageScore: { $avg: "$reviews.score" } // Calcula a média das pontuações
        }
      },
      { $sort: { averageScore: -1 } }, // Ordena pela média em ordem decrescente
      { $limit: limit } // Limita o número de livros retornados
    ]).toArray();

    // Extrai os IDs dos livros no top
    const topBookIds = bookScores.map(book => book._id);

    // Pesquisa os detalhes dos livros no top
    const topBooks = await db.collection('books')
      .find({ _id: { $in: topBookIds } })
      .toArray();

    // Combina os livros com suas médias de score
    const response = topBooks.map(book => {
      const scoreData = bookScores.find(score => score._id === book._id);
      return { ...book, averageScore: scoreData.averageScore };
    });

    // Ordena a resposta final por média de score em ordem decrescente
    response.sort((a, b) => b.averageScore - a.averageScore);

    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao pesquisar top livros:", error);
    res.status(500).json({ message: "Erro ao pesquisar top livros", error: error.message || error });
  }
});

//Lista de livros ordenado pelo número total de reviews
router.get("/ratings/:order", async (req, res) => {
  try {
    const { order } = req.params;

    // Validação do parâmetro de ordenação
    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({ message: "O parâmetro 'order' deve ser 'asc' ou 'desc'." });
    }

    // Agregação para contar o número de reviews por livro
    const bookReviewsCount = await db.collection('users').aggregate([
      { $unwind: "$reviews" }, // Desestrutura o array de reviews
      {
        $group: {
          _id: "$reviews.book_id", // Agrupa pelo book_id
          totalReviews: { $sum: 1 } // Conta o número de reviews
        }
      },
      { $sort: { totalReviews: -1 } } // Ordena inicialmente por total de reviews (desc)
    ]).toArray();

    // Extrai os IDs dos livros
    const bookIds = bookReviewsCount.map(book => book._id);

    // Pesquisa os detalhes dos livros na coleção 'books'
    const books = await db.collection('books')
      .find({ _id: { $in: bookIds } })
      .toArray();

    // Combina os livros com o número total de reviews
    const response = books.map(book => {
      const reviewData = bookReviewsCount.find(r => r._id === book._id);
      return { ...book, totalReviews: reviewData.totalReviews };
    });

    // Ordena a resposta final com base no parâmetro `order`
    response.sort((a, b) => {
      return order === "asc" ? a.totalReviews - b.totalReviews : b.totalReviews - a.totalReviews;
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao pesquisar livros ordenados por reviews:", error);
    res.status(500).json({ message: "Erro ao pesquisar livros", error: error.message || error });
  }
});

// Lista de livros avaliados no ano especificado
router.get("/year/:year", async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);

    if (isNaN(year) || year < 1000 || year > new Date().getFullYear()) {
      return res.status(400).json({ message: "Ano inválido. Deve ser um número entre 1000 e o ano atual." });
    }

    // Definir o intervalo de datas para o ano especificado
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    // Pesquisa os livros cuja publishedDate está dentro do intervalo do ano
    const booksInYear = await db.collection('books')
      .find({
        publishedDate: {
          $gte: startDate,
          $lt: endDate
        }
      })
      .toArray();

    if (booksInYear.length === 0) {
      return res.status(404).json({ message: `Nenhum livro encontrado para o ano ${year}.` });
    }

    res.status(200).json(booksInYear);
  } catch (error) {
    console.error("Erro ao pesquisar livros por ano:", error);
    res.status(500).json({ message: "Erro ao pesquisar livros.", error: error.message || error });
  }
});

//POST
// Adicionar 1 ou vários livros
router.post("/", async (req, res) => {
  try {
    let books = req.body; // Recebe os livros do corpo da requisição

    // Verifica se o corpo da requisição contém um único livro ou uma lista de livros
    if (!Array.isArray(books)) {
      books = [books]; // Se for um único livro, transforma em um array
    }

    // Verifica se todos os livros possuem os campos obrigatórios
    for (const book of books) {
      if (!book.title || !book.author || !book.year) {
        return res.status(400).json({ message: "Todos os livros devem ter 'title', 'author' e 'year'." });
      }
    }


    // Obtém o maior _id atualmente na coleção
    const lastBook = await db.collection('books')
      .find({})
      .sort({ _id: -1 }) // Ordena pelo _id em ordem decrescente
      .limit(1) 
      .toArray();

    const nextId = lastBook.length ? lastBook[0]._id + 1 : 1; // Se não houver livros, começa do 1

    // Atribui o _id incremental aos novos livros
    books = books.map((book, index) => ({
       ...book,
      _id: nextId + index // Garante IDs consecutivos se mais de um livro for adicionado
    }));


    // Insere os livros na coleção 'books'
    const result = await db.collection('books').insertMany(books);

    res.status(201).json({
      message: `${result.insertedCount} livro(s) adicionado(s) com sucesso.`,
      insertedIds: result.insertedIds
    });

  } catch (error) {
    console.error("Erro ao adicionar livro(s):", error);
    res.status(500).json({ message: "Erro ao adicionar livro(s)", error: error.message || error });
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

    // Tenta remover o livro pelo _id
    const result = await db.collection('books').deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Livro não encontrado." });
    }

    res.status(200).json({ message: "Livro removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover livro:", error);
    res.status(500).json({ message: "Erro ao remover livro.", error: error.message || error });
  }
});

//PUT
// Atualizar livro pelo _id
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

    // Atualiza o livro na coleção
    const result = await db.collection('books').updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Livro não encontrado." });
    }

    res.status(200).json({ message: "Livro atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar livro:", error);
    res.status(500).json({ message: "Erro ao atualizar livro.", error: error.message || error });
  }
});





export default router;
