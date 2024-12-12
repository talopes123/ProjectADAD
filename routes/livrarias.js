import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";


   const router = express.Router();
  
   router.get("/", async (req, res) => {
     let results = await db.collection('livrarias').find({})
       .toArray();
     res.send(results).status(200);
   });



   // Lista de livrarias perto de uma localização 
router.get("/near", async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    // Validação das coordenadas
    if (!longitude || !latitude) {
      return res.status(400).json({ message: "As coordenadas 'longitude' e 'latitude' são obrigatórias." });
    }

    const longitudeNum = parseFloat(longitude);
    const latitudeNum = parseFloat(latitude);

    if (isNaN(longitudeNum) || isNaN(latitudeNum)) {
      return res.status(400).json({ message: "As coordenadas devem ser números válidos." });
    }

    // Consulta geoespacial com filtro de tipo Point
    const filter = {
      "geometry.type": "Point", // Garantir que apenas documentos Point são considerados
      "geometry": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitudeNum, latitudeNum]
          },
          ...(maxDistance && { $maxDistance: parseInt(maxDistance, 10) }) // Define a distância máxima se fornecida
        }
      }
    };

    // Pesquisa as livrarias próximas
    const livrarias = await db.collection('livrarias')
      .find(filter)
      .toArray();

    if (livrarias.length === 0) {
      return res.status(404).json({ message: "Nenhuma livraria encontrada próxima à localização fornecida." });
    }

    res.status(200).json(livrarias);
  } catch (error) {
    console.error("Erro ao pesquisar livrarias próximas:", error);
    res.status(500).json({ message: "Erro ao pesquisar livrarias próximas.", error: error.message || error });
  }
});

// Lista de livrarias dentro da área de um polígono criado por dois pontos
router.get("/route", async (req, res) => {
  try {
    const { startLongitude, startLatitude, endLongitude, endLatitude } = req.query;

    // Validação de entrada
    if (!startLongitude || !startLatitude || !endLongitude || !endLatitude) {
      return res.status(400).json({ message: "As coordenadas dos pontos inicial e final são obrigatórias." });
    }

    const startLong = parseFloat(startLongitude);
    const startLat = parseFloat(startLatitude);
    const endLong = parseFloat(endLongitude);
    const endLat = parseFloat(endLatitude);

    if ([startLong, startLat, endLong, endLat].some(coord => isNaN(coord))) {
      return res.status(400).json({ message: "As coordenadas devem ser números válidos." });
    }

    // Definir o polígono com os dois pontos e os extremos latitudinais
    const polygon = {
      type: "Polygon",
      coordinates: [[
        [startLong, startLat],
        [endLong, startLat], // Extensão lateral com a mesma latitude inicial
        [endLong, endLat],   // Coordenada final
        [startLong, endLat], // Extensão lateral com a mesma longitude inicial
        [startLong, startLat] // Fecha o polígono
      ]]
    };

    // Pesquisa livrarias dentro do polígono
    const livrarias = await db.collection('livrarias').find({
      "geometry": {
        $geoWithin: {
          $geometry: polygon
        }
      }
    }).toArray();

    if (livrarias.length === 0) {
      return res.status(404).json({ message: "Nenhuma livraria encontrada dentro da área do polígono." });
    }

    res.status(200).json(livrarias);
  } catch (error) {
    console.error("Erro ao pesquisar livrarias dentro da área da rota:", error);
    res.status(500).json({ message: "Erro ao pesquisar livrarias.", error: error.message || error });
  }
});

