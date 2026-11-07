import './About.css';

function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>About Ermi Dealership</h1>
        <p>Trusted quality, transparent pricing, and a better way to buy and sell used vehicles.</p>
      </section>

      <section className="about-content">
        <div className="about-block">
          <h2>Our Story</h2>
          <p>
            Ermi Dealership was founded with a simple goal: make buying and selling used
            vehicles straightforward, transparent, and stress-free. We inspect every vehicle
            thoroughly, price it fairly, and support you through every step of the process —
            from browsing to reservation to test drive.
          </p>
        </div>

        <div className="about-block">
          <h2>Why Choose Us</h2>
          <div className="about-values">
            <div className="value-card">
              <h3>Quality Assured</h3>
              <p>Every vehicle is inspected and verified before it's listed.</p>
            </div>
            <div className="value-card">
              <h3>Transparent Pricing</h3>
              <p>No hidden fees. What you see is what you pay.</p>
            </div>
            <div className="value-card">
              <h3>Real-Time Support</h3>
              <p>Chat directly with our sales team to negotiate and ask questions.</p>
            </div>
            <div className="value-card">
              <h3>Easy Reservations</h3>
              <p>Reserve a vehicle online and book a test drive in minutes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
