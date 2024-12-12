import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

export default function UserDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [topBooks, setTopBooks] = useState([]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const name = query.get("name") || "Unknown User"; 
    const job = query.get("job") || "Not specified"; 
    const year_of_birth = query.get("year_of_birth") || "Unknown";  

    let reviews = [];
    try {
      reviews = JSON.parse(query.get("reviews") || "[]");
    } catch (error) {
      console.warn("Invalid reviews format, defaulting to an empty array:", error);
      reviews = [];
    }

    setUser({ id, name, job, year_of_birth, reviews });

    const fetchTopBooks = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${id}`);
        if (response.ok) {
          const data = await response.json();
          setTopBooks(data.topBooks || []);
        }
      } catch (error) {
        console.error("Error fetching top books:", error);
      }
    };

    fetchTopBooks();
  }, [id, location.search]);

  const handleDeleteUser = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:3000/users/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          alert("User deleted successfully.");
          navigate(-1);
        } else {
          alert("Failed to delete user.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while trying to delete the user.");
      }
    }
  };

  if (!user) {
    return (
      <Container className="pt-5 pb-5">
        <h2>Loading...</h2>
      </Container>
    );
  }

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
        <Card.Body>
          <Card.Title>{user.name}</Card.Title>
          <Card.Text>
            <strong>ID:</strong> {user.id}
            <br />
            <strong>Job:</strong> {user.job}
            <br />
            <strong>Year Of Birth:</strong> {user.year_of_birth}
            <br />
            <strong>Number Of Reviews:</strong> {user.reviews.length}
            <br />
          </Card.Text>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </Card.Body>
      </Card>

      <h3 className="mt-4"> User Top Books</h3>
      <Row className="mt-3">
        {topBooks.map((book) => (
          <Col xs={6} md={3} lg={2} key={book._id}>
            <Card className="mb-3" style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)" }}>
              <Card.Img
                variant="top"
                src={book.thumbnailUrl}
                alt={book.title}
                style={{
                  height: "250px",
                  objectFit: "contain", // Garante que a imagem seja totalmente visível
                  objectPosition: "center",
                }}
              />
              <Card.Body>
                <Card.Title>{book.title}</Card.Title>
                <Card.Text>
                  <strong>Score:</strong> {book.score}
                  <br />
                  <strong>Authors:</strong> {book.authors.join(", ")}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
