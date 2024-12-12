import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

function UserCard(props) {
  const userQuery = new URLSearchParams({
    name: `${props.first_name} ${props.last_name}`,
    id: props._id,
    reviews: JSON.stringify(props.reviews),
    job: props.job,
    year_of_birth: props.year_of_birth,
  }).toString();

  return (
    <Card
      style={{
        width: "18rem",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        border: "1px solid #e0e0e0",
        overflow: "hidden",
      }}
      className="mb-3"
    >
      <Card.Body>
        <Card.Title style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          {props.first_name} {props.last_name}
        </Card.Title>
        <Card.Text style={{ fontSize: "0.85rem", color: "#6c757d" }}>
          <strong>ID:</strong> {props._id}
          <br />
          <strong>Number of Reviews:</strong> {props.reviews?.length || 0}
        </Card.Text>
        <div
          className="d-flex justify-content-center"
          style={{
            backgroundColor: "#f8f9fa",
            padding: "10px",
            borderTop: "1px solid #e0e0e0",
            boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Button
            href={`/user/${props._id}?${userQuery}`}
            variant="outline-primary"
            style={{ width: "100%" }}
          >
            View User Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default UserCard;
