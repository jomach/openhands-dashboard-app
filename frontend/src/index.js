const { Auth, Amplify } = window.aws_amplify;

Amplify.configure({
  Auth: {
    region: "us-east-1",
    userPoolId: "us-east-1_example",
    userPoolWebClientId: "exampleclientappid123"
  }
});

function App() {
  const [user, setUser] = React.useState(null);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [dashboards, setDashboards] = React.useState([]);
  const [providers, setProviders] = React.useState([]);
  const [providerId, setProviderId] = React.useState("");
  const [providerName, setProviderName] = React.useState("");

  React.useEffect(() => {
    if (user) {
      fetch("http://localhost:55222/dashboards")
        .then(res => res.json())
        .then(data => setDashboards(data));
      fetch("http://localhost:55222/providers")
        .then(res => res.json())
        .then(data => setProviders(data));
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await Auth.signIn(username, password);
      setUser(userData);
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleLogout = async () => {
    await Auth.signOut();
    setUser(null);
  };

  const addProvider = async () => {
    if (!providerId || !providerName) {
      alert("Fill in provider id and name");
      return;
    }
    const data = {
      id: parseInt(providerId),
      name: providerName,
      config: {}
    };
    const res = await fetch("http://localhost:55222/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert("Provider added");
      fetch("http://localhost:55222/providers")
        .then(res => res.json())
        .then(data => setProviders(data));
    } else {
      alert(result.detail || "Error adding provider");
    }
  };

  const removeProvider = async (id) => {
    const res = await fetch(`http://localhost:55222/providers/${id}`, {
      method: "DELETE"
    });
    const result = await res.json();
    if (res.ok) {
      alert("Provider removed");
      fetch("http://localhost:55222/providers")
        .then(res => res.json())
        .then(data => setProviders(data));
    } else {
      alert(result.detail || "Error removing provider");
    }
  };

  if (!user) {
    return (
      <div>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /><br />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
      <h2>Dashboards</h2>
      {dashboards.map(d => (
        <div key={d.id}>
          <h3>{d.title}</h3>
          <p>{d.data}</p>
        </div>
      ))}
      <h2>Data Providers</h2>
      <ul>
        {providers.map(p => (
          <li key={p.id}>
            {p.name} <button onClick={() => removeProvider(p.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <h3>Add Provider</h3>
      <input placeholder="Provider ID" value={providerId} onChange={e => setProviderId(e.target.value)} /><br />
      <input placeholder="Provider Name" value={providerName} onChange={e => setProviderName(e.target.value)} /><br />
      <button onClick={addProvider}>Add Provider</button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
