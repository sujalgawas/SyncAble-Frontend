const featuresData = [
    {
      title: "🎓 Student Portal",
      description: "Select courses, set preferences, and instantly preview personalized timetables."
    },
    {
      title: "👩 Teacher Portal",
      description: "Mark availability slots and subject load to avoid scheduling conflicts."
    },
    {
      title: "⚡ Fast Generation",
      description: "AI generates optimized timetables within seconds."
    },
    {
      title: "📅 Clash-Free Scheduling",
      description: "Automatic conflict detection ensures smooth weekly timetables."
    }
  ];
  const Features = () => {
    return (
      <section id="features" className="features">
        {featuresData.map((feature, idx) => (
          <article key={idx} className="card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    );
  };
export default Features  