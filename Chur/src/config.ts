export const config = {
  port:          Number(process.env.PORT         ?? 3000),
  jwtSecret:     process.env.JWT_SECRET          ?? 'dev-secret-change-in-prod',
  jwtExpiry:     process.env.JWT_EXPIRY          ?? '8h',
  corsOrigin:    process.env.CORS_ORIGIN         ?? 'http://localhost:5173',
  arcadeUrl:     process.env.ARCADEDB_URL        ?? 'http://localhost:2480',
  arcadeDb:      process.env.ARCADEDB_DB         ?? 'hound',
  arcadeUser:    process.env.ARCADEDB_USER       ?? 'root',
  arcadePass:    process.env.ARCADEDB_PASS       ?? 'playwithdata',
} as const;
