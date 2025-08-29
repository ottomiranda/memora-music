const { execSync } = require("child_process");

function check(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`, { stdio: "pipe" }).toString().trim();
    if (out.length) {
      console.error(`Falha: porta ${port} está ocupada`);
      process.exit(1);
    }
  } catch {}
}

check(3337);
check(5173);
console.log("OK: portas 3337 e 5173 livres.");