// Retornar número de livrarias perto de uma localização
router.get('/count', async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 500 } = req.query;

    // Validação dos parâmetros
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'As coordenadas "longitude" e "latitude" são obrigatórias.' });
    }

    const longitudeNum = parseFloat(longitude);
    const latitudeNum = parseFloat(latitude);
    const maxDist = parseFloat(maxDistance);

    if (isNaN(longitudeNum) || isNaN(latitudeNum) || isNaN(maxDist)) {
      return res.status(400).json({ message: 'As coordenadas e a distância máxima devem ser números válidos.' });
    }

    // Conversão de distância para radianos (maxDistance em metros)
    const earthRadiusInMeters = 6371000;
    const maxDistanceInRadians = maxDist / earthRadiusInMeters;

    // Consulta geoespacial usando $geoWithin e $centerSphere
    const count = await db.collection('livrarias').countDocuments({
      'geometry.type': 'Point',
      'geometry.coordinates': {
        $geoWithin: {
          $centerSphere: [[longitudeNum, latitudeNum], maxDistanceInRadians]
        }
      }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Erro ao contar livrarias próximas:', error);
    res.status(500).json({ message: 'Erro ao contar livrarias próximas.', error: error.message || error });
  }
});

// Verificar se o ponto do user está dentro da feira do livro
router.get('/userInFair', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    // Validação dos parâmetros
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'As coordenadas "longitude" e "latitude" são obrigatórias.' });
    }

    const longitudeNum = parseFloat(longitude);
    const latitudeNum = parseFloat(latitude);

    if (isNaN(longitudeNum) || isNaN(latitudeNum)) {
      return res.status(400).json({ message: 'As coordenadas devem ser números válidos.' });
    }

    // Definir o ponto do user
    const userPoint = {
      type: 'Point',
      coordinates: [longitudeNum, latitudeNum]
    };

    // Verificar interseção com o polígono da feira do livro
    const feira = await db.collection('livrarias').findOne({
      'geometry.type': 'Polygon', // Polígono da feira
      'geometry': {
        $geoIntersects: {
          $geometry: userPoint
        }
      }
    });

    if (!feira) {
      return res.status(404).json({ message: 'O user não está dentro da feira do livro.' });
    }

    res.status(200).json({
      message: 'O user está dentro da feira do livro.',
      location: feira.geometry.coordinates
    });
  } catch (error) {
    console.error('Erro ao verificar a localização do user:', error);
    res.status(500).json({ message: 'Erro ao verificar a localização.', error: error.message || error });
  }
});

// Consultar livros de uma livraria específica
router.get('/:id/books', async (req, res) => {
  try {
    
    const livrariaId = parseInt(req.params.id, 10);

    if (isNaN(livrariaId)) {
      return res.status(400).json({ message: 'O ID da livraria deve ser um número válido.' });
    }

    // Encontrar a livraria pelo ID
    const livraria = await db.collection('livrarias').findOne({ _id: livrariaId });

    if (!livraria) {
      return res.status(404).json({ message: 'Livraria não encontrada.' });
    }

    // Verificar se a livraria tem livros
    if (!livraria.books_available || livraria.books_available.length === 0) {
      return res.status(404).json({ message: 'Nenhum livro encontrado nesta livraria.' });
    }

    res.status(200).json({ 
      livraria: livraria.properties.INF_NOME,
      books: livraria.books_available
    });
  } catch (error) {
    console.error('Erro ao consultar livros da livraria:', error);
    res.status(500).json({ message: 'Erro ao consultar livros da livraria.', error: error.message || error });
  }
});

//POST

//Adicionar livros da lista (books.json) a cada livraria 
router.post('/addBooks', async (req, res) => {
  try {
    // Obter todos os livros da coleção 'books'
    const books = await db.collection('books').find({}, { projection: { _id: 1, title: 1 } }).toArray();

    if (books.length === 0) {
      return res.status(404).json({ message: 'Nenhum livro encontrado na coleção books.' });
    }

    // Obter todas as livrarias
    const livrarias = await db.collection('livrarias').find({}).toArray();

    if (livrarias.length === 0) {
      return res.status(404).json({ message: 'Nenhuma livraria encontrada na coleção livrarias.' });
    }

    // Atualizar cada livraria com os livros
    for (const livraria of livrarias) {
      await db.collection('livrarias').updateOne(
        { _id: livraria._id },
        { $set: { books_available: books } } // Adiciona array de livros
      );
    }

    res.status(200).json({ message: 'Livros adicionados a todas as livrarias com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar livros às livrarias:', error);
    res.status(500).json({ message: 'Erro ao adicionar livros às livrarias.', error: error.message || error });
  }
});




   export default router;