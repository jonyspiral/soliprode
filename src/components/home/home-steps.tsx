export type HomeLandingStep = {
  step: string;
  title: string;
  description: string;
};

type HomeStepsProps = {
  steps: readonly HomeLandingStep[];
};

export function HomeSteps({ steps }: HomeStepsProps) {
  return (
    <section className="home-landing-steps">
      {steps.map((item) => (
        <article key={item.step} className="home-landing-step-card">
          <p className="home-landing-step-label">{item.step}</p>
          <h3 className="home-landing-step-title">{item.title}</h3>
          <p className="home-landing-step-copy">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
