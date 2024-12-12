import React, { useState, useEffect } from "react";
import CardGroup from "react-bootstrap/CardGroup";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import UserCard from "../components/UserCard";

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getUsers = async (page = 1) => {
    try {
      const response = await fetch(`http://localhost:3000/users?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log(data);

      // Atualizar o estado com os dados retornados pelo backend
      setUsers(data.data || []);
      setCurrentPage(data.currentPage || page);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    getUsers(currentPage);
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
      <h2>Users</h2>
      <CardGroup>
        <Row xs={1} md={2} className="d-flex justify-content-around">
          {users.map((user) => (
            <UserCard key={user._id} {...user} />
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
 