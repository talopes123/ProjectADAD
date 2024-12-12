import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";

export default function BookDetails() {
  const { id } = useParams();
  const [bookDetails, setBookDetails] = useState(null);
  const navigate = useNavigate();

  const fetchBookDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/books/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBookDetails(data); // Assume que a resposta inclui `book` e `averageScore`
      } else {
        console.error("Failed to fetch book details. Status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching book details:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBookDetails(id);
    }
  }, [id]);

  if (!bookDetails) {
    return (
      <Container className="pt-5 pb-5">
        <h2>Loading...</h2>
      </Container>
    );
  }

  const { book, averageScore } = bookDetails;

  return (
    <Container className="pt-5 pb-5">
      <Card
        className="mb-3"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          borderRadius: "10px",
        }}
      >
        <Card.Img
          variant="top"
          src={book.thumbnailUrl}
          alt={book.title}
          style={{
            maxHeight: "400px",
            width: "100%",
            objectFit: "contain",
            objectPosition: "center",
          }}
        />
        <Card.Body>
          <Card.Title style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {book.title}
          </Card.Title>
          <Card.Text style={{ fontSize: "1.2rem" }}>
            <strong>ID:</strong> {book._id}
            <br />
            <strong>Authors:</strong> {book.authors?.join(", ")}
            <br />
            <strong>Categories:</strong> {book.categories?.join(", ")}
            <br />
            <strong>ISBN:</strong> {book.isbn}
            <br />
            <strong>Page Count:</strong> {book.pageCount}
            <br />
            <strong>Published Date:</strong>{" "}
            {new Date(book.publishedDate).toLocaleDateString() || "Unknown"}
            <br />
            <strong>Average Score:</strong> {averageScore?.toFixed(2) || "N/A"}
            <br />
            <strong>Description:</strong> {book.longDescription}
          </Card.Text>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}
