import { useState } from "react";
import { Card, Button, Container } from "react-bootstrap";
import styles from "../App.module.css";
import type { JSX } from "react";

// 🔒 tipagem explícita da constante (não só do retorno)
export const Home: () => JSX.Element = (): JSX.Element => {
  // 🔒 tipagem explícita dos bindings do useState
  const [forjas, setForjas]: [
    number,
    React.Dispatch<React.SetStateAction<number>>,
  ] = useState<number>(0);

  const [animar, setAnimar]: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
  ] = useState<boolean>(false);

  // 🔒 tipagem explícita da constante da função
  const incrementarForjas: () => void = (): void => {
    setForjas((prev: number): number => {
      const next: number = prev + 1;

      setAnimar(true);
      setTimeout((): void => setAnimar(false), 300);

      return next;
    });
  };

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
                onClick={incrementarForjas}
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
