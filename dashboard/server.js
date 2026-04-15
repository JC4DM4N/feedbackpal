const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = 3001;

const pool = new Pool({
  host: process.env.DB_HOST || '172.236.21.178',
  port: process.env.DB_PORT || 5442,
  database: process.env.DB_NAME || 'nitpickr',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: false,
});

app.use(express.static(path.join(__dirname)));

app.get('/api/users-per-day', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS count
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reviews-completed-per-day', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE(created_date) AS day,
        COUNT(*) AS count
      FROM reviews
      WHERE is_complete = TRUE
      GROUP BY DATE(created_date)
      ORDER BY day ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/active-reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        a.name AS app_name,
        u_reviewer.username AS reviewer,
        u_owner.username AS app_owner,
        r.created_date,
        r.reviewer_deadline,
        r.owner_deadline,
        r.is_submitted,
        r.review_requested,
        r.feedback,
        r.owner_message,
        a.request AS app_request
      FROM reviews r
      JOIN apps a ON r.app_id = a.id
      JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
      JOIN users u_owner ON a.owner_id = u_owner.id
      WHERE r.is_complete = FALSE AND r.is_rejected = FALSE
      ORDER BY r.created_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/completed-reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        a.name AS app_name,
        u_reviewer.username AS reviewer,
        u_owner.username AS app_owner,
        r.created_date,
        r.owner_deadline,
        r.reviewer_deadline,
        r.review_requested,
        r.feedback,
        r.owner_message,
        a.request AS app_request
      FROM reviews r
      JOIN apps a ON r.app_id = a.id
      JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
      JOIN users u_owner ON a.owner_id = u_owner.id
      WHERE r.is_complete = TRUE
      ORDER BY r.created_date DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
