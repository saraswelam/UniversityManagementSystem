function App() {
  return (
    <main className="app-shell">
      <section className="dashboard">
        <div>
          <p className="eyebrow">University Management System</p>
          <h1>UMS Frontend</h1>
          <p className="intro">
            React is ready. The backend API should be running on port 5000.
          </p>
        </div>

        <div className="status-panel">
          <span className="status-dot" />
          <span>Ready for Sprint 1</span>
        </div>
      </section>
    </main>
  );
}

export default App;
