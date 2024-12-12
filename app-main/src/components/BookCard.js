import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

function BookCard(props) {
  return (
    <Card
      style={{
        width: "18rem",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        border: "1px solid #e0e0e0",
      }}
      className="mb-3"
    >
      <Card.Body>
        <Card.Title style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          {props.title}
        </Card.Title>
        <Card.Text style={{ fontSize: "0.85rem", color: "#6c757d" }}>
          <strong>ID:</strong> {props._id}
          <br />
          <strong>Status:</strong> {props.status || "Not specified"}
        </Card.Text>
        <ListGroup variant="flush" style={{ fontSize: "0.85rem" }}>
          <ListGroup.Item>
            <strong>Authors:</strong> {props.authors?.join(", ") || "N/A"}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Categories:</strong> {props.categories?.join(", ") || "N/A"}
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
      <Card.Footer
        style={{
          backgroundColor: "#f8f9fa",
          textAlign: "center",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Button
          href={"/book/" + props._id}
          variant="outline-primary"
          style={{ width: "100%" }}
        >
          View Details
        </Button>
      </Card.Footer>
    </Card>
  );
}

export default BookCard;
