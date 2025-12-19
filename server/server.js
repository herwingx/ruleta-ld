const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const dbPath = path.resolve(__dirname, 'santa_v2.db');
const db = new sqlite3.Database(dbPath);

// Load participants
const participantsPath = process.env.PARTICIPANTS_FILE || path.join(__dirname, 'participants.json');
// Helper to load participants freshly (for hot-reloading)
const getParticipantsData = () => {
  try {
    return JSON.parse(fs.readFileSync(participantsPath, 'utf8'));
  } catch (err) {
    console.error("Error reading participants file:", err);
    return [];
  }
};

// Initialize DB
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS matches (spinner_id TEXT PRIMARY KEY, receiver_id TEXT)");
});

// Helper: Get Participant Name
const getName = (id) => {
  const p = getParticipantsData().find(p => p.id === String(id));
  return p ? p.name : "Unknown";
};

// Routes

// Get all participants (for identification)
app.get('/api/participants', (req, res) => {
  res.json(getParticipantsData().map(p => ({ id: p.id, name: p.name })));
});

// Check status (if already played)
app.get('/api/status/:id', (req, res) => {
  const spinnerId = req.params.id;

  db.get("SELECT receiver_id FROM matches WHERE spinner_id = ?", [spinnerId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // Already assigned
      const receiver = getParticipantsData().find(p => p.id === row.receiver_id);
      return res.json({
        hasPlayed: true,
        receiverName: receiver ? receiver.name : "Unknown",
        receiverId: row.receiver_id
      });
    }

    // Not played yet
    res.json({ hasPlayed: false });
  });
});

// Spin the wheel
app.post('/api/spin', (req, res) => {
  const { spinnerId } = req.body;

  if (!spinnerId) {
    return res.status(400).json({ error: "Spinner ID required" });
  }

  db.get("SELECT receiver_id FROM matches WHERE spinner_id = ?", [spinnerId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // Already assigned
      const receiver = getParticipantsData().find(p => p.id === row.receiver_id);
      return res.json({
        receiverId: row.receiver_id,
        receiverName: receiver ? receiver.name : "Unknown",
        alreadyAssigned: true
      });
    }

    // New Spin Logic
    // Get all assigned receiver IDs
    db.all("SELECT receiver_id FROM matches", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const assignedReceiverIds = new Set(rows.map(r => r.receiver_id));

      // Calculate available candidates
      // Candidate must not be the spinner
      // Candidate must not be already assigned to someone else
      let available = getParticipantsData().filter(p =>
        p.id !== String(spinnerId) && !assignedReceiverIds.has(p.id)
      );

      if (available.length === 0) {
        // Edge case: No one left (or only self if logic failed previously). 
        // In simple greedy, if only I am left and I haven't been assigned, I can't be assigned to myself.
        // This requires manual admin intervention or a restart in this simple implementation.
        return res.status(409).json({ error: "No available recipients! The chain is stuck." });
      }

      // Random selection
      const randomIndex = Math.floor(Math.random() * available.length);
      const winner = available[randomIndex];

      // Save match
      const stmt = db.prepare("INSERT INTO matches (spinner_id, receiver_id) VALUES (?, ?)");
      stmt.run(spinnerId, winner.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          receiverId: winner.id,
          receiverName: winner.name,
          alreadyAssigned: false
        });
      });
      stmt.finalize();
    });
  });
});

// Reset (Optional, for admin/dev)
app.post('/api/reset', (req, res) => {
  db.run("DELETE FROM matches", [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Reset successful" });
  });
});

// Admin: Get all matches (protected with password)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'herwingx-dev';

// Admin: Add new participant (without restarting server)
app.post('/api/admin/add-participant', (req, res) => {
  const { password, name } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre es requerido" });
  }

  try {
    const participants = getParticipantsData();

    // Generate new ID (max ID + 1)
    const maxId = participants.reduce((max, p) => Math.max(max, parseInt(p.id) || 0), 0);
    const newId = String(maxId + 1);

    // Check if name already exists
    const normalizedName = name.trim().toUpperCase();
    const exists = participants.some(p => p.name.toUpperCase() === normalizedName);
    if (exists) {
      return res.status(409).json({ error: "Este participante ya existe" });
    }

    // Add new participant
    const newParticipant = { id: newId, name: name.trim().toUpperCase() };
    participants.push(newParticipant);

    // Save to file
    fs.writeFileSync(participantsPath, JSON.stringify(participants, null, 2), 'utf8');

    console.log(`✅ Nuevo participante agregado: ${newParticipant.name} (ID: ${newId})`);

    res.json({
      message: "Participante agregado exitosamente",
      participant: newParticipant,
      total: participants.length
    });
  } catch (err) {
    console.error("Error adding participant:", err);
    res.status(500).json({ error: "Error al guardar participante" });
  }
});

app.post('/api/admin/matches', (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  db.all("SELECT spinner_id, receiver_id FROM matches", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const matches = rows.map(row => ({
      spinner: getName(row.spinner_id),
      spinnerId: row.spinner_id,
      receiver: getName(row.receiver_id),
      receiverId: row.receiver_id
    }));

    // Also get participants who haven't spun yet
    const spinnerIds = new Set(rows.map(r => r.spinner_id));
    const participants = getParticipantsData();
    const pending = participants
      .filter(p => !spinnerIds.has(p.id))
      .map(p => ({ id: p.id, name: p.name }));

    res.json({
      matches,
      pending,
      total: participants.length,
      completed: rows.length
    });
  });
});

// SPA Catch-all
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
