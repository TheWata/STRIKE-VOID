function getHealth(_req, res) {
  res.json({ status: 'online', game: 'STRIKE/VOID v2 (MVC)' });
}

module.exports = {
  getHealth,
};
