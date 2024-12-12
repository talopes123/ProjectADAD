import React, { useState, useEffect } from "react";
import CardGroup from "react-bootstrap/CardGroup";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import BookCard from "../components/BookCard";

export default function App() {
  const [books, setBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getBooks = async (page = 1) => {
    try {
      const response = await fetch(`http://localhost:3000/books?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log(data);

      // Atualizar o estado com os dados retornados pelo backend
      setBooks(data.data || []);
      setCurrentPage(data.currentPage || page);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    getBooks(currentPage);
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container pt-5 pb-5">
      <h2>Books</h2>
      <CardGroup>
        <Row xs={1} md={2} className="d-flex justify-content-around">
          {books.map((book) => (
            <BookCard key={book._id} {...book} />
          ))}
        </Row>
      </CardGroup>
      <div className="d-flex justify-content-between mt-4">
        <Button
          variant="outline-primary"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline-primary"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
