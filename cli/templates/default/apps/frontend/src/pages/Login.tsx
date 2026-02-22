import { Card, Button, Form, Row, Col } from "react-bootstrap";
import { useState } from "react";

import styles from "../App.module.css"; // estilos devem ser salvos com o nome "*.module.css ou *.module.sass"

export const Login = () => {
  const [email, setEmail] = useState("");
  //const[password, setPassword] = useState("");

  function submitForm() {
    console.log(email);
    setEmail("");
  }

  return (
    <>
      <main className={styles.container_login}>
        <section className={styles.login_box}>
          <Card.Header>
            <h1>Login</h1>
          </Card.Header>
          <Card.Body>
            <Form>
              <Form.Group as={Row} className="mb-3" controlId="email">
                <Form.Label column sm="3">
                  E-mail
                </Form.Label>
                <Col sm="9">
                  <Form.Control
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3" controlId="passwordLogin">
                <Form.Label column sm="3">
                  Senha
                </Form.Label>
                <Col sm="9">
                  <Form.Control type="password" placeholder="******" />
                </Col>
              </Form.Group>
            </Form>

            <Button
              variant="primary"
              className="w-100 mt-3"
              onClick={() => {
                submitForm();
              }}
            >
              Entrar
            </Button>
          </Card.Body>
        </section>
      </main>
    </>
  );
};
