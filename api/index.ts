/**
 * Express server entry point
 */
import app from './app';

const PORT = process.env.PORT || 3337;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});