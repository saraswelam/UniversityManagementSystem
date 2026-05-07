import '../StudentDashboard/StudentDashboard.css';

function StudentPlaceholderPage({ title }) {
  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-kicker">Coming soon</p>
          <h2>{title}</h2>
        </div>
      </section>
      <section className="student-panel">
        <p className="student-empty">This section is TBA.</p>
      </section>
    </div>
  );
}

export default StudentPlaceholderPage;
