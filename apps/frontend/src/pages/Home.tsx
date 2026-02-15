import { useEffect, useState } from "react";
import { Card, Button, Container } from "react-bootstrap";
import styles from "../App.module.css";

export const Home = () => {
  const [forjas, setForjas] = useState(0);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    if (forjas === 0) return;

    setAnimar(true);
    const timer = setTimeout(() => setAnimar(false), 300);

    return () => clearTimeout(timer);
  }, [forjas]);

  return (
    <main className={styles.home_container}>
      <Container>
        {/* Hero */}
        <section className={styles.hero}>
          <h1>🔥 Forge</h1>
          <p>Onde ideias são forjadas em projetos reais. 🔨</p>
        </section>

        {/* Contador de forjas */}
        <section className={styles.forge_counter}>
          <Card className={styles.counter_card}>
            <Card.Body className="text-center">
              <h2 className={styles.counter_title}>⚒️ Forjas realizadas</h2>

              <div
                className={`${styles.counter_number} ${
                  animar ? styles.counter_pop : ""
                }`}
              >
                🔥 {forjas}
              </div>

              <p className="mb-3">
                Cada clique representa uma nova criação forjada.
              </p>

              <Button
                variant="outline-primary"
                size="lg"
                onClick={() => setForjas((prev) => prev + 1)}
              >
                Forjar agora 🔨
              </Button>
            </Card.Body>
          </Card>
        </section>
      </Container>
    </main>
  );
};
