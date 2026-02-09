import { Card, Button, Form, Row, Col } from 'react-bootstrap';

import styles from "../App.module.css";// estilos devem ser salvos com o nome "*.module.css ou *.module.sass"

export const Home = () => {
    return (
        <>
            <main className={styles.container_login}>
                <section>
                    
                    <Card.Header><h1>Login</h1></Card.Header>
                    <Card.Body>
                            <Form>
                                <Form.Group as={Row} className="mb-3" controlId="formPlaintextEmail">
                                    <Form.Label column sm="2">
                                        Email
                                    </Form.Label>
                                    <Col sm="10">
                                        <Form.Control plaintext readOnly defaultValue="email@example.com" />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="formPlaintextPassword">
                                    <Form.Label column sm="2">
                                        Password
                                    </Form.Label>
                                    <Col sm="10">
                                        <Form.Control type="password" placeholder="Password" />
                                    </Col>
                                </Form.Group>
                            </Form>
                        <Button variant="primary">Go somewhere</Button>
                    </Card.Body>
                </section>
            </main>
        </>
    )
}