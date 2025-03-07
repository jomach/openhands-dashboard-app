import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Auth, Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: "us-east-1",
    userPoolId: "us-east-1_example",
    userPoolWebClientId: "exampleclientappid123"
  }
});

export function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dashboards, setDashboards] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetch("http://localhost:55222/dashboards?page=" + currentPage + "&page_size=5")
        .then(res => res.json())
        .then(data => setDashboards(data));
      fetch("http://localhost:55222/providers")
        .then(res => res.json())
        .then(data => setProviders(data));
    }
  }, [user, currentPage]);

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
          <div style={{ margin: "10px 0" }}>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Previous</button>
            <span style={{ margin: "0 10px" }}>Page {currentPage}</span>
            <button onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
          </div>

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

if (typeof document !== 'undefined') {
  ReactDOM.render(<App />, document.getElementById('root'));
}